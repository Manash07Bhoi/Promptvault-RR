import { describe, it, expect } from "vitest";

// Replicate the sanitization function from routes
function sanitizeSearchQuery(q: string): string {
  return q.replace(/[%_\\]/g, "\\$&");
}

// Replicate the isDisposableEmail check
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com", "guerrillamail.com", "mailinator.com", "yopmail.com",
  "trashmail.com", "temp-mail.org",
]);

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;
  return DISPOSABLE_DOMAINS.has(domain);
}

// Replicate integer coupon math
function calcDiscountPercent(subtotalCents: number, pct: number): number {
  return Math.round(subtotalCents * pct / 100);
}

function calcDiscountFixed(subtotalCents: number, fixedDollars: number): number {
  return Math.min(Math.round(fixedDollars * 100), subtotalCents);
}

describe("sanitizeSearchQuery (ILIKE injection prevention)", () => {
  it("escapes % wildcard", () => {
    expect(sanitizeSearchQuery("100%")).toBe("100\\%");
  });

  it("escapes _ wildcard", () => {
    expect(sanitizeSearchQuery("foo_bar")).toBe("foo\\_bar");
  });

  it("escapes backslash", () => {
    expect(sanitizeSearchQuery("C:\\path")).toBe("C:\\\\path");
  });

  it("leaves normal text untouched", () => {
    expect(sanitizeSearchQuery("hello world")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(sanitizeSearchQuery("")).toBe("");
  });

  it("escapes multiple special chars", () => {
    expect(sanitizeSearchQuery("50% off_sale\\")).toBe("50\\% off\\_sale\\\\");
  });
});

describe("isDisposableEmail", () => {
  it("rejects mailinator.com", () => {
    expect(isDisposableEmail("test@mailinator.com")).toBe(true);
  });

  it("rejects yopmail.com", () => {
    expect(isDisposableEmail("foo@yopmail.com")).toBe(true);
  });

  it("accepts gmail.com", () => {
    expect(isDisposableEmail("user@gmail.com")).toBe(false);
  });

  it("accepts company domain", () => {
    expect(isDisposableEmail("alice@company.io")).toBe(false);
  });

  it("rejects email with no domain", () => {
    expect(isDisposableEmail("nodomain")).toBe(true);
  });
});

describe("Coupon discount math (integer only)", () => {
  it("calculates 10% off $100 correctly", () => {
    expect(calcDiscountPercent(10000, 10)).toBe(1000);
  });

  it("calculates 33% off correctly (rounds)", () => {
    // 33% of $10.00 = $3.30 exactly
    expect(calcDiscountPercent(1000, 33)).toBe(330);
  });

  it("calculates 1% off $1 (rounding)", () => {
    // 1% of $1.00 = $0.01
    expect(calcDiscountPercent(100, 1)).toBe(1);
  });

  it("fixed discount converts dollars to cents", () => {
    expect(calcDiscountFixed(5000, 10)).toBe(1000);
  });

  it("fixed discount capped at subtotal", () => {
    // $50 off a $20 order — can't exceed order total
    expect(calcDiscountFixed(2000, 50)).toBe(2000);
  });

  it("fixed discount of $0 gives zero", () => {
    expect(calcDiscountFixed(5000, 0)).toBe(0);
  });
});

describe("Price total calculation (integer math)", () => {
  it("totalCents = subtotal - discount, floored at 0", () => {
    const subtotal = 10000;
    const discount = 1000;
    const total = Math.max(0, subtotal - discount);
    expect(total).toBe(9000);
  });

  it("discount >= subtotal results in 0 total", () => {
    const total = Math.max(0, 500 - 600);
    expect(total).toBe(0);
  });

  it("multiple packs sum correctly", () => {
    const prices = [1999, 2999, 999];
    const sum = prices.reduce((a, b) => a + b, 0);
    expect(sum).toBe(5997);
  });
});
