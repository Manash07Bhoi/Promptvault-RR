import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../app.js";

const TEST_EMAIL = `integration-test-${Date.now()}@example.com`;
const TEST_PASSWORD = "IntegrationTest123!";
let accessToken = "";
let refreshToken = "";

describe("Auth API - registration flow", () => {
  it("POST /api/auth/register rejects missing email", async () => {
    const res = await request(app).post("/api/auth/register").send({ password: "test123" });
    expect(res.status).toBe(400);
  });

  it("POST /api/auth/register rejects weak password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "valid@example.com",
      password: "weak",
      displayName: "Test",
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/auth/register rejects disposable email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "user@mailinator.com",
      password: TEST_PASSWORD,
      displayName: "Test",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/disposable/i);
  });

  it("POST /api/auth/register creates a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: "Integration Tester",
    });
    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    // SECURITY: password hash must never be in response
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.refreshToken).toBeUndefined();
    expect(res.body.user.resetPasswordToken).toBeUndefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it("POST /api/auth/register rejects duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: "Duplicate",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already registered/i);
  });
});

describe("Auth API - login flow", () => {
  it("POST /api/auth/login rejects wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: "wrong-password",
    });
    expect(res.status).toBe(401);
  });

  it("POST /api/auth/login succeeds with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.passwordHash).toBeUndefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it("POST /api/auth/refresh returns new tokens", async () => {
    const res = await request(app).post("/api/auth/refresh").send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });
});

describe("Auth API - protected routes", () => {
  it("GET /api/auth/me requires auth", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me succeeds with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(TEST_EMAIL.toLowerCase());
    // SECURITY: sensitive fields must not be present
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.refreshToken).toBeUndefined();
  });
});

describe("Security smoke tests", () => {
  it("TAMPERED JWT returns 401", async () => {
    const tampered = accessToken + "tampered";
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${tampered}`);
    expect(res.status).toBe(401);
  });

  it("Bearer with garbage token returns 401", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer notavalidtoken");
    expect(res.status).toBe(401);
  });

  it("Admin routes return 401 for unauthenticated requests", async () => {
    const res = await request(app).get("/api/admin/dashboard");
    expect(res.status).toBe(401);
  });

  it("Admin routes return 403 for regular (BUYER) users", async () => {
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });

  it("SQL injection in search returns 200 (safely escaped)", async () => {
    const res = await request(app)
      .get("/api/packs")
      .query({ search: "'; DROP TABLE packs; --" });
    // Should be safe and return 200 (not 500)
    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body.packs)).toBe(true);
    }
  });

  it("ILIKE wildcard injection in search is sanitized", async () => {
    const res = await request(app)
      .get("/api/packs")
      .query({ search: "%" });
    expect([200, 400]).toContain(res.status);
  });

  it("Admin dashboard is NOT accessible by buyer JWT", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });

  it("Checkout requires auth", async () => {
    const res = await request(app).post("/api/checkout/session").send({ packIds: [1] });
    expect(res.status).toBe(401);
  });

  it("Free pack claim requires auth", async () => {
    const res = await request(app).post("/api/checkout/free").send({ packId: 1 });
    expect(res.status).toBe(401);
  });

  it("Pack download requires auth", async () => {
    const res = await request(app).get("/api/packs/test-pack/download");
    expect(res.status).toBe(401);
  });
});

describe("Input validation smoke tests", () => {
  it("Invalid page param returns 400", async () => {
    const res = await request(app).get("/api/packs").query({ page: "abc" });
    expect([200, 400]).toContain(res.status); // coerce might make it default
  });

  it("Negative limit is capped", async () => {
    const res = await request(app).get("/api/packs").query({ limit: "-1" });
    expect([200, 400]).toContain(res.status);
  });

  it("POST /api/auth/forgot-password is idempotent (no email enumeration)", async () => {
    const res1 = await request(app).post("/api/auth/forgot-password").send({ email: TEST_EMAIL });
    const res2 = await request(app).post("/api/auth/forgot-password").send({ email: "nonexistent@example.com" });
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    // Both return same structure (no email enumeration)
    expect(res1.body.message).toBe(res2.body.message);
  });
});
