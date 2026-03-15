#!/usr/bin/env tsx
/**
 * Pre-deployment validation script.
 * Runs sanity checks before deploying to production.
 * Exit code 0 = all checks passed, non-zero = failure.
 */

import { execSync, exec } from "child_process";
import { existsSync, statSync, readdirSync } from "fs";
import { join, extname } from "path";
import { promisify } from "util";
import zlib from "zlib";
import fs from "fs";

const execAsync = promisify(exec);

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: CheckResult[] = [];
const ROOT = process.cwd();
const BUNDLE_SIZE_LIMIT_KB = 200; // gzip limit for largest JS chunk

function check(name: string, fn: () => boolean | string): void {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      results.push({ name, passed: true, message: "OK" });
    } else if (typeof result === "string") {
      results.push({ name, passed: false, message: result });
    } else {
      results.push({ name, passed: false, message: "Check returned false" });
    }
  } catch (err) {
    results.push({ name, passed: false, message: err instanceof Error ? err.message : String(err) });
  }
}

async function checkAsync(name: string, fn: () => Promise<boolean | string>): Promise<void> {
  try {
    const result = await fn();
    if (result === true || result === undefined) {
      results.push({ name, passed: true, message: "OK" });
    } else if (typeof result === "string") {
      results.push({ name, passed: false, message: result });
    } else {
      results.push({ name, passed: false, message: "Check returned false" });
    }
  } catch (err) {
    results.push({ name, passed: false, message: err instanceof Error ? err.message : String(err) });
  }
}

// ── Environment variables ──────────────────────────────────────────
check("Required env vars present", () => {
  const required = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) return `Missing: ${missing.join(", ")}`;
  return true;
});

check("JWT_SECRET minimum entropy (32 chars)", () => {
  const secret = process.env.JWT_SECRET || "";
  if (secret.length < 32) return `JWT_SECRET too short (${secret.length} chars, need ≥32)`;
  return true;
});

check("JWT_REFRESH_SECRET minimum entropy (32 chars)", () => {
  const secret = process.env.JWT_REFRESH_SECRET || "";
  if (secret.length < 32) return `JWT_REFRESH_SECRET too short (${secret.length} chars, need ≥32)`;
  return true;
});

check("Stripe test key not used in production", () => {
  if (process.env.NODE_ENV === "production" && process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    return "Stripe TEST key detected in production environment";
  }
  return true;
});

// ── Critical files ─────────────────────────────────────────────────
const criticalFiles = [
  "artifacts/api-server/src/index.ts",
  "artifacts/api-server/src/app.ts",
  "artifacts/api-server/src/routes/auth.ts",
  "artifacts/api-server/src/routes/packs.ts",
  "artifacts/api-server/src/routes/checkout.ts",
  "artifacts/api-server/src/routes/admin.ts",
  "artifacts/api-server/src/utils/logger.ts",
  "artifacts/api-server/src/middlewares/auth.ts",
  "artifacts/api-server/src/lib/cache.ts",
  "artifacts/api-server/src/lib/serialize.ts",
  "artifacts/api-server/src/lib/sentry.ts",
  "lib/db/src/schema/packs.ts",
  "lib/db/src/schema/orders.ts",
  "lib/db/src/schema/prompts.ts",
  "lib/db/src/schema/reviews.ts",
  "artifacts/promptvault/src/App.tsx",
  "artifacts/promptvault/src/lib/query-keys.ts",
  "artifacts/promptvault/src/lib/sentry.ts",
];

check("All critical files exist", () => {
  const missing = criticalFiles.filter(f => !existsSync(join(ROOT, f)));
  if (missing.length > 0) return `Missing files: ${missing.join(", ")}`;
  return true;
});

