import { describe, it, expect } from "vitest";

// Test the exported rate limiters exist (smoke test)
describe("Rate limiters module", () => {
  it("imports without throwing", async () => {
    const { authLoginLimit, authRegisterLimit, authForgotLimit, searchLimit } = await import("../lib/rate-limiters.js");
    expect(authLoginLimit).toBeDefined();
    expect(authRegisterLimit).toBeDefined();
    expect(authForgotLimit).toBeDefined();
    expect(searchLimit).toBeDefined();
  });
});
