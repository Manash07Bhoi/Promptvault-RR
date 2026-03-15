import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  db, usersTable, packsTable, ordersTable, orderItemsTable,
  creatorApplicationsTable, creatorAgreementsTable, reviewsTable,
  promptsTable
} from "@workspace/db";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth.js";
import { logger } from "../utils/logger.js";

const router: IRouter = Router();

// POST /api/creator/apply
router.post("/creator/apply", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { bio, specialties } = req.body;
  const userId = req.user!.userId;

  const [existing] = await db.select().from(creatorApplicationsTable).where(eq(creatorApplicationsTable.userId, userId)).limit(1);
  if (existing && existing.status === "pending") {
    res.status(400).json({ error: "Application already pending" });
    return;
  }

  const [app] = await db.insert(creatorApplicationsTable).values({
    userId,
    bio,
    specialties: specialties || [],
    status: "pending",
  }).onConflictDoUpdate({
    target: creatorApplicationsTable.userId,
    set: { bio, specialties: specialties || [], status: "pending" },
  }).returning();

  res.status(201).json(app);
});

// GET /api/creator/status
router.get("/creator/status", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [app] = await db.select().from(creatorApplicationsTable)
    .where(eq(creatorApplicationsTable.userId, req.user!.userId)).limit(1);

  const [user] = await db.select({ isCreator: usersTable.isCreator, isVerified: usersTable.isVerified, subscriptionPlan: usersTable.subscriptionPlan })
    .from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);

  res.json({
    application: app || null,
    isCreator: user?.isCreator || false,
    isVerified: user?.isVerified || false,
    subscriptionPlan: user?.subscriptionPlan || "free",
  });
});

// GET /api/creator/dashboard - Revenue + pack performance
router.get("/creator/dashboard", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;

  const [user] = await db.select({ isCreator: usersTable.isCreator }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user?.isCreator) { res.status(403).json({ error: "Creator access required" }); return; }

  // Get all creator's packs
  const packs = await db.select().from(packsTable).where(eq(packsTable.creatorId, userId)).orderBy(desc(packsTable.updatedAt));

  // Revenue summary (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400 * 1000);

  const revenueResult = await db.select({
    totalRevenue: sql<number>`SUM(${orderItemsTable.priceCents})`,
    totalOrders: sql<number>`COUNT(*)`,
  }).from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .innerJoin(packsTable, eq(orderItemsTable.packId, packsTable.id))
    .where(and(
      eq(packsTable.creatorId, userId),
      eq(ordersTable.status, "COMPLETED"),
      sql`${ordersTable.createdAt} >= ${thirtyDaysAgo}`
    ));

  const lifetimeRevenue = await db.select({
    total: sql<number>`SUM(${packsTable.totalRevenueCents})`,
  }).from(packsTable).where(eq(packsTable.creatorId, userId));

  res.json({
    packs,
    revenue: {
      last30DaysCents: Number(revenueResult[0]?.totalRevenue || 0),
      last30DaysOrders: Number(revenueResult[0]?.totalOrders || 0),
      lifetimeCents: Number(lifetimeRevenue[0]?.total || 0),
    },
  });
});

// GET /api/creator/analytics
router.get("/creator/analytics", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;

  const packs = await db.select({
    id: packsTable.id,
    title: packsTable.title,
    status: packsTable.status,
    viewCount: packsTable.viewCount,
    totalDownloads: packsTable.totalDownloads,
    avgRating: packsTable.avgRating,
    reviewCount: packsTable.reviewCount,
    appreciationCount: packsTable.appreciationCount,
    totalRevenueCents: packsTable.totalRevenueCents,
    publishedAt: packsTable.publishedAt,
  }).from(packsTable)
    .where(eq(packsTable.creatorId, userId))
    .orderBy(desc(packsTable.totalRevenueCents));

  res.json({ packs });
});

