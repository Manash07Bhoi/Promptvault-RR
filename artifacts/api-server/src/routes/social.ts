import { Router, type IRouter } from "express";
import { eq, and, desc, sql, asc, inArray } from "drizzle-orm";
import {
  db, packsTable, usersTable,
  collectionsTable, collectionItemsTable, collectionFollowsTable,
  packCommentsTable, commentUpvotesTable, packAppreciationsTable,
  referralsTable
} from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

// ============================================================
// COLLECTIONS
// ============================================================

// GET /api/collections - Featured/trending public collections
router.get("/collections", async (req, res): Promise<void> => {
  const collections = await db.select({
    id: collectionsTable.id,
    userId: collectionsTable.userId,
    title: collectionsTable.title,
    description: collectionsTable.description,
    coverImageUrl: collectionsTable.coverImageUrl,
    itemCount: collectionsTable.itemCount,
    followerCount: collectionsTable.followerCount,
    isFeatured: collectionsTable.isFeatured,
    createdAt: collectionsTable.createdAt,
    updatedAt: collectionsTable.updatedAt,
    ownerName: usersTable.displayName,
    ownerUsername: usersTable.username,
    ownerAvatar: usersTable.avatarUrl,
  }).from(collectionsTable)
    .innerJoin(usersTable, eq(collectionsTable.userId, usersTable.id))
    .where(eq(collectionsTable.visibility, "public"))
    .orderBy(desc(collectionsTable.followerCount))
    .limit(20);

  res.json({ collections });
});

// POST /api/collections - Create collection
router.post("/collections", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { title, description, visibility = "public" } = req.body;
  if (!title) { res.status(400).json({ error: "title required" }); return; }

  const [collection] = await db.insert(collectionsTable).values({
    userId: req.user!.userId,
    title,
    description,
    visibility,
  }).returning();

  res.status(201).json(collection);
});

// GET /api/collections/:id
router.get("/collections/:id", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const [collection] = await db.select({
    id: collectionsTable.id,
    userId: collectionsTable.userId,
    title: collectionsTable.title,
    description: collectionsTable.description,
    coverImageUrl: collectionsTable.coverImageUrl,
    visibility: collectionsTable.visibility,
    itemCount: collectionsTable.itemCount,
    followerCount: collectionsTable.followerCount,
    isFeatured: collectionsTable.isFeatured,
    createdAt: collectionsTable.createdAt,
    updatedAt: collectionsTable.updatedAt,
    ownerName: usersTable.displayName,
    ownerUsername: usersTable.username,
    ownerAvatar: usersTable.avatarUrl,
    ownerVerified: usersTable.isVerified,
  }).from(collectionsTable)
    .innerJoin(usersTable, eq(collectionsTable.userId, usersTable.id))
    .where(eq(collectionsTable.id, id))
    .limit(1);

  if (!collection) { res.status(404).json({ error: "Collection not found" }); return; }
  if (collection.visibility === "private" && req.user?.userId !== collection.userId) {
    res.status(403).json({ error: "Private collection" }); return;
  }

  // Get items
  const items = await db.select().from(collectionItemsTable)
    .where(eq(collectionItemsTable.collectionId, id))
    .orderBy(asc(collectionItemsTable.sortOrder));

  // Check if current user follows this collection
  let isFollowing = false;
  if (req.user?.userId) {
    const [follow] = await db.select().from(collectionFollowsTable)
      .where(and(eq(collectionFollowsTable.userId, req.user.userId), eq(collectionFollowsTable.collectionId, id))).limit(1);
    isFollowing = !!follow;
  }

  res.json({ collection, items, isFollowing });
});

// PATCH /api/collections/:id
router.patch("/collections/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const [collection] = await db.select().from(collectionsTable).where(eq(collectionsTable.id, id)).limit(1);
  if (!collection || collection.userId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const { title, description, visibility, coverImageUrl } = req.body;
  const [updated] = await db.update(collectionsTable).set({ title, description, visibility, coverImageUrl }).where(eq(collectionsTable.id, id)).returning();
  res.json(updated);
});

