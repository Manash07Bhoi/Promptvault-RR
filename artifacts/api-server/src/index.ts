import http from "http";
import app from "./app";
import { logger } from "./utils/logger.js";
import { initSentry } from "./lib/sentry.js";

// Initialize Sentry before anything else (if DSN configured)
initSentry();

const isProd = process.env.NODE_ENV === "production";
const REQUIRED_ENV_VARS = isProd
  ? ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"]
  : ["DATABASE_URL"];
const RECOMMENDED_ENV_VARS = ["JWT_SECRET", "JWT_REFRESH_SECRET", "ANTHROPIC_API_KEY", "STRIPE_SECRET_KEY", "RESEND_API_KEY", "SENTRY_DSN"];

const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

// In production, enforce entropy — in dev, defaults in auth.ts are used
if (isProd) {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error("FATAL: JWT_SECRET must be at least 32 characters");
    process.exit(1);
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    console.error("FATAL: JWT_REFRESH_SECRET must be at least 32 characters");
    process.exit(1);
  }
}

const missingRecommended = RECOMMENDED_ENV_VARS.filter((key) => !process.env[key]);
if (missingRecommended.length > 0) {
  logger.warn({ missing: missingRecommended }, "Missing recommended env vars (using fallbacks)");
}

if (process.env.NODE_ENV === "production" && process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
  logger.warn("Using Stripe TEST key in production environment");
}

if (process.env.NODE_ENV === "production") {
  if (!process.env.APP_URL) {
    logger.warn("APP_URL not set in production");
  }
}

const rawPort = process.env["PORT"];
if (!rawPort) {
  console.error("FATAL: PORT environment variable is required but was not provided.");
  process.exit(1);
}

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  console.error(`FATAL: Invalid PORT value: "${rawPort}"`);
  process.exit(1);
}

const server = http.createServer(app);

server.listen(port, () => {
  logger.info({ port, env: process.env.NODE_ENV }, "Server started");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection");
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
  process.exit(1);
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Received signal, shutting down gracefully");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Force shutdown after timeout");
    process.exit(1);
  }, 30_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
