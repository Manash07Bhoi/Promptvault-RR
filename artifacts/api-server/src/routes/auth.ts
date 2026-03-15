import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  RegisterBody,
  LoginBody,
  RefreshTokenBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  VerifyEmailBody,
} from "@workspace/api-zod";
import {
  hashPassword,
  verifyPassword,
  generateTokenPair,
  verifyRefreshToken,
  generateToken,
} from "../lib/auth.js";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { authLoginLimit, authRegisterLimit, authForgotLimit } from "../lib/rate-limiters.js";
import { logger } from "../utils/logger.js";
import { sendPasswordResetEmail, sendEmailVerificationEmail } from "../lib/email.js";

const router: IRouter = Router();

// Comprehensive list of known disposable / temporary email domains
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com", "10minutemail.net", "10minutemail.org", "10minutemail.de",
  "10minemail.com", "20minutemail.com", "20minutemail.it", "1secmail.com",
  "1secmail.net", "1secmail.org", "guerrillamail.com", "guerrillamail.net",
  "guerrillamail.org", "guerrillamail.biz", "guerrillamail.de", "guerrillamail.info",
  "guerrillamailblock.com", "grr.la", "sharklasers.com", "guerrillamailblock.net",
  "spam4.me", "trashmail.com", "trashmail.at", "trashmail.io", "trashmail.me",
  "trashmail.net", "trashmail.org", "trashmail.xyz", "mailnull.com", "spamgourmet.com",
  "spamgourmet.net", "spamgourmet.org", "yopmail.com", "yopmail.fr", "cool.fr.nf",
  "jetable.fr.nf", "nospam.ze.tc", "nomail.xl.cx", "mega.zik.dj", "speed.1s.fr",
  "courriel.fr.nf", "moncourrier.fr.nf", "monemail.fr.nf", "monmail.fr.nf",
  "dispostable.com", "mailinator.com", "mailinator.net", "mailinator.org",
  "mailinater.com", "mailinator2.com", "mailmetrash.com", "discard.email",
  "spamthisplease.com", "fakeinbox.com", "fakeinbox.net", "throwam.com",
  "throwam.net", "maildrop.cc", "spam.la", "spam.su", "spam.org.es",
  "tempr.email", "tempm.com", "temp-mail.org", "temp-mail.de", "tempinbox.com",
  "tempinbox.co.uk", "temporaryemail.us", "temporaryforwarding.com",
  "temporaryinbox.com", "throwaway.email", "mailnesia.com", "mailsac.com",
  "getnada.com", "getonemail.com", "nada.email", "burnermail.io",
]);

function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;
  return DISPOSABLE_DOMAINS.has(domain);
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 3)}***@${domain}`;
}

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    // NEVER include: passwordHash, refreshToken, resetPasswordToken, emailVerificationToken, stripeCustomerId
  };
}

router.post("/auth/register", authRegisterLimit, async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", fields: parsed.error.formErrors.fieldErrors });
    return;
  }

  const { email, password, displayName } = parsed.data;

  if (isDisposableEmail(email)) {
    res.status(400).json({ error: "Temporary or disposable email addresses are not allowed. Please use a permanent email address." });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const emailVerificationToken = generateToken();

  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    displayName,
    role: "BUYER",
    status: "ACTIVE",
    emailVerifiedAt: new Date(),
    emailVerificationToken,
  }).returning();

  const { accessToken, refreshToken } = generateTokenPair(user.id, user.role);
  await db.update(usersTable).set({ refreshToken }).where(eq(usersTable.id, user.id));

  logger.info({ userId: user.id, email: maskEmail(email) }, "User registered");

  res.status(201).json({ user: formatUser(user), accessToken, refreshToken });
});

router.post("/auth/login", authLoginLimit, async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    logger.warn({ email: maskEmail(email), ip: req.ip }, "Failed login attempt");
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  if (user.status === "SUSPENDED") {
    res.status(401).json({ error: "Account suspended" });
    return;
  }

  if (user.status === "DELETED") {
    res.status(401).json({ error: "Account not found" });
    return;
  }

  const { accessToken, refreshToken } = generateTokenPair(user.id, user.role);
  await db.update(usersTable).set({ refreshToken, lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));

  logger.info({ userId: user.id, ip: req.ip }, "User logged in");

  res.json({ user: formatUser(user), accessToken, refreshToken });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  // Accept optional refresh token to revoke from DB
  const { refreshToken } = req.body || {};
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await db.update(usersTable).set({ refreshToken: null }).where(eq(usersTable.id, payload.userId));
    } catch {
      // Invalid token — still return success (client-side state is cleared)
    }
  }
  res.json({ message: "Logged out successfully" });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const parsed = RefreshTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Refresh token required" });
    return;
  }

  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Validate token matches stored token — prevents replay after logout
    if (user.refreshToken !== parsed.data.refreshToken) {
      logger.warn({ userId: user.id, ip: req.ip }, "Refresh token mismatch — possible replay attack");
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }

    const { accessToken, refreshToken } = generateTokenPair(user.id, user.role);
    await db.update(usersTable).set({ refreshToken }).where(eq(usersTable.id, user.id));

    res.json({ user: formatUser(user), accessToken, refreshToken });
  } catch {
    logger.warn({ ip: req.ip }, "Invalid JWT on refresh attempt");
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.post("/auth/forgot-password", authForgotLimit, async (req, res): Promise<void> => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, parsed.data.email.toLowerCase())).limit(1);

  if (user) {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 3600000);
    await db.update(usersTable).set({ resetPasswordToken: token, resetPasswordExpiresAt: expiresAt }).where(eq(usersTable.id, user.id));
    await sendPasswordResetEmail(user.email, user.displayName, token).catch(err =>
      logger.error({ userId: user.id, err }, "Failed to send password reset email")
    );
  }

  // Always return same response (prevent email enumeration)
  res.json({ message: "If the email exists, you'll receive reset instructions" });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.resetPasswordToken, parsed.data.token)).limit(1);

  if (!user || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.update(usersTable).set({ passwordHash, resetPasswordToken: null, resetPasswordExpiresAt: null }).where(eq(usersTable.id, user.id));

  logger.info({ userId: user.id }, "Password reset completed");

  res.json({ message: "Password reset successfully" });
});

router.post("/auth/verify-email", async (req, res): Promise<void> => {
  const parsed = VerifyEmailBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Token required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.emailVerificationToken, parsed.data.token)).limit(1);

  if (!user) {
    res.status(400).json({ error: "Invalid verification token" });
    return;
  }

  await db.update(usersTable).set({ emailVerifiedAt: new Date(), emailVerificationToken: null }).where(eq(usersTable.id, user.id));

  res.json({ message: "Email verified successfully" });
});

router.post("/auth/resend-verification", authForgotLimit, requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

  if (!user) { res.status(401).json({ error: "User not found" }); return; }
  if (user.emailVerifiedAt) { res.status(400).json({ error: "Email already verified" }); return; }

  const emailVerificationToken = generateToken();
  await db.update(usersTable).set({ emailVerificationToken }).where(eq(usersTable.id, user.id));

  await sendEmailVerificationEmail(user.email, user.displayName, emailVerificationToken);

  logger.info({ userId: user.id }, "Verification email resent");
  res.json({ message: "Verification email sent" });
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(user));
});

export default router;