// GET /api/creator/payouts
router.get("/creator/payouts", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;

  const [user] = await db.select({
    isCreator: usersTable.isCreator,
    commissionRate: usersTable.commissionRate,
    stripeConnectId: usersTable.stripeConnectId,
  }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  if (!user?.isCreator) { res.status(403).json({ error: "Creator access required" }); return; }

  const totalRevenue = await db.select({
    total: sql<number>`SUM(${packsTable.totalRevenueCents})`,
  }).from(packsTable).where(eq(packsTable.creatorId, userId));

  const grossRevenueCents = Number(totalRevenue[0]?.total || 0);
  const creatorShareRate = (user.commissionRate || 70) / 100;
  const creatorEarningsCents = Math.floor(grossRevenueCents * creatorShareRate);

  res.json({
    isConnected: !!user.stripeConnectId,
    stripeConnectId: user.stripeConnectId,
    commissionRate: user.commissionRate || 70,
    grossRevenueCents,
    creatorEarningsCents,
    payouts: [],
  });
});

// POST /api/creator/packs - Create pack (creator flow)
router.post("/creator/packs", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;
  const [user] = await db.select({ isCreator: usersTable.isCreator }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user?.isCreator) { res.status(403).json({ error: "Creator access required" }); return; }

  const { title, description, shortDescription, categoryId, priceCents, isFree, tags, aiToolTargets } = req.body;

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now();
  const [pack] = await db.insert(packsTable).values({
    title,
    slug,
    description,
    shortDescription,
    categoryId: parseInt(categoryId),
    priceCents: parseInt(priceCents) || 0,
    isFree: !!isFree,
    tags: tags || [],
    aiToolTargets: aiToolTargets || [],
    status: "PENDING_REVIEW",
    creatorId: userId,
  }).returning();

  res.status(201).json(pack);
});

// PATCH /api/creator/packs/:id
router.patch("/creator/packs/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.id as string);
  const userId = req.user!.userId;

  const [pack] = await db.select().from(packsTable).where(and(eq(packsTable.id, packId), eq(packsTable.creatorId, userId))).limit(1);
  if (!pack) { res.status(403).json({ error: "Forbidden" }); return; }

  const { title, description, shortDescription, priceCents, isFree, categoryId, tags, aiToolTargets, thumbnailUrl } = req.body;

  const [updated] = await db.update(packsTable).set({
    title: title || pack.title,
    description: description !== undefined ? description : pack.description,
    shortDescription: shortDescription !== undefined ? shortDescription : pack.shortDescription,
    priceCents: priceCents !== undefined ? parseInt(priceCents) : pack.priceCents,
    isFree: isFree !== undefined ? !!isFree : pack.isFree,
    categoryId: categoryId !== undefined ? parseInt(categoryId) : pack.categoryId,
    tags: tags !== undefined ? tags : pack.tags,
    aiToolTargets: aiToolTargets !== undefined ? aiToolTargets : pack.aiToolTargets,
    thumbnailUrl: thumbnailUrl || pack.thumbnailUrl,
  }).where(eq(packsTable.id, packId)).returning();

  res.json(updated);
});

// GET /api/creator/packs - All of creator's packs
router.get("/creator/packs", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;
  const packs = await db.select().from(packsTable)
    .where(eq(packsTable.creatorId, userId))
    .orderBy(desc(packsTable.createdAt));
  res.json({ packs });
});

// GET /api/creator/packs/:id - Single pack with its prompts
router.get("/creator/packs/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.id as string);
  const userId = req.user!.userId;

  const [pack] = await db.select().from(packsTable)
    .where(and(eq(packsTable.id, packId), eq(packsTable.creatorId, userId)))
    .limit(1);

  if (!pack) { res.status(404).json({ error: "Pack not found" }); return; }

  const prompts = await db.select().from(promptsTable)
    .where(eq(promptsTable.packId, packId))
    .orderBy(promptsTable.sortOrder);

  res.json({ pack, prompts });
});