// DELETE /api/collections/:id
router.delete("/collections/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const [collection] = await db.select().from(collectionsTable).where(eq(collectionsTable.id, id)).limit(1);
  if (!collection || collection.userId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.delete(collectionsTable).where(eq(collectionsTable.id, id));
  res.json({ success: true });
});

// POST /api/collections/:id/items - Add item
router.post("/collections/:id/items", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const collectionId = parseInt(req.params.id as string);
  const { itemType = "pack", itemId, sortOrder } = req.body;
  const [collection] = await db.select().from(collectionsTable).where(eq(collectionsTable.id, collectionId)).limit(1);
  if (!collection || collection.userId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  const [item] = await db.insert(collectionItemsTable).values({ collectionId, itemType, itemId, sortOrder: sortOrder || 0 }).returning();
  await db.update(collectionsTable).set({ itemCount: sql`${collectionsTable.itemCount} + 1` }).where(eq(collectionsTable.id, collectionId));
  res.status(201).json(item);
});

// DELETE /api/collections/:id/items/:itemId
router.delete("/collections/:id/items/:itemId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const collectionId = parseInt(req.params.id as string);
  const itemId = parseInt(req.params.itemId as string);
  const [collection] = await db.select().from(collectionsTable).where(eq(collectionsTable.id, collectionId)).limit(1);
  if (!collection || collection.userId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(collectionItemsTable).where(and(eq(collectionItemsTable.collectionId, collectionId), eq(collectionItemsTable.id, itemId)));
  await db.update(collectionsTable).set({ itemCount: sql`GREATEST(${collectionsTable.itemCount} - 1, 0)` }).where(eq(collectionsTable.id, collectionId));
  res.json({ success: true });
});

// POST /api/collections/:id/follow
router.post("/collections/:id/follow", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const collectionId = parseInt(req.params.id as string);
  await db.insert(collectionFollowsTable).values({ userId: req.user!.userId, collectionId }).onConflictDoNothing();
  await db.update(collectionsTable).set({ followerCount: sql`${collectionsTable.followerCount} + 1` }).where(eq(collectionsTable.id, collectionId));
  res.json({ following: true });
});

// DELETE /api/collections/:id/follow
router.delete("/collections/:id/follow", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const collectionId = parseInt(req.params.id as string);
  await db.delete(collectionFollowsTable).where(and(eq(collectionFollowsTable.userId, req.user!.userId), eq(collectionFollowsTable.collectionId, collectionId)));
  await db.update(collectionsTable).set({ followerCount: sql`GREATEST(${collectionsTable.followerCount} - 1, 0)` }).where(eq(collectionsTable.id, collectionId));
  res.json({ following: false });
});

// GET /api/user/collections - Current user's collections
router.get("/user/collections", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const collections = await db.select().from(collectionsTable)
    .where(eq(collectionsTable.userId, req.user!.userId))
    .orderBy(desc(collectionsTable.updatedAt));
  res.json({ collections });
});

// GET /api/packs/:id/collections - Which of user's collections contain this pack
router.get("/packs/:id/collections", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.id as string);
  const userCollections = await db.select().from(collectionsTable)
    .where(eq(collectionsTable.userId, req.user!.userId));

  const collectionIds = userCollections.map(c => c.id);
  if (collectionIds.length === 0) { res.json({ collectionIds: [] }); return; }

  const containing = await db.select({ collectionId: collectionItemsTable.collectionId })
    .from(collectionItemsTable)
    .where(and(
      inArray(collectionItemsTable.collectionId, collectionIds),
      eq(collectionItemsTable.itemType, "pack"),
      eq(collectionItemsTable.itemId, packId)
    ));

  res.json({ collectionIds: containing.map(c => c.collectionId) });
});

// ============================================================
// COMMENTS
// ============================================================

