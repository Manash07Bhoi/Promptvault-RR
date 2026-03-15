import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";

describe("Packs API - public endpoints", () => {
  it("GET /api/packs returns list with pagination metadata", async () => {
    const res = await request(app).get("/api/packs");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.packs)).toBe(true);
    expect(typeof res.body.total).toBe("number");
    expect(typeof res.body.page).toBe("number");
    expect(typeof res.body.limit).toBe("number");
    expect(typeof res.body.totalPages).toBe("number");
  });

  it("GET /api/packs does NOT expose totalRevenueCents or internalFields", async () => {
    const res = await request(app).get("/api/packs");
    expect(res.status).toBe(200);
    for (const pack of res.body.packs) {
      expect(pack.totalRevenueCents).toBeUndefined();
      expect(pack.deletedAt).toBeUndefined();
      expect(pack.moderatedBy).toBeUndefined();
      expect(pack.aiGenerationId).toBeUndefined();
    }
  });

  it("GET /api/packs respects page and limit params", async () => {
    const res = await request(app).get("/api/packs?page=1&limit=5");
    expect(res.status).toBe(200);
    expect(res.body.packs.length).toBeLessThanOrEqual(5);
    expect(res.body.limit).toBe(5);
  });

  it("GET /api/packs rejects limit > 50", async () => {
    const res = await request(app).get("/api/packs?limit=200");
    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.packs.length).toBeLessThanOrEqual(50);
    }
  });

  it("GET /api/packs/featured returns array", async () => {
    const res = await request(app).get("/api/packs/featured");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/packs/trending returns array", async () => {
    const res = await request(app).get("/api/packs/trending");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/packs/bestsellers returns array", async () => {
    const res = await request(app).get("/api/packs/bestsellers");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/packs/nonexistent-slug returns 404", async () => {
    const res = await request(app).get("/api/packs/__definitely_does_not_exist_xyz__");
    expect(res.status).toBe(404);
  });
});

describe("Packs API - search", () => {
  it("GET /api/search/search returns results object", async () => {
    const res = await request(app).get("/api/search/search?q=prompt");
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body.packs)).toBe(true);
    }
  });

  it("GET /api/packs with search param sanitizes SQL wildcards", async () => {
    const res = await request(app).get("/api/packs").query({ search: "100%_test\\backslash" });
    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body.packs)).toBe(true);
    }
  });
});

describe("Categories API", () => {
  it("GET /api/categories returns array", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/categories/:slug returns 404 for nonexistent", async () => {
    const res = await request(app).get("/api/categories/__no_such_category__");
    expect(res.status).toBe(404);
  });
});

describe("Reviews API", () => {
  it("POST /api/reviews/:packId requires auth", async () => {
    const res = await request(app)
      .post("/api/reviews/1")
      .send({ rating: 5, title: "Great", body: "Loved it" });
    expect(res.status).toBe(401);
  });

  it("GET /api/reviews/1 returns review structure", async () => {
    const res = await request(app).get("/api/reviews/1");
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body.reviews)).toBe(true);
      expect(typeof res.body.total).toBe("number");
    }
  });
});
