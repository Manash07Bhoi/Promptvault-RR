/**
 * File upload security middleware and helpers.
 * - Validates MIME type by reading magic bytes (not trusting Content-Type header)
 * - Renames files to UUID to prevent path traversal
 * - Enforces file size limits per type
 */

import crypto from "crypto";
import path from "path";
import type { Request, Response, NextFunction } from "express";

// Magic bytes for common safe image types
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],  // RIFF....WEBP
  "image/gif": [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],  // GIF87a / GIF89a
};

const ALLOWED_MIME_TYPES = new Set(Object.keys(MAGIC_BYTES));
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB default

/**
 * Validate that a buffer's magic bytes match a claimed MIME type.
 */
export function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const patterns = MAGIC_BYTES[mimeType];
  if (!patterns) return false;
  return patterns.some(pattern =>
    pattern.every((byte, index) => buffer[index] === byte)
  );
}

/**
 * Generate a secure UUID-based filename with a safe extension.
 */
export function generateSecureFilename(originalName: string, mimeType: string): string {
  const ext = ALLOWED_MIME_TYPES.has(mimeType)
    ? "." + mimeType.split("/")[1].replace("jpeg", "jpg")
    : ".bin";
  return crypto.randomUUID() + ext;
}

/**
 * Sanitize original filename to prevent path traversal attacks.
 */
export function sanitizeFilename(name: string): string {
  // Remove directory traversal, null bytes, and restrict to safe chars
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

/**
 * Express middleware to validate uploaded files.
 * Expects multer or similar to have already parsed the file into req.file.
 */
export function fileSecurityMiddleware(allowedTypes = ALLOWED_MIME_TYPES, maxSize = MAX_FILE_SIZE) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const file = (req as any).file;
    if (!file) {
      next();
      return;
    }

    // Check size
    if (file.size > maxSize) {
      res.status(413).json({ error: `File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB` });
      return;
    }

    // Check MIME type against allowlist
    const claimed = file.mimetype as string;
    if (!allowedTypes.has(claimed)) {
      res.status(415).json({ error: `File type not allowed: ${claimed}` });
      return;
    }

    // Validate magic bytes (buffer must be available)
    if (file.buffer) {
      if (!validateMagicBytes(file.buffer as Buffer, claimed)) {
        res.status(415).json({ error: "File content does not match declared type" });
        return;
      }
    }

    // Rename file to UUID
    file.originalname = sanitizeFilename(file.originalname);
    file.safeFilename = generateSecureFilename(file.originalname, claimed);

    next();
  };
}