// GET /api/packs/:id/comments
router.get("/packs/:id/comments", async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.id as string);
  const page = parseInt(req.query.page as string || "1");
  const limit = 10;
  const offset = (page - 1) * limit;

  const comments = await db.select({
    id: packCommentsTable.id,
    packId: packCommentsTable.packId,
    userId: packCommentsTable.userId,
    parentId: packCommentsTable.parentId,
    body: packCommentsTable.body,
    upvoteCount: packCommentsTable.upvoteCount,
    isFlagged: packCommentsTable.isFlagged,
    isDeleted: packCommentsTable.isDeleted,
    createdAt: packCommentsTable.createdAt,
    updatedAt: packCommentsTable.updatedAt,
    authorName: usersTable.displayName,
    authorUsername: usersTable.username,
    authorAvatar: usersTable.avatarUrl,
    authorVerified: usersTable.isVerified,
  }).from(packCommentsTable)
    .innerJoin(usersTable, eq(packCommentsTable.userId, usersTable.id))
    .where(and(
      eq(packCommentsTable.packId, packId),
      eq(packCommentsTable.isDeleted, false),
      sql`${packCommentsTable.parentId} IS NULL`
    ))
    .orderBy(desc(packCommentsTable.upvoteCount), desc(packCommentsTable.createdAt))
    .limit(limit).offset(offset);

  // Get upvoted status for current user
  let upvotedIds: number[] = [];
  if (req.user?.userId) {
    const upvotes = await db.select({ commentId: commentUpvotesTable.commentId })
      .from(commentUpvotesTable)
      .where(eq(commentUpvotesTable.userId, req.user.userId));
    upvotedIds = upvotes.map(u => u.commentId);
  }

  res.json({
    comments: comments.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      isUpvotedByMe: upvotedIds.includes(c.id),
    })),
    page,
  });
});

// GET /api/comments/:id/replies
router.get("/comments/:id/replies", async (req, res): Promise<void> => {
  const parentId = parseInt(req.params.id as string);
  const replies = await db.select({
    id: packCommentsTable.id,
    packId: packCommentsTable.packId,
    userId: packCommentsTable.userId,
    parentId: packCommentsTable.parentId,
    body: packCommentsTable.body,
    upvoteCount: packCommentsTable.upvoteCount,
    isDeleted: packCommentsTable.isDeleted,
    createdAt: packCommentsTable.createdAt,
    authorName: usersTable.displayName,
    authorUsername: usersTable.username,
    authorAvatar: usersTable.avatarUrl,
    authorVerified: usersTable.isVerified,
  }).from(packCommentsTable)
    .innerJoin(usersTable, eq(packCommentsTable.userId, usersTable.id))
    .where(and(eq(packCommentsTable.parentId, parentId), eq(packCommentsTable.isDeleted, false)))
    .orderBy(asc(packCommentsTable.createdAt));

  res.json({ replies });
});

// POST /api/packs/:id/comments
router.post("/packs/:id/comments", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.id as string);
  const { body } = req.body;
  if (!body?.trim()) { res.status(400).json({ error: "Comment body required" }); return; }

  const [comment] = await db.insert(packCommentsTable).values({
    packId,
    userId: req.user!.userId,
    body: body.trim(),
  }).returning();

  res.status(201).json(comment);
});

// POST /api/comments/:id/replies
router.post("/comments/:id/replies", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parentId = parseInt(req.params.id as string);
  const { body } = req.body;
  const [parent] = await db.select().from(packCommentsTable).where(eq(packCommentsTable.id, parentId)).limit(1);
  if (!parent) { res.status(404).json({ error: "Comment not found" }); return; }

  const [reply] = await db.insert(packCommentsTable).values({
    packId: parent.packId,
    userId: req.user!.userId,
    parentId,
    body: body.trim(),
  }).returning();

  res.status(201).json(reply);
});

// DELETE /api/comments/:id
router.delete("/comments/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const [comment] = await db.select().from(packCommentsTable).where(eq(packCommentsTable.id, id)).limit(1);
  if (!comment || comment.userId !== req.user!.userId) { res.status(403).json({ error: "Forbidden" }); return; }
  await db.update(packCommentsTable).set({ isDeleted: true }).where(eq(packCommentsTable.id, id));
  res.json({ success: true });
});

// POST /api/comments/:id/upvote
router.post("/comments/:id/upvote", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const commentId = parseInt(req.params.id as string);
  await db.insert(commentUpvotesTable).values({ userId: req.user!.userId, commentId }).onConflictDoNothing();
  await db.update(packCommentsTable).set({ upvoteCount: sql`${packCommentsTable.upvoteCount} + 1` }).where(eq(packCommentsTable.id, commentId));
  res.json({ success: true });
});