// DELETE /api/creator/packs/:id
router.delete("/creator/packs/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.id as string);
  const userId = req.user!.userId;

  const [pack] = await db.select().from(packsTable)
    .where(and(eq(packsTable.id, packId), eq(packsTable.creatorId, userId)))
    .limit(1);

  if (!pack) { res.status(404).json({ error: "Pack not found" }); return; }
  if (pack.status === "PUBLISHED") { res.status(400).json({ error: "Cannot delete a published pack" }); return; }

  await db.delete(promptsTable).where(eq(promptsTable.packId, packId));
  await db.delete(packsTable).where(eq(packsTable.id, packId));

  res.json({ success: true });
});

// POST /api/creator/packs/:id/prompts - Add a prompt to the pack
router.post("/creator/packs/:id/prompts", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.id as string);
  const userId = req.user!.userId;

  const [pack] = await db.select({ id: packsTable.id }).from(packsTable)
    .where(and(eq(packsTable.id, packId), eq(packsTable.creatorId, userId)))
    .limit(1);

  if (!pack) { res.status(403).json({ error: "Forbidden" }); return; }

  const { title, body, aiTool, useCase } = req.body;
  if (!body?.trim()) { res.status(400).json({ error: "body is required" }); return; }

  // Extract {{variable}} patterns from body
  const variables = [...new Set((body.match(/\{\{(\w{1,64})\}\}/g) || []).map((v: string) => v.replace(/[{}]/g, "")))] as string[];

  const [existing] = await db.select({ count: sql<number>`count(*)` }).from(promptsTable).where(eq(promptsTable.packId, packId));
  const sortOrder = Number(existing?.count || 0);

  const [prompt] = await db.insert(promptsTable).values({
    packId,
    title: title || body.substring(0, 60).trim(),
    body: body.trim(),
    aiTool: aiTool || null,
    useCase: useCase || null,
    variables,
    sortOrder,
  }).returning();

  // Update pack prompt count
  await db.update(packsTable).set({ promptCount: sql`${packsTable.promptCount} + 1` }).where(eq(packsTable.id, packId));

  res.status(201).json(prompt);
});

// PATCH /api/creator/packs/:id/prompts/:promptId - Edit a prompt
router.patch("/creator/packs/:id/prompts/:promptId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.id as string);
  const promptId = parseInt(req.params.promptId as string);
  const userId = req.user!.userId;

  const [pack] = await db.select({ id: packsTable.id }).from(packsTable)
    .where(and(eq(packsTable.id, packId), eq(packsTable.creatorId, userId)))
    .limit(1);

  if (!pack) { res.status(403).json({ error: "Forbidden" }); return; }

  const [existing] = await db.select().from(promptsTable)
    .where(and(eq(promptsTable.id, promptId), eq(promptsTable.packId, packId)))
    .limit(1);

  if (!existing) { res.status(404).json({ error: "Prompt not found" }); return; }

  const { title, body, aiTool, useCase } = req.body;
  const variables = body
    ? ([...new Set((body.match(/\{\{(\w{1,64})\}\}/g) || []).map((v: string) => v.replace(/[{}]/g, "")))] as string[])
    : existing.variables;

  const [updated] = await db.update(promptsTable).set({
    title: title !== undefined ? title : existing.title,
    body: body !== undefined ? body.trim() : existing.body,
    aiTool: aiTool !== undefined ? aiTool || null : existing.aiTool,
    useCase: useCase !== undefined ? useCase || null : existing.useCase,
    variables,
  }).where(eq(promptsTable.id, promptId)).returning();

  res.json(updated);
});

// DELETE /api/creator/packs/:id/prompts/:promptId
router.delete("/creator/packs/:id/prompts/:promptId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.id as string);
  const promptId = parseInt(req.params.promptId as string);
  const userId = req.user!.userId;

  const [pack] = await db.select({ id: packsTable.id }).from(packsTable)
    .where(and(eq(packsTable.id, packId), eq(packsTable.creatorId, userId)))
    .limit(1);

  if (!pack) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(promptsTable).where(and(eq(promptsTable.id, promptId), eq(promptsTable.packId, packId)));
  await db.update(packsTable).set({ promptCount: sql`GREATEST(${packsTable.promptCount} - 1, 0)` }).where(eq(packsTable.id, packId));

  res.json({ success: true });
});

