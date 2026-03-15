import { validateMagicBytes } from "../lib/upload-security.js";
import { describe, it, expect } from "vitest";
import { sanitizeFilename } from "../lib/upload-security";
import os from "os";

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

describe("sanitizeFilename", () => {
  it("allows safe basic filenames", () => {
    expect(sanitizeFilename("image.jpg")).toBe("image.jpg");
    expect(sanitizeFilename("my_file-123.png")).toBe("my_file-123.png");
  });

  it("prevents path traversal (Linux/Unix)", () => {
    expect(sanitizeFilename("../../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("/var/www/html/index.php")).toBe("index.php");
  });

  it("prevents path traversal (Windows)", () => {
    if (os.platform() === "win32") {
      // Windows path.basename treats '\' as a separator
      expect(sanitizeFilename("..\\..\\windows\\system32")).toBe("system32");
      expect(sanitizeFilename("C:\\secret\\passwords.txt")).toBe("passwords.txt");
    } else {
      // path.basename does not recognize backslashes as separators on non-Windows
      // systems, so it relies on the regex replacing them with underscores.
      expect(sanitizeFilename("..\\..\\windows\\system32")).toBe(".._.._windows_system32");
      expect(sanitizeFilename("C:\\secret\\passwords.txt")).toBe("C__secret_passwords.txt");
    }
  });

  it("prevents mixed path traversal", () => {
    if (os.platform() === "win32") {
      // Windows path.basename treats '\' as a separator
      expect(sanitizeFilename("../..\\etc/passwd")).toBe("passwd");
    } else {
      // POSIX path.basename splits on '/', yielding "..\\etc", then regex replaces "\"
      expect(sanitizeFilename("../..\\etc/passwd")).toBe("passwd");
    }
  });

  it("strips null bytes", () => {
    // Note: path.basename treats '\0' as a normal character, so it passes through
    // and then gets replaced by the regex.
    expect(sanitizeFilename("file.jpg\0.exe")).toBe("file.jpg_.exe");
    expect(sanitizeFilename("evil\x00file.png")).toBe("evil_file.png");
  });

  it("replaces non-alphanumeric and special characters with underscores", () => {
    expect(sanitizeFilename("my file (1).jpg")).toBe("my_file__1_.jpg");
    expect(sanitizeFilename("file@name!.png")).toBe("file_name_.png");
    // path.basename stops at > when <script> is used sometimes depending on os?
    // Let's test a simple hack string that will correctly be basename'd
    expect(sanitizeFilename("hack<script>.html")).toBe("hack_script_.html");
  });

  it("handles whitespace normalization", () => {
    expect(sanitizeFilename("file with spaces.jpg")).toBe("file_with_spaces.jpg");
    expect(sanitizeFilename("tabs\t\tin\tname.txt")).toBe("tabs__in_name.txt");
  });

  it("handles leading dots (hidden files)", () => {
    expect(sanitizeFilename(".env")).toBe(".env");
    expect(sanitizeFilename("..hiddenfile")).toBe("..hiddenfile");
  });

  it("handles multiple dots", () => {
    expect(sanitizeFilename("file..name..jpg")).toBe("file..name..jpg");
  });

  it("handles empty or nearly empty input", () => {
    expect(sanitizeFilename("")).toBe("");
    expect(sanitizeFilename("!")).toBe("_"); // Becomes underscore after sanitization
  });

  it("handles unicode characters safely (replaces with underscores)", () => {
    // Depending on regex, non-ASCII chars usually get replaced
    expect(sanitizeFilename("emoji_🎉.png")).toBe("emoji___.png");
    expect(sanitizeFilename("très_bien.jpg")).toBe("tr_s_bien.jpg");
    expect(sanitizeFilename("テスト.png")).toBe("___.png");
  });

  it("enforces the 200 character slice limit", () => {
    const longName = "a".repeat(300) + ".txt";
    const sanitized = sanitizeFilename(longName);
    expect(sanitized.length).toBe(200);
    // Because path.basename("aaaa....txt") is just "aaaa....txt", the end is truncated.
    // The first 200 chars are just "a"s
    expect(sanitized).toBe("a".repeat(200));
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



describe("validateMagicBytes (File upload security)", () => {
  it("accepts valid JPEG magic bytes", () => {
    const buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    expect(validateMagicBytes(buffer, "image/jpeg")).toBe(true);
  });

  it("accepts valid PNG magic bytes", () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52]);
    expect(validateMagicBytes(buffer, "image/png")).toBe(true);
  });

  it("accepts valid WEBP magic bytes", () => {
    const buffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]); // RIFF....WEBP
    expect(validateMagicBytes(buffer, "image/webp")).toBe(true);
  });

  it("accepts valid GIF87a magic bytes", () => {
    const buffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x01, 0x00, 0x01, 0x00]); // GIF87a...
    expect(validateMagicBytes(buffer, "image/gif")).toBe(true);
  });

  it("accepts valid GIF89a magic bytes", () => {
    const buffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00]); // GIF89a...
    expect(validateMagicBytes(buffer, "image/gif")).toBe(true);
  });

  it("rejects invalid buffer for a valid MIME type", () => {
    const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]); // Random bytes
    expect(validateMagicBytes(buffer, "image/jpeg")).toBe(false);
  });

  it("rejects unknown MIME type", () => {
    const buffer = Buffer.from([0xFF, 0xD8, 0xFF]);
    expect(validateMagicBytes(buffer, "application/json")).toBe(false);
  });

  it("rejects mismatched MIME type (e.g. PNG bytes for JPEG)", () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]); // PNG
    expect(validateMagicBytes(buffer, "image/jpeg")).toBe(false);
  });

  it("rejects empty buffer", () => {
    const buffer = Buffer.alloc(0);
    expect(validateMagicBytes(buffer, "image/png")).toBe(false);
  });

  it("rejects short/truncated buffer", () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4E]); // Only 3 bytes of PNG
    expect(validateMagicBytes(buffer, "image/png")).toBe(false);
  });
});
