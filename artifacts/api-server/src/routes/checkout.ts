import { Router, type IRouter } from "express";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db, packsTable, ordersTable, orderItemsTable, couponsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { CreateCheckoutSessionBody as CreateCheckoutBody, ClaimFreePackBody as ClaimFreeBody, ValidateCouponBody } from "@workspace/api-zod";
import Stripe from "stripe";
import { logger } from "../utils/logger.js";

const router: IRouter = Router();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL || "http://localhost:19275";

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

// In-memory idempotency store for webhook events (replace with Redis in production)
const processedWebhookEvents = new Map<string, number>();
const WEBHOOK_EVENT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function isEventProcessed(eventId: string): boolean {
  const processedAt = processedWebhookEvents.get(eventId);
  if (!processedAt) return false;
  if (Date.now() - processedAt > WEBHOOK_EVENT_TTL_MS) {
    processedWebhookEvents.delete(eventId);
    return false;
  }
  return true;
}

function markEventProcessed(eventId: string): void {
  processedWebhookEvents.set(eventId, Date.now());
}

router.post("/checkout/session", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateCheckoutBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const { packIds, couponCode } = parsed.data;

  // Always fetch prices from DB — never trust client-supplied totals
  const packs = await db.select().from(packsTable).where(inArray(packsTable.id, packIds));

  if (packs.length === 0) { res.status(400).json({ error: "No valid packs" }); return; }

  // Integer math only
  const subtotalCents = packs.reduce((sum, p) => sum + p.priceCents, 0);
  let discountCents = 0;
  let appliedCoupon: typeof couponsTable.$inferSelect | null = null;

  if (couponCode) {
    const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, couponCode.toUpperCase())).limit(1);
    if (coupon && coupon.isActive) {
      if (!coupon.validUntil || coupon.validUntil > new Date()) {
        if (!coupon.maxUses || coupon.usesCount < coupon.maxUses) {
          appliedCoupon = coupon;
          if (coupon.discountType === "PERCENT") {
            discountCents = Math.round(subtotalCents * coupon.discountValue / 100);
          } else {
            discountCents = Math.min(Math.round(coupon.discountValue * 100), subtotalCents);
          }
        }
      }
    }
  }

  const totalCents = Math.max(0, subtotalCents - discountCents);

  if (stripe && totalCents > 0) {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = packs.map((pack) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: pack.title,
          description: pack.shortDescription || undefined,
          images: pack.thumbnailUrl ? [pack.thumbnailUrl] : undefined,
          metadata: { packId: String(pack.id), packSlug: pack.slug },
        },
        unit_amount: pack.priceCents,
      },
      quantity: 1,
    }));

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems,
      success_url: `${APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/checkout/cancel`,
      client_reference_id: String(req.user!.userId),
      metadata: {
        userId: String(req.user!.userId),
        packIds: packIds.join(","),
        couponCode: couponCode || "",
        discountCents: String(discountCents),
      },
      payment_intent_data: {
        metadata: {
          userId: String(req.user!.userId),
          packIds: packIds.join(","),
        },
      },
    };

    if (appliedCoupon && discountCents > 0) {
      try {
        const stripeCoupon = await stripe.coupons.create({
          duration: "once",
          ...(appliedCoupon.discountType === "PERCENT"
            ? { percent_off: appliedCoupon.discountValue }
            : { amount_off: discountCents, currency: "usd" }),
        });
        sessionParams.discounts = [{ coupon: stripeCoupon.id }];
      } catch (couponErr) {
        logger.error({ err: couponErr }, "[Stripe] Failed to create coupon for session");
      }
    }

    try {
      const session = await stripe.checkout.sessions.create(sessionParams);

      const [order] = await db.insert(ordersTable).values({
        userId: req.user!.userId,
        status: "PENDING",
        subtotalCents,
        discountCents,
        taxCents: 0,
        totalCents,
        currency: "usd",
        stripeSessionId: session.id,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }).returning();

      for (const pack of packs) {
        await db.insert(orderItemsTable).values({
          orderId: order.id,
          packId: pack.id,
          priceCents: pack.priceCents,
          titleSnapshot: pack.title,
        });
      }

      res.json({
        orderId: order.id,
        sessionUrl: session.url,
        sessionId: session.id,
      });
      return;
    } catch (err) {
      logger.error({ err }, "[Stripe] Failed to create checkout session");
      res.status(500).json({ error: "Failed to create payment session. Please try again." });
      return;
    }
  }

  const [order] = await db.insert(ordersTable).values({
    userId: req.user!.userId,
    status: "COMPLETED",
    subtotalCents,
    discountCents,
    taxCents: 0,
    totalCents,
    currency: "usd",
    completedAt: new Date(),
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  }).returning();

  for (const pack of packs) {
    await db.insert(orderItemsTable).values({
      orderId: order.id,
      packId: pack.id,
      priceCents: pack.priceCents,
      titleSnapshot: pack.title,
    });

    await db.update(packsTable)
      .set({ totalDownloads: (pack.totalDownloads || 0) + 1, totalRevenueCents: (pack.totalRevenueCents || 0) + pack.priceCents })
      .where(eq(packsTable.id, pack.id));
  }

  if (appliedCoupon) {
    // Atomic increment — prevents race condition on single-use coupons
    await db.execute(sql`UPDATE coupons SET uses_count = uses_count + 1 WHERE id = ${appliedCoupon.id} AND (max_uses IS NULL OR uses_count < max_uses)`);
  }

  logger.info({ orderId: order.id, userId: req.user!.userId, totalCents }, "Order completed (free/no-Stripe)");

  res.json({
    orderId: order.id,
    sessionUrl: null,
    sessionId: null,
  });
});

