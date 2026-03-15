import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  generateToken,
} from "../lib/auth.js";

describe("hashPassword / verifyPassword", () => {
  it("hashes a password and verifies it correctly", async () => {
    const hash = await hashPassword("MySecret123!");
    expect(hash).toBeTruthy();
    expect(hash).not.toBe("MySecret123!");
    const valid = await verifyPassword("MySecret123!", hash);
    expect(valid).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("correcthorsebatterystaple");
    const valid = await verifyPassword("wrongpassword", hash);
    expect(valid).toBe(false);
  });

  it("returns false for empty stored hash", async () => {
    const valid = await verifyPassword("any", "");
    expect(valid).toBe(false);
  });
});

describe("generateTokenPair / verifyAccessToken / verifyRefreshToken", () => {
  it("generates tokens with correct payload", () => {
    const { accessToken, refreshToken, sessionId } = generateTokenPair(42, "BUYER");
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(sessionId).toBeTruthy();
    expect(sessionId).toHaveLength(32);

    const decoded = verifyAccessToken(accessToken);
    expect(decoded.userId).toBe(42);
    expect(decoded.role).toBe("BUYER");
    expect(decoded.sessionId).toBe(sessionId);
  });

  it("verifies refresh token correctly", () => {
    const { refreshToken } = generateTokenPair(99, "ADMIN");
    const decoded = verifyRefreshToken(refreshToken);
    expect(decoded.userId).toBe(99);
    expect(decoded.role).toBe("ADMIN");
  });

  it("throws on tampered access token", () => {
    const { accessToken } = generateTokenPair(1, "BUYER");
    expect(() => verifyAccessToken(accessToken + "tampered")).toThrow();
  });

  it("throws on tampered refresh token", () => {
    const { refreshToken } = generateTokenPair(1, "BUYER");
    expect(() => verifyRefreshToken(refreshToken + "x")).toThrow();
  });
});

describe("generateToken", () => {
  it("generates a 64-char hex token", () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("generates unique tokens each call", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });
});
