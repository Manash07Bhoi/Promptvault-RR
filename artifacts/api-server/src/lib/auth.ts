import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "promptvault-dev-secret-change-in-production-min-32-chars!";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "promptvault-refresh-dev-secret-change-in-prod-min-32-chars!";

const BCRYPT_ROUNDS = 12;

export interface JwtPayload {
  userId: number;
  role: string;
  sessionId: string;
}

export function generateTokenPair(userId: number, role: string): { accessToken: string; refreshToken: string; sessionId: string } {
  const sessionId = crypto.randomBytes(16).toString("hex");
  const payload = { userId, role, sessionId };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "30d" });
  return { accessToken, refreshToken, sessionId };
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign({ userId: payload.userId, role: payload.role, sessionId: payload.sessionId }, JWT_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign({ userId: payload.userId, role: payload.role, sessionId: payload.sessionId }, JWT_REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (stored.includes(":")) {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    const hashBuf = Buffer.from(hash, "hex");
    const verifyBuf = Buffer.from(verifyHash, "hex");
    if (hashBuf.length !== verifyBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, verifyBuf);
  }
  return bcrypt.compare(password, stored);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
