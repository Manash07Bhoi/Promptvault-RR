import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../app.js";

describe("Health endpoints", () => {
  it("GET /api/healthz returns 200 with status ok", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.services.database).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
    expect(typeof res.body.uptime).toBe("number");
  });

  it("GET /api/health/live returns 200", async () => {
    const res = await request(app).get("/api/health/live");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/health/ready returns 200 or 503", async () => {
    const res = await request(app).get("/api/health/ready");
    expect([200, 503]).toContain(res.status);
  });
});
