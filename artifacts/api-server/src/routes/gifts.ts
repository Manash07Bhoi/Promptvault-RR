import { Router, type IRouter } from "express";
import { eq, and, isNotNull, gte, lte, desc, sql } from "drizzle-orm";
import { db, giftOrdersTable, packsTable, usersTable, ordersTable, orderItemsTable, saleEventsTable, categoriesTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import crypto from "crypto";

const router: IRouter = Router();

// POST /api/gifts - Purchase as gift
router.post("/gifts", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { packId, recipientEmail, senderMessage, scheduledFor } = req.body;
  if (!packId || !recipientEmail) { res.status(400).json({ error: "packId and recipientEmail required" }); return; }

  const [pack] = await db.select().from(packsTable).where(eq(packsTable.id, packId)).limit(1);
  if (!pack || pack.status !== "PUBLISHED") { res.status(404).json({ error: "Pack not found" }); return; }

  const token = crypto.randomBytes(32).toString("hex");

  // Create order
  const [order] = await db.insert(ordersTable).values({
    userId: req.user!.userId,
    status: "PENDING",
    subtotalCents: pack.priceCents,
    totalCents: pack.priceCents,
    isGift: true,
  }).returning();

  await db.insert(giftOrdersTable).values({
    orderId: order.id,
    recipientEmail,
    senderMessage,
    redemptionToken: token,
    scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
  }).returning();

  res.status(201).json({
    orderId: order.id,
    giftToken: token,
    redemptionUrl: `${process.env.APP_URL}/gift/${token}`,
  });
});

// GET /api/gifts/:token - Preview gift
router.get("/gifts/:token", async (req, res): Promise<void> => {
  const token = req.params.token as string;
  const [gift] = await db.select({
    id: giftOrdersTable.id,
    recipientEmail: giftOrdersTable.recipientEmail,
    senderMessage: giftOrdersTable.senderMessage,
    scheduledFor: giftOrdersTable.scheduledFor,
    redeemedAt: giftOrdersTable.redeemedAt,
    orderId: giftOrdersTable.orderId,
  }).from(giftOrdersTable)
    .where(eq(giftOrdersTable.redemptionToken, token))
    .limit(1);

  if (!gift) { res.status(404).json({ error: "Invalid gift link" }); return; }
  if (gift.redeemedAt) { res.status(400).json({ error: "Gift already redeemed" }); return; }

  res.json({ gift });
});

// POST /api/gifts/:token/redeem
router.post("/gifts/:token/redeem", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const token = req.params.token as string;
  const userId = req.user!.userId;

  const [gift] = await db.select().from(giftOrdersTable).where(eq(giftOrdersTable.redemptionToken, token)).limit(1);
  if (!gift) { res.status(404).json({ error: "Invalid gift link" }); return; }
  if (gift.redeemedAt) { res.status(400).json({ error: "Already redeemed" }); return; }

  await db.update(giftOrdersTable).set({ redeemedAt: new Date(), recipientUserId: userId }).where(eq(giftOrdersTable.redemptionToken, token));
  await db.update(ordersTable).set({ status: "COMPLETED", completedAt: new Date() }).where(eq(ordersTable.id, gift.orderId));

  res.json({ success: true, message: "Gift redeemed! Check your downloads." });
});

// GET /api/sales — Active flash sales (packs on sale via sale_events table)
router.get("/sales", async (_req, res): Promise<void> => {
  const now = new Date();

  // Get all active sale events
  const activeSales = await db
    .select({
      saleId: saleEventsTable.id,
      packId: saleEventsTable.packId,
      salePriceCents: saleEventsTable.salePriceCents,
      endsAt: saleEventsTable.endsAt,
      startsAt: saleEventsTable.startsAt,
    })
    .from(saleEventsTable)
    .where(
      and(
        eq(saleEventsTable.isActive, true),
        lte(saleEventsTable.startsAt, now),
        gte(saleEventsTable.endsAt, now)
      )
    )
    .orderBy(desc(saleEventsTable.salePriceCents))
    .limit(50);

  if (activeSales.length === 0) {
    // Fallback: packs that have a sale price explicitly set on the pack itself
    const packsWithSalePrice = await db
      .select({
        id: packsTable.id,
        title: packsTable.title,
        slug: packsTable.slug,
        thumbnailUrl: packsTable.thumbnailUrl,
        priceCents: packsTable.priceCents,
        comparePriceCents: packsTable.comparePriceCents,
        salePriceCents: packsTable.salePriceCents,
        avgRating: packsTable.avgRating,
        reviewCount: packsTable.reviewCount,
        isFree: packsTable.isFree,
        tags: packsTable.tags,
        shortDescription: packsTable.shortDescription,
        saleEventId: packsTable.saleEventId,
        endsAt: sql<Date | null>`NULL`,
      })
      .from(packsTable)
      .where(
        and(
          eq(packsTable.status, "PUBLISHED"),
          isNotNull(packsTable.salePriceCents)
        )
      )
      .limit(20);

    res.json({ packs: packsWithSalePrice, activeSaleCount: packsWithSalePrice.length });
    return;
  }

  // Fetch the full pack details for packs with active sale events
  const packIds = activeSales.map((s) => s.packId);
  const saleMap = new Map(activeSales.map((s) => [s.packId, s]));

  const packs = await db
    .select({
      id: packsTable.id,
      title: packsTable.title,
      slug: packsTable.slug,
      thumbnailUrl: packsTable.thumbnailUrl,
      priceCents: packsTable.priceCents,
      comparePriceCents: packsTable.comparePriceCents,
      salePriceCents: packsTable.salePriceCents,
      avgRating: packsTable.avgRating,
      reviewCount: packsTable.reviewCount,
      isFree: packsTable.isFree,
      tags: packsTable.tags,
      shortDescription: packsTable.shortDescription,
      saleEventId: packsTable.saleEventId,
    })
    .from(packsTable)
    .where(
      and(
        eq(packsTable.status, "PUBLISHED"),
        // We filter in JS after to add the sale-event price
      )
    )
    .limit(100);

  const salePacks = packs
    .filter((p) => packIds.includes(p.id))
    .map((p) => {
      const sale = saleMap.get(p.id);
      return {
        ...p,
        salePriceCents: sale?.salePriceCents ?? p.salePriceCents,
        endsAt: sale?.endsAt?.toISOString() ?? null,
      };
    });

  res.json({ packs: salePacks, activeSaleCount: salePacks.length });
});

// GET /api/sales/active — alias
router.get("/sales/active", async (_req, res): Promise<void> => {
  const now = new Date();

  const activeSales = await db
    .select({
      id: saleEventsTable.id,
      packId: saleEventsTable.packId,
      salePriceCents: saleEventsTable.salePriceCents,
      startsAt: saleEventsTable.startsAt,
      endsAt: saleEventsTable.endsAt,
      isActive: saleEventsTable.isActive,
    })
    .from(saleEventsTable)
    .where(
      and(
        eq(saleEventsTable.isActive, true),
        lte(saleEventsTable.startsAt, now),
        gte(saleEventsTable.endsAt, now)
      )
    )
    .orderBy(desc(saleEventsTable.endsAt));

  res.json({ sales: activeSales, count: activeSales.length });
});

export default router;
