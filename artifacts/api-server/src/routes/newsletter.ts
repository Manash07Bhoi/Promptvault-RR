import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, newsletterSubscribersTable } from "@workspace/db";
import { z } from "zod";
import { logger } from "../utils/logger.js";
import { sendNewsletterWelcomeEmail } from "../lib/email.js";
import crypto from "crypto";

const router: IRouter = Router();

const SubscribeBody = z.object({
  email: z.string().email("Valid email required"),
  name: z.string().max(100).optional(),
});

router.post("/newsletter/subscribe", async (req, res): Promise<void> => {
  const parsed = SubscribeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Valid email address required" });
    return;
  }

  const { email, name } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const [existing] = await db
    .select()
    .from(newsletterSubscribersTable)
    .where(eq(newsletterSubscribersTable.email, normalizedEmail))
    .limit(1);

  if (existing) {
    if (!existing.isActive) {
      await db
        .update(newsletterSubscribersTable)
        .set({ isActive: true, name: name || existing.name })
        .where(eq(newsletterSubscribersTable.id, existing.id));
      await sendNewsletterWelcomeEmail(normalizedEmail).catch(() => {});
      res.json({ message: "You've been re-subscribed to PromptVault updates!" });
      return;
    }
    res.json({ message: "You're already subscribed! We'll keep you updated." });
    return;
  }

  const unsubscribeToken = crypto.randomBytes(32).toString("hex");

  await db.insert(newsletterSubscribersTable).values({
    email: normalizedEmail,
    name: name || null,
    isActive: true,
    unsubscribeToken,
  });

  await sendNewsletterWelcomeEmail(normalizedEmail).catch(err =>
    logger.warn({ email: normalizedEmail, err }, "Failed to send newsletter welcome email")
  );

  logger.info({ email: normalizedEmail }, "Newsletter subscriber added");
  res.json({ message: "Successfully subscribed! Check your inbox for a welcome email." });
});

router.get("/newsletter/unsubscribe/:token", async (req, res): Promise<void> => {
  const token = req.params.token as string;

  if (!token || token.length < 32) {
    res.status(400).json({ error: "Invalid unsubscribe token" });
    return;
  }

  const [subscriber] = await db
    .select()
    .from(newsletterSubscribersTable)
    .where(eq(newsletterSubscribersTable.unsubscribeToken, token))
    .limit(1);

  if (!subscriber) {
    res.status(404).json({ error: "Subscription not found" });
    return;
  }

  await db
    .update(newsletterSubscribersTable)
    .set({ isActive: false })
    .where(eq(newsletterSubscribersTable.id, subscriber.id));

  res.json({ message: "You have been unsubscribed from PromptVault updates." });
});

export default router;
