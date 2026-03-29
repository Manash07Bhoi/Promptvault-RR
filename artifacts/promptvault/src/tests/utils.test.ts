import { describe, it, expect } from "vitest";
import { cn, formatPrice, formatDate } from "../lib/utils";

describe("utils", () => {
  describe("formatDate", () => {
    it("returns 'Unknown date' for null input", () => {
      expect(formatDate(null)).toBe("Unknown date");
    });

    it("returns 'Unknown date' for undefined input", () => {
      expect(formatDate(undefined)).toBe("Unknown date");
    });

    it("returns 'Unknown date' for empty string input", () => {
      expect(formatDate("")).toBe("Unknown date");
    });

    it("formats a valid UTC date string correctly", () => {
      // Using a midday UTC timestamp to avoid timezone shifts
      expect(formatDate("2024-01-15T12:00:00Z")).toBe("January 15, 2024");
    });

    it("throws a RangeError for invalid date strings", () => {
      expect(() => formatDate("invalid-date")).toThrow(RangeError);
    });
  });

  describe("formatPrice", () => {
    it("returns '$0.00' for null input", () => {
      expect(formatPrice(null)).toBe("$0.00");
    });

    it("returns '$0.00' for undefined input", () => {
      expect(formatPrice(undefined)).toBe("$0.00");
    });

    it("formats integer cents correctly", () => {
      expect(formatPrice(1000)).toBe("$10.00");
      expect(formatPrice(99)).toBe("$0.99");
      expect(formatPrice(15050)).toBe("$150.50");
    });
  });

  describe("cn", () => {
    it("merges tailwind classes correctly", () => {
      expect(cn("p-4", "m-4")).toBe("p-4 m-4");
    });

    it("handles conditional classes", () => {
      expect(cn("p-4", true && "m-4", false && "flex")).toBe("p-4 m-4");
    });

    it("resolves tailwind class conflicts correctly", () => {
      expect(cn("p-4 p-6")).toBe("p-6");
      expect(cn("px-2", "px-4")).toBe("px-4");
    });
  });
});
