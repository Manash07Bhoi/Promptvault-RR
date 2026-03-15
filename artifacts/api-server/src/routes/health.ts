import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

const router: IRouter = Router();
const startTime = Date.now();

router.get("/healthz", async (_req, res) => {
  let dbStatus: "ok" | "error" = "ok";
  try {
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
    ]);
  } catch {
    dbStatus = "error";
  }

  const overallStatus = dbStatus === "ok" ? "ok" : "degraded";
  const code = overallStatus === "ok" ? 200 : 503;

  res.status(code).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    services: {
      database: dbStatus,
    },
  });
});

router.get("/health/live", (_req, res) => {
  res.json({ status: "ok" });
});

router.get("/health/ready", async (_req, res) => {
  try {
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
    ]);
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "not ready", reason: "database unavailable" });
  }
});

export default router;