router.post("/checkout/free", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = ClaimFreeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const [pack] = await db.select().from(packsTable).where(eq(packsTable.id, parsed.data.packId)).limit(1);
  if (!pack) { res.status(404).json({ error: "Pack not found" }); return; }
  if (!pack.isFree && pack.priceCents > 0) { res.status(400).json({ error: "This pack is not free" }); return; }

  const [order] = await db.insert(ordersTable).values({
    userId: req.user!.userId,
    status: "COMPLETED",
    subtotalCents: 0,
    discountCents: 0,
    taxCents: 0,
    totalCents: 0,
    currency: "usd",
    completedAt: new Date(),
  }).returning();

  await db.insert(orderItemsTable).values({
    orderId: order.id,
    packId: pack.id,
    priceCents: 0,
    titleSnapshot: pack.title,
  });

  await db.update(packsTable)
    .set({ totalDownloads: (pack.totalDownloads || 0) + 1 })
    .where(eq(packsTable.id, pack.id));

  logger.info({ orderId: order.id, userId: req.user!.userId, packId: pack.id }, "Free pack claimed");

  res.json({
    id: order.id,
    userId: order.userId,
    status: order.status,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    currency: order.currency,
    stripePaymentIntentId: null,
    completedAt: order.completedAt ? order.completedAt.toISOString() : null,
    createdAt: order.createdAt.toISOString(),
    items: [{
      id: 1,
      packId: pack.id,
      packSlug: pack.slug,
      titleSnapshot: pack.title,
      priceCents: 0,
      downloadCount: 0,
      firstDownloadedAt: null,
    }],
  });
});