// ── No console.log in server code ─────────────────────────────────
check("No console.log in server source", () => {
  try {
    const result = execSync(
      "grep -rn 'console\\.log\\|console\\.warn\\|console\\.error' artifacts/api-server/src --include='*.ts' | grep -v 'src/tests' | grep -v '\\(Filtered\\)'",
      { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    if (result.trim()) {
      const lines = result.trim().split("\n").filter(l => !l.includes("//")).slice(0, 5);
      if (lines.some(l => l.trim())) return `console.* calls found (use logger):\n${lines.join("\n")}`;
    }
    return true;
  } catch {
    return true;
  }
});

// ── No hardcoded secrets ───────────────────────────────────────────
check("No hardcoded secrets in source", () => {
  const patterns = ["sk_live_", "whsec_live_", "password123", "secret123"];
  const found: string[] = [];
  for (const p of patterns) {
    try {
      const out = execSync(
        `grep -rn "${p}" artifacts lib --include="*.ts" --include="*.tsx" 2>/dev/null`,
        { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
      );
      if (out.trim()) found.push(p);
    } catch {}
  }
  if (found.length > 0) return `Hardcoded secrets found: ${found.join(", ")}`;
  return true;
});

// ── TypeScript ─────────────────────────────────────────────────────
check("TypeScript compiles without errors (api-server)", () => {
  try {
    execSync("pnpm --filter @workspace/api-server exec tsc --noEmit", {
      cwd: ROOT, encoding: "utf8", stdio: "pipe",
    });
    return true;
  } catch (err: unknown) {
    const isErrorWithOutput = err && typeof err === "object" && ("stdout" in err || "stderr" in err);
    const stdout = isErrorWithOutput && "stdout" in err && typeof err.stdout === "string" ? err.stdout : "";
    const stderr = isErrorWithOutput && "stderr" in err && typeof err.stderr === "string" ? err.stderr : "";
    const output = (stdout || stderr || "").slice(0, 500);
    return `TypeScript errors:\n${output}`;
  }
});

// ── Frontend build ─────────────────────────────────────────────────
check("Frontend builds successfully", () => {
  try {
    execSync("pnpm --filter @workspace/promptvault run build", {
      cwd: ROOT, encoding: "utf8", stdio: "pipe",
    });
    return true;
  } catch (err: unknown) {
    const isErrorWithOutput = err && typeof err === "object" && ("stdout" in err || "stderr" in err);
    const stdout = isErrorWithOutput && "stdout" in err && typeof err.stdout === "string" ? err.stdout : "";
    const stderr = isErrorWithOutput && "stderr" in err && typeof err.stderr === "string" ? err.stderr : "";
    const output = (stdout || stderr || "").slice(0, 500);
    return `Build failed:\n${output}`;
  }
});

check("Build output dist/index.html exists", () => {
  if (!existsSync(join(ROOT, "artifacts/promptvault/dist/index.html"))) {
    return "dist/index.html not found — build may have failed silently";
  }
  return true;
});

// ── Bundle size check (gzip) ───────────────────────────────────────
check(`Largest JS chunk is under ${BUNDLE_SIZE_LIMIT_KB}KB gzip`, () => {
  const distDir = join(ROOT, "artifacts/promptvault/dist/assets");
  if (!existsSync(distDir)) return "dist/assets/ not found — run build first";

  const jsFiles = readdirSync(distDir).filter(f => extname(f) === ".js");
  if (jsFiles.length === 0) return "No JS files found in dist/assets/";

  let maxSizeKB = 0;
  let maxFile = "";
  for (const file of jsFiles) {
    const content = fs.readFileSync(join(distDir, file));
    const compressed = zlib.gzipSync(content);
    const sizeKB = compressed.length / 1024;
    if (sizeKB > maxSizeKB) {
      maxSizeKB = sizeKB;
      maxFile = file;
    }
  }

  if (maxSizeKB > BUNDLE_SIZE_LIMIT_KB) {
    return `Largest chunk "${maxFile}" is ${maxSizeKB.toFixed(1)}KB gzip (limit: ${BUNDLE_SIZE_LIMIT_KB}KB). Use code splitting.`;
  }

  console.log(`   ✓ Largest chunk: ${maxFile} (${maxSizeKB.toFixed(1)}KB gzip)`);
  return true;
});

// ── Database ───────────────────────────────────────────────────────
check("DATABASE_URL format is valid", () => {
  const url = process.env.DATABASE_URL || "";
  if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
    return `DATABASE_URL format invalid (expected postgres://)`;
  }
  return true;
});

// ── Security curl smoke tests ──────────────────────────────────────
const API_URL = process.env.API_URL || "http://localhost:5000";

await checkAsync("Smoke: /api/healthz returns 200", async () => {
  try {
    const { stdout } = await execAsync(`curl -sf -o /dev/null -w "%{http_code}" ${API_URL}/api/healthz`, { timeout: 5000 });
    if (stdout.trim() !== "200") return `Expected 200, got: ${stdout.trim()}`;
    return true;
  } catch {
    return "API server not reachable — start server first";
  }
});

await checkAsync("Smoke: /api/auth/me returns 401 without token", async () => {
  try {
    const { stdout } = await execAsync(`curl -sf -o /dev/null -w "%{http_code}" ${API_URL}/api/auth/me`, { timeout: 5000 });
    if (stdout.trim() !== "401") return `Expected 401 (unauthenticated), got: ${stdout.trim()}`;
    return true;
  } catch {
    return "API server not reachable — start server first";
  }
});

await checkAsync("Smoke: /api/admin/dashboard returns 401 without token", async () => {
  try {
    const { stdout } = await execAsync(`curl -sf -o /dev/null -w "%{http_code}" ${API_URL}/api/admin/dashboard`, { timeout: 5000 });
    if (stdout.trim() !== "401") return `Expected 401, got: ${stdout.trim()}`;
    return true;
  } catch {
    return "API server not reachable — start server first";
  }
});

await checkAsync("Smoke: /api/packs returns 200 and valid JSON", async () => {
  try {
    const { stdout } = await execAsync(`curl -sf -w "\\n%{http_code}" ${API_URL}/api/packs`, { timeout: 5000 });
    const lines = stdout.trim().split("\n");
    const code = lines[lines.length - 1];
    const body = lines.slice(0, -1).join("\n");
    if (code !== "200") return `Expected 200, got: ${code}`;
    JSON.parse(body); // throws if invalid JSON
    return true;
  } catch (err) {
    return `API server not reachable or invalid JSON: ${err}`;
  }
});

// ── Report ─────────────────────────────────────────────────────────
console.log("\n🔍 Pre-deploy Check Results\n" + "=".repeat(60));
const passed = results.filter(r => r.passed);
const failed = results.filter(r => !r.passed);

for (const r of results) {
  const icon = r.passed ? "✅" : "❌";
  console.log(`${icon} ${r.name}`);
  if (!r.passed) console.log(`   → ${r.message}`);
}

console.log("\n" + "=".repeat(60));
console.log(`${passed.length}/${results.length} checks passed`);

if (failed.length > 0) {
  console.error(`\n❌ ${failed.length} check(s) failed. Fix before deploying.\n`);
  process.exit(1);
} else {
  console.log("\n✅ All checks passed. Safe to deploy.\n");
  console.log("Note: Run Lighthouse audit separately from Chrome DevTools (target ≥ 90).\n");
  process.exit(0);
}