// DELETE /api/comments/:id/upvote
router.delete("/comments/:id/upvote", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const commentId = parseInt(req.params.id as string);
  await db.delete(commentUpvotesTable).where(and(eq(commentUpvotesTable.userId, req.user!.userId), eq(commentUpvotesTable.commentId, commentId)));
  await db.update(packCommentsTable).set({ upvoteCount: sql`GREATEST(${packCommentsTable.upvoteCount} - 1, 0)` }).where(eq(packCommentsTable.id, commentId));
  res.json({ success: true });
});

// POST /api/comments/:id/flag
router.post("/comments/:id/flag", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  await db.update(packCommentsTable).set({ isFlagged: true }).where(eq(packCommentsTable.id, id));
  res.json({ success: true });
});

// ============================================================
// APPRECIATIONS
// ============================================================

// POST /api/packs/:id/appreciate
router.post("/packs/:id/appreciate", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.id as string);
  await db.insert(packAppreciationsTable).values({ userId: req.user!.userId, packId }).onConflictDoNothing();
  await db.update(packsTable).set({ appreciationCount: sql`${packsTable.appreciationCount} + 1` }).where(eq(packsTable.id, packId));
  res.json({ appreciated: true });
});

// DELETE /api/packs/:id/appreciate
router.delete("/packs/:id/appreciate", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.id as string);
  await db.delete(packAppreciationsTable).where(and(eq(packAppreciationsTable.userId, req.user!.userId), eq(packAppreciationsTable.packId, packId)));
  await db.update(packsTable).set({ appreciationCount: sql`GREATEST(${packsTable.appreciationCount} - 1, 0)` }).where(eq(packsTable.id, packId));
  res.json({ appreciated: false });
});

// GET /api/packs/:id/appreciate - Check if current user has appreciated
router.get("/packs/:id/appreciate", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.id as string);
  const [row] = await db.select().from(packAppreciationsTable)
    .where(and(eq(packAppreciationsTable.userId, req.user!.userId), eq(packAppreciationsTable.packId, packId))).limit(1);
  res.json({ appreciated: !!row });
});

// ============================================================
// REFERRALS
// ============================================================

// GET /api/referrals/me - User's referral stats
router.get("/referrals/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;

  // Get or create user referral code
  const [user] = await db.select({
    referralCode: usersTable.referralCode,
    creditBalanceCents: usersTable.creditBalanceCents,
  }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  let referralCode = user?.referralCode;
  if (!referralCode) {
    // Generate a referral code
    const nanoid = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    referralCode = `PV${nanoid()}`;
    await db.update(usersTable).set({ referralCode }).where(eq(usersTable.id, userId));
  }

  // Get referral stats
  const referrals = await db.select().from(referralsTable)
    .where(eq(referralsTable.referrerId, userId))
    .orderBy(desc(referralsTable.createdAt));

  const signups = referrals.filter(r => r.referredUserId).length;
  const conversions = referrals.filter(r => r.status === "converted").length;
  const totalCredits = referrals.reduce((sum, r) => sum + (r.creditAwardedCents || 0), 0);

  res.json({
    referralCode,
    creditBalanceCents: user?.creditBalanceCents || 0,
    stats: {
      totalReferrals: referrals.length,
      signups,
      conversions,
      totalCreditsCents: totalCredits,
    },
    referrals: referrals.slice(0, 20).map(r => ({
      id: r.id,
      code: r.code,
      status: r.status,
      clickCount: r.clickCount,
      creditAwardedCents: r.creditAwardedCents,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

// POST /api/referrals/track - Track a referral click (sets cookie)
router.post("/referrals/track", async (req, res): Promise<void> => {
  const { code } = req.body;
  if (!code) { res.status(400).json({ error: "code required" }); return; }

  const [referral] = await db.select().from(referralsTable).where(eq(referralsTable.code, code)).limit(1);
  if (!referral) { res.status(404).json({ error: "Invalid referral code" }); return; }

  await db.update(referralsTable)
    .set({ clickCount: sql`${referralsTable.clickCount} + 1` })
    .where(eq(referralsTable.code, code));

  res.json({ tracked: true });
});

export default router;