router.post("/checkout/webhook", async (req, res): Promise<void> => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    res.json({ message: "Webhook received" });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const e = err as Error;
    logger.warn({ ip: req.ip }, "Webhook signature mismatch");
    res.status(400).json({ error: `Webhook error: ${e.message}` });
    return;
  }

  // Idempotency: skip already-processed events
  if (isEventProcessed(event.id)) {
    logger.info({ eventId: event.id, type: event.type }, "Webhook event already processed, skipping");
    res.json({ received: true });
    return;
  }

  // Mark as processed before handling (prevent double processing on retries)
  markEventProcessed(event.id);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const sessionId = session.id;

      const [order] = await db.select().from(ordersTable).where(eq(ordersTable.stripeSessionId, sessionId)).limit(1);
      if (!order) {
        logger.warn({ sessionId }, "[Stripe Webhook] Order not found for session");
        res.json({ received: true });
        return;
      }

      if (order.status !== "COMPLETED") {
        await db.update(ordersTable)
          .set({
            status: "COMPLETED",
            completedAt: new Date(),
            stripePaymentIntentId: session.payment_intent as string,
          })
          .where(eq(ordersTable.id, order.id));

        const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
        for (const item of items) {
          const [pack] = await db.select().from(packsTable).where(eq(packsTable.id, item.packId)).limit(1);
          if (pack) {
            await db.update(packsTable)
              .set({ totalDownloads: (pack.totalDownloads || 0) + 1, totalRevenueCents: (pack.totalRevenueCents || 0) + item.priceCents })
              .where(eq(packsTable.id, pack.id));
          }
        }

        // Atomically increment coupon usesCount — prevents race condition on limited-use coupons
        const sessionMeta = session.metadata || {};
        if (sessionMeta.couponCode) {
          await db.execute(sql`
            UPDATE coupons
            SET uses_count = uses_count + 1
            WHERE code = ${sessionMeta.couponCode.toUpperCase()}
              AND is_active = true
              AND (max_uses IS NULL OR uses_count < max_uses)
          `);
          logger.info({ couponCode: sessionMeta.couponCode, orderId: order.id }, "Coupon use counted");
        }

        logger.info({ orderId: order.id, userId: order.userId, totalCents: order.totalCents }, "Order completed via Stripe webhook");
      }
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      await db.update(ordersTable)
        .set({ status: "FAILED" })
        .where(and(eq(ordersTable.stripeSessionId, session.id), eq(ordersTable.status, "PENDING")));
      logger.info({ sessionId: session.id }, "Checkout session expired, order marked FAILED");
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await db.update(ordersTable)
        .set({ status: "FAILED" })
        .where(and(eq(ordersTable.stripePaymentIntentId, paymentIntent.id), eq(ordersTable.status, "PENDING")));
      logger.info({ paymentIntentId: paymentIntent.id }, "Payment failed, order marked FAILED");
    } else if (event.type === "charge.refunded") {
      logger.info({ eventId: event.id }, "Charge refunded event received");
    }
  } catch (handlerErr) {
    logger.error({ err: handlerErr, eventId: event.id, type: event.type }, "Webhook handler error");
  }

  // Always return 200 to Stripe
  res.json({ received: true });
});

// Coupon validation
router.post("/coupons/validate", async (req, res): Promise<void> => {
  const parsed = ValidateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const [coupon] = await db.select().from(couponsTable)
    .where(eq(couponsTable.code, parsed.data.code.toUpperCase())).limit(1);

  if (!coupon || !coupon.isActive) {
    res.json({ valid: false, reason: "Invalid coupon code", discountValue: 0, discountType: "PERCENT" });
    return;
  }

  if (coupon.validUntil && coupon.validUntil < new Date()) {
    res.json({ valid: false, reason: "Coupon has expired", discountValue: 0, discountType: "PERCENT" });
    return;
  }

  if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) {
    res.json({ valid: false, reason: "Coupon usage limit reached", discountValue: 0, discountType: "PERCENT" });
    return;
  }

  const subtotalCents = parsed.data.subtotalCents || 0;
  let discountCents = 0;

  if (coupon.discountType === "PERCENT") {
    discountCents = Math.round(subtotalCents * coupon.discountValue / 100);
  } else {
    discountCents = Math.min(Math.round(coupon.discountValue * 100), subtotalCents);
  }

  // Discount can never exceed order total
  discountCents = Math.min(discountCents, subtotalCents);

  res.json({
    valid: true,
    discountValue: coupon.discountValue,
    discountType: coupon.discountType,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderCents: coupon.minOrderCents,
      maxUses: coupon.maxUses,
      usesCount: coupon.usesCount,
      validFrom: coupon.validFrom ? coupon.validFrom.toISOString() : null,
      validUntil: coupon.validUntil ? coupon.validUntil.toISOString() : null,
      isActive: coupon.isActive,
      createdAt: coupon.createdAt.toISOString(),
    },
    discountCents,
    message: `${coupon.discountType === "PERCENT" ? coupon.discountValue + "%" : "$" + coupon.discountValue} off`,
  });
});

export default router;
