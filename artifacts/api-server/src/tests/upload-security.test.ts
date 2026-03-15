import { describe, it, expect } from "vitest";
import { generateSecureFilename } from "../lib/upload-security";

describe("generateSecureFilename", () => {
  // UUIDv4 format: 8-4-4-4-12 hexadecimal characters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  it("generates a filename starting with a valid UUID", () => {
    const filename = generateSecureFilename("test.jpg", "image/jpeg");
    const nameWithoutExt = filename.split(".")[0];

    expect(nameWithoutExt).toMatch(uuidRegex);
  });

  it("maps image/jpeg to .jpg extension", () => {
    const filename = generateSecureFilename("photo.jpeg", "image/jpeg");
    expect(filename.endsWith(".jpg")).toBe(true);
  });

  it("maps image/png to .png extension", () => {
    const filename = generateSecureFilename("graphic.png", "image/png");
    expect(filename.endsWith(".png")).toBe(true);
  });

  it("maps image/webp to .webp extension", () => {
    const filename = generateSecureFilename("image.webp", "image/webp");
    expect(filename.endsWith(".webp")).toBe(true);
  });

  it("maps image/gif to .gif extension", () => {
    const filename = generateSecureFilename("anim.gif", "image/gif");
    expect(filename.endsWith(".gif")).toBe(true);
  });

  it("defaults to .bin for unknown MIME types", () => {
    const filename = generateSecureFilename("document.pdf", "application/pdf");
    expect(filename.endsWith(".bin")).toBe(true);
  });

  it("defaults to .bin for malformed or empty MIME types", () => {
    expect(generateSecureFilename("file.txt", "").endsWith(".bin")).toBe(true);
    expect(generateSecureFilename("file.txt", "invalid-mime-type").endsWith(".bin")).toBe(true);
    expect(generateSecureFilename("file.txt", "image/").endsWith(".bin")).toBe(true);
  });

  it("completely ignores the original filename", () => {
    const originalName = "../../../etc/passwd";
    const filename = generateSecureFilename(originalName, "image/png");

    expect(filename).not.toContain("etc");
    expect(filename).not.toContain("passwd");
    expect(filename).not.toContain("..");
  });

  it("generates unique filenames on consecutive calls", () => {
    const filename1 = generateSecureFilename("file.png", "image/png");
    const filename2 = generateSecureFilename("file.png", "image/png");

    expect(filename1).not.toBe(filename2);
  });

  it("output always contains exactly one extension and begins with a UUID", () => {
    const filename = generateSecureFilename("complex.name.tar.gz", "image/webp");
    const parts = filename.split(".");

    // Should have exactly 2 parts: [UUID, extension]
    expect(parts.length).toBe(2);
    expect(parts[0]).toMatch(uuidRegex);
    expect(parts[1]).toBe("webp");
  });
});