// POST /api/creator/packs/:id/submit - Submit for review
router.post("/creator/packs/:id/submit", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.id as string);
  const userId = req.user!.userId;

  const [pack] = await db.select().from(packsTable)
    .where(and(eq(packsTable.id, packId), eq(packsTable.creatorId, userId)))
    .limit(1);

  if (!pack) { res.status(404).json({ error: "Pack not found" }); return; }
  if (!["DRAFT", "REJECTED"].includes(pack.status)) {
    res.status(400).json({ error: "Only draft or rejected packs can be submitted" }); return;
  }

  const promptCount = await db.select({ count: sql<number>`count(*)` }).from(promptsTable).where(eq(promptsTable.packId, packId));
  if (Number(promptCount[0]?.count || 0) < 1) {
    res.status(400).json({ error: "Add at least one prompt before submitting" }); return;
  }

  const [updated] = await db.update(packsTable).set({ status: "PENDING_REVIEW" }).where(eq(packsTable.id, packId)).returning();
  res.json(updated);
});

// ============================================================
// ADMIN - CREATOR MANAGEMENT
// ============================================================

// GET /api/admin/creators/applications
router.get("/admin/creators/applications", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const applications = await db.select({
    id: creatorApplicationsTable.id,
    userId: creatorApplicationsTable.userId,
    bio: creatorApplicationsTable.bio,
    specialties: creatorApplicationsTable.specialties,
    status: creatorApplicationsTable.status,
    rejectionReason: creatorApplicationsTable.rejectionReason,
    createdAt: creatorApplicationsTable.createdAt,
    applicantName: usersTable.displayName,
    applicantEmail: usersTable.email,
    applicantAvatar: usersTable.avatarUrl,
    publicPackCount: usersTable.publicPackCount,
  }).from(creatorApplicationsTable)
    .innerJoin(usersTable, eq(creatorApplicationsTable.userId, usersTable.id))
    .where(eq(creatorApplicationsTable.status, "pending"))
    .orderBy(desc(creatorApplicationsTable.createdAt));

  res.json({ applications });
});

// GET /api/admin/creators
router.get("/admin/creators", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const creators = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    displayName: usersTable.displayName,
    username: usersTable.username,
    avatarUrl: usersTable.avatarUrl,
    isVerified: usersTable.isVerified,
    commissionRate: usersTable.commissionRate,
    publicPackCount: usersTable.publicPackCount,
    totalDownloadsAllPacks: usersTable.totalDownloadsAllPacks,
    createdAt: usersTable.createdAt,
  }).from(usersTable)
    .where(eq(usersTable.isCreator, true))
    .orderBy(desc(usersTable.totalDownloadsAllPacks));

  res.json({ creators });
});

// POST /api/admin/creators/:id/approve
router.post("/admin/creators/:id/approve", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const userId = parseInt(req.params.id as string);

  await db.update(creatorApplicationsTable).set({ status: "approved", reviewedBy: req.user!.userId, reviewedAt: new Date() })
    .where(eq(creatorApplicationsTable.userId, userId));

  await db.update(usersTable).set({ isCreator: true, role: "CREATOR" }).where(eq(usersTable.id, userId));

  res.json({ success: true });
});

// POST /api/admin/creators/:id/reject
router.post("/admin/creators/:id/reject", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const userId = parseInt(req.params.id as string);
  const { reason } = req.body;

  await db.update(creatorApplicationsTable).set({
    status: "rejected",
    rejectionReason: reason,
    reviewedBy: req.user!.userId,
    reviewedAt: new Date(),
  }).where(eq(creatorApplicationsTable.userId, userId));

  res.json({ success: true });
});

// PATCH /api/admin/creators/:id/commission
router.patch("/admin/creators/:id/commission", requireAuth, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  const userId = parseInt(req.params.id as string);
  const { commissionRate } = req.body;

  await db.update(usersTable).set({ commissionRate: parseInt(commissionRate) }).where(eq(usersTable.id, userId));
  res.json({ success: true });
});

export default router;
