import { describe, it, expect } from "vitest";
import { sanitizeLikePattern } from "../utils/db-utils.js";

describe("sanitizeLikePattern", () => {
  it("escapes % wildcard", () => {
    expect(sanitizeLikePattern("100%")).toBe("100\\%");
  });

  it("escapes _ wildcard", () => {
    expect(sanitizeLikePattern("foo_bar")).toBe("foo\\_bar");
  });

  it("escapes backslash", () => {
    expect(sanitizeLikePattern("C:\\path")).toBe("C:\\\\path");
  });

  it("leaves normal text untouched", () => {
    expect(sanitizeLikePattern("hello world")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(sanitizeLikePattern("")).toBe("");
  });

  it("escapes multiple special chars", () => {
    expect(sanitizeLikePattern("50% off_sale\\")).toBe("50\\% off\\_sale\\\\");
  });

  it("handles null and undefined", () => {
    expect(sanitizeLikePattern(null)).toBe("");
    expect(sanitizeLikePattern(undefined)).toBe("");
  });

  it("handles non-string inputs", () => {
    expect(sanitizeLikePattern(100)).toBe("100");
    expect(sanitizeLikePattern(true)).toBe("true");
  });

  it("does not have issues with special replacement tokens like $&", () => {
      // If we used .replace(/.../g, "\\$&"), $& would be replaced by the matched character.
      // E.g. % -> \% (correct)
      // But what if the input contains $&?
      // sanitizeLikePattern("$&") -> "$&" (correct)
      expect(sanitizeLikePattern("$&")).toBe("$&");

      // The issue with string-based replacement is that it might interpret special tokens in the REPLACEMENT string.
      // "foo".replace("o", "$&") -> "foo" (correct)
      // "foo".replace("o", "$$") -> "fo$" (incorrect if we wanted "$$")

      // Our implementation uses a function for replacement, which is safe.
      expect(sanitizeLikePattern("\\")).toBe("\\\\");
  });
});
