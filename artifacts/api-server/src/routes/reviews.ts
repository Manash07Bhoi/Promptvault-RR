import { Router, type IRouter } from "express";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db, reviewsTable, usersTable, packsTable, ordersTable, orderItemsTable } from "@workspace/db";
import { requireAuth, optionalAuth, type AuthRequest } from "../middlewares/auth.js";
import { CreateReviewBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function resolvePackId(packIdOrSlug: string): Promise<number | null> {
  const numeric = parseInt(packIdOrSlug);
  if (!isNaN(numeric)) return numeric;
  const [pack] = await db.select({ id: packsTable.id }).from(packsTable).where(eq(packsTable.slug, packIdOrSlug)).limit(1);
  return pack ? pack.id : null;
}

router.get("/reviews/:packId", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = await resolvePackId(req.params.packId as string);
  if (!packId) { res.status(404).json({ error: "Pack not found" }); return; }
  const page = parseInt(String(req.query.page || "1"));
  const limit = Math.min(parseInt(String(req.query.limit || "10")), 50);
  const offset = (page - 1) * limit;

  const [reviews, [{ count }], [{ avg }]] = await Promise.all([
    db.select().from(reviewsTable).where(eq(reviewsTable.packId, packId)).orderBy(desc(reviewsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(reviewsTable).where(eq(reviewsTable.packId, packId)),
    db.select({ avg: sql<number>`avg(rating)` }).from(reviewsTable).where(eq(reviewsTable.packId, packId)),
  ]);

  const userIds = [...new Set(reviews.map(r => r.userId))];
  const users = userIds.length > 0
    ? await db.select({ id: usersTable.id, displayName: usersTable.displayName, avatarUrl: usersTable.avatarUrl }).from(usersTable).where(inArray(usersTable.id, userIds))
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const total = Number(count);

  // Rating distribution
  const dist: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  const distResult = await db.select({ rating: reviewsTable.rating, count: sql<number>`count(*)` })
    .from(reviewsTable).where(eq(reviewsTable.packId, packId))
    .groupBy(reviewsTable.rating);
  for (const d of distResult) {
    dist[String(d.rating)] = Number(d.count);
  }

  res.json({
    reviews: reviews.map(r => ({
      id: r.id,
      packId: r.packId,
      userId: r.userId,
      userDisplayName: userMap[r.userId]?.displayName || "Anonymous",
      userAvatarUrl: userMap[r.userId]?.avatarUrl || null,
      rating: r.rating,
      title: r.title,
      body: r.body,
      isVerified: r.isVerified,
      helpfulCount: r.helpfulCount,
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    avgRating: avg ? Number(Number(avg).toFixed(1)) : null,
    ratingDistribution: dist,
  });
});

// GET /api/reviews/:packId/my-review — check if current user already reviewed this pack
router.get("/reviews/:packId/my-review", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = await resolvePackId(req.params.packId as string);
  if (!packId) { res.status(404).json({ error: "Pack not found" }); return; }

  const [existing] = await db.select().from(reviewsTable)
    .where(and(eq(reviewsTable.packId, packId), eq(reviewsTable.userId, req.user!.userId))).limit(1);

  res.json({ hasReviewed: !!existing, review: existing || null });
});

router.post("/reviews/:packId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = await resolvePackId(req.params.packId as string);
  if (!packId) { res.status(404).json({ error: "Pack not found" }); return; }
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  // Server-side body validation: reject whitespace-only or too-short review bodies
  if (parsed.data.body !== undefined) {
    const trimmedBody = parsed.data.body.trim();
    if (trimmedBody.length > 0 && trimmedBody.length < 10) {
      res.status(400).json({ error: "Review body must be at least 10 characters" });
      return;
    }
    parsed.data.body = trimmedBody || undefined;
  }

  // Check if user purchased
  const orders = await db.select().from(ordersTable)
    .where(and(eq(ordersTable.userId, req.user!.userId), eq(ordersTable.status, "COMPLETED")));

  let isVerified = false;
  if (orders.length > 0) {
    const item = await db.select().from(orderItemsTable)
      .where(and(inArray(orderItemsTable.orderId, orders.map(o => o.id)), eq(orderItemsTable.packId, packId)))
      .limit(1);
    isVerified = item.length > 0;
  }

  // Enforce purchase gate — only users with a completed order for this pack can review
  if (!isVerified) {
    res.status(403).json({ error: "You must purchase this pack to review it" });
    return;
  }

  // Check existing review
  const existing = await db.select().from(reviewsTable)
    .where(and(eq(reviewsTable.packId, packId), eq(reviewsTable.userId, req.user!.userId))).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "You already reviewed this pack" });
    return;
  }

  const [review] = await db.insert(reviewsTable).values({
    packId,
    userId: req.user!.userId,
    rating: parsed.data.rating,
    title: parsed.data.title,
    body: parsed.data.body,
    isVerified,
  }).returning();

  // Update pack rating
  const [{ avg, count }] = await db.select({ avg: sql<number>`avg(rating)`, count: sql<number>`count(*)` })
    .from(reviewsTable).where(eq(reviewsTable.packId, packId));
  await db.update(packsTable).set({ avgRating: Number(avg), reviewCount: Number(count) }).where(eq(packsTable.id, packId));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

  res.status(201).json({
    id: review.id,
    packId: review.packId,
    userId: review.userId,
    userDisplayName: user?.displayName || "Anonymous",
    userAvatarUrl: user?.avatarUrl || null,
    rating: review.rating,
    title: review.title,
    body: review.body,
    isVerified: review.isVerified,
    helpfulCount: review.helpfulCount,
    createdAt: review.createdAt.toISOString(),
  });
});

router.delete("/reviews/:packId/:reviewId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const reviewId = parseInt(req.params.reviewId as string);
  const packId = await resolvePackId(req.params.packId as string);
  if (!packId) { res.status(404).json({ error: "Pack not found" }); return; }

  const [review] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId)).limit(1);
  if (!review) { res.status(404).json({ error: "Review not found" }); return; }
  if (review.userId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(reviewsTable).where(eq(reviewsTable.id, reviewId));

  const [{ avg, count }] = await db.select({ avg: sql<number>`avg(rating)`, count: sql<number>`count(*)` })
    .from(reviewsTable).where(eq(reviewsTable.packId, packId));
  await db.update(packsTable).set({ avgRating: avg ? Number(avg) : null, reviewCount: Number(count) }).where(eq(packsTable.id, packId));

  res.json({ message: "Review deleted" });
});

export default router;
