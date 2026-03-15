import { Router, type IRouter } from "express";
import { eq, desc, asc, sql, and, ilike, or, inArray, gte, lte, isNotNull } from "drizzle-orm";
import { sanitizeLikePattern } from "../utils/db-utils.js";
import {
  db, packsTable, categoriesTable, usersTable, ordersTable, orderItemsTable,
  promptsTable, automationJobsTable, moderationLogsTable,
  generatedFilesTable, couponsTable, systemSettingsTable,
  saleEventsTable, featureFlagsTable, experimentsTable, apiKeysTable,
  contentReportsTable, packAppealsTable, auditLogsTable, trustScoresTable, savedSearchesTable
} from "@workspace/db";
import { z } from "zod";
import { requireAuth, requireAdmin, type AuthRequest } from "../middlewares/auth.js";
import {
  AdminCreatePackBody,
  AdminUpdatePackBody,
  AdminUpdatePackStatusBody as UpdateStatusBody,
  AdminUpdatePromptBody as UpdatePromptBody,
  ApprovePackBody as ModerationActionBody,
  TriggerAutomationJobBody as TriggerJobBody,
  AdminCreateCategoryBody as CreateCategoryBody,
  AdminCreateCouponBody as CreateCouponBody,
  AdminUpdateUserBody,
} from "@workspace/api-zod";
import { logger } from "../utils/logger.js";

const router: IRouter = Router();

// Defence-in-depth: apply auth + admin check on every handler
router.use(requireAuth as any);
router.use(requireAdmin as any);

function formatPack(pack: any, category?: any) {
  return {
    id: pack.id,
    title: pack.title,
    slug: pack.slug,
    shortDescription: pack.shortDescription,
    description: pack.description,
    categoryId: pack.categoryId,
    categoryName: category?.name || null,
    categorySlug: category?.slug || null,
    status: pack.status,
    aiToolTargets: pack.aiToolTargets || [],
    promptCount: pack.promptCount,
    priceCents: pack.priceCents,
    comparePriceCents: pack.comparePriceCents,
    isFree: pack.isFree,
    isFeatured: pack.isFeatured,
    isBestseller: pack.isBestseller,
    thumbnailUrl: pack.thumbnailUrl,
    previewImageUrl: pack.previewImageUrl,
    tags: pack.tags || [],
    seoTitle: pack.seoTitle,
    seoDescription: pack.seoDescription,
    totalDownloads: pack.totalDownloads,
    totalRevenueCents: pack.totalRevenueCents, // admin-only field
    avgRating: pack.avgRating,
    reviewCount: pack.reviewCount,
    publishedAt: pack.publishedAt ? pack.publishedAt.toISOString() : null,
    moderatedAt: pack.moderatedAt ? pack.moderatedAt.toISOString() : null,
    createdAt: pack.createdAt.toISOString(),
    updatedAt: pack.updatedAt.toISOString(),
  };
}

// Dashboard — all KPIs in parallel
router.get("/dashboard", async (req: AuthRequest, _res, next): Promise<void> => {
  // Double-check role on handler level (defence-in-depth)
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN")) {
    logger.warn({ userId: req.user?.userId, path: req.path, requiredRole: "ADMIN" }, "Authorization denied");
    _res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}, async (_req, res): Promise<void> => {
  const [totalRevResult, totalOrdersResult, totalUsersResult, totalPacksResult, publishedPacksResult, pendingModerationResult, activeJobsResult] = await Promise.all([
    db.select({ total: sql<number>`COALESCE(SUM(total_cents), 0)` }).from(ordersTable).where(eq(ordersTable.status, "COMPLETED")),
    db.select({ count: sql<number>`count(*)` }).from(ordersTable),
    db.select({ count: sql<number>`count(*)` }).from(usersTable),
    db.select({ count: sql<number>`count(*)` }).from(packsTable),
    db.select({ count: sql<number>`count(*)` }).from(packsTable).where(eq(packsTable.status, "PUBLISHED")),
    db.select({ count: sql<number>`count(*)` }).from(packsTable).where(eq(packsTable.status, "PENDING_REVIEW")),
    db.select({ count: sql<number>`count(*)` }).from(automationJobsTable).where(eq(automationJobsTable.status, "RUNNING")),
  ]);

  const recentOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(5);
  const orderItems = recentOrders.length > 0
    ? await db.select().from(orderItemsTable).where(inArray(orderItemsTable.orderId, recentOrders.map(o => o.id)))
    : [];

  const revenueByDay = await db.execute(sql`
    SELECT DATE(created_at) as date, COALESCE(SUM(total_cents), 0) as revenue_cents, COUNT(*) as orders
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  res.json({
    totalRevenueCents: Number(totalRevResult[0]?.total || 0),
    totalOrders: Number(totalOrdersResult[0]?.count || 0),
    totalUsers: Number(totalUsersResult[0]?.count || 0),
    totalPacks: Number(totalPacksResult[0]?.count || 0),
    publishedPacks: Number(publishedPacksResult[0]?.count || 0),
    pendingModerationCount: Number(pendingModerationResult[0]?.count || 0),
    activeJobsCount: Number(activeJobsResult[0]?.count || 0),
    recentOrders: recentOrders.map(o => ({
      id: o.id, userId: o.userId, status: o.status,
      subtotalCents: o.subtotalCents, discountCents: o.discountCents,
      taxCents: o.taxCents, totalCents: o.totalCents, currency: o.currency,
      stripePaymentIntentId: o.stripePaymentIntentId,
      completedAt: o.completedAt ? o.completedAt.toISOString() : null,
      createdAt: o.createdAt.toISOString(),
      items: orderItems.filter(i => i.orderId === o.id).map(i => ({
        id: i.id, packId: i.packId, packSlug: "", titleSnapshot: i.titleSnapshot,
        priceCents: i.priceCents, downloadCount: i.downloadCount, firstDownloadedAt: null,
      })),
    })),
    revenueByDay: (revenueByDay.rows || []).map((r: any) => ({
      date: r.date,
      revenueCents: Number(r.revenue_cents || 0),
      orders: Number(r.orders || 0),
    })),
  });
});

// Analytics endpoint (period-aware)
router.get("/analytics", async (req: AuthRequest, res): Promise<void> => {
  const period = (req.query.period as string) || "30d";
  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[period] || 30;

  const [revenueByDay, totalRevResult, totalOrdersResult, totalDownloadsResult, newUsersResult, topPacksResult] = await Promise.all([
    db.execute(sql`
      SELECT DATE(created_at) as date,
        COALESCE(SUM(total_cents), 0) as revenue_cents,
        COUNT(*) as orders
      FROM orders
      WHERE status = 'COMPLETED' AND created_at >= NOW() - (${days} || ' days')::INTERVAL
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `),
    db.execute(sql`SELECT COALESCE(SUM(total_cents), 0) as total FROM orders WHERE status = 'COMPLETED' AND created_at >= NOW() - (${days} || ' days')::INTERVAL`),
    db.execute(sql`SELECT COUNT(*) as count FROM orders WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL`),
    db.execute(sql`SELECT COALESCE(SUM(download_count), 0) as total FROM order_items WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL`),
    db.execute(sql`SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL`),
    db.execute(sql`
      SELECT p.id, p.title, p.slug, p.thumbnail_url, p.total_downloads, p.avg_rating, p.review_count,
        COALESCE(SUM(oi.price_cents), 0) as revenue_cents
      FROM packs p
      LEFT JOIN order_items oi ON oi.pack_id = p.id
      WHERE p.status = 'PUBLISHED'
      GROUP BY p.id
      ORDER BY revenue_cents DESC
      LIMIT 10
    `),
  ]);

  const searchTerms: any[] = [];

  res.json({
    period,
    totalRevenueCents: Number((totalRevResult.rows as any)[0]?.total || 0),
    totalOrders: Number((totalOrdersResult.rows as any)[0]?.count || 0),
    totalDownloads: Number((totalDownloadsResult.rows as any)[0]?.total || 0),
    newUsers: Number((newUsersResult.rows as any)[0]?.count || 0),
    revenueByDay: (revenueByDay.rows || []).map((r: any) => ({
      date: r.date,
      revenueCents: Number(r.revenue_cents || 0),
      orders: Number(r.orders || 0),
    })),
    topPacks: (topPacksResult.rows || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      thumbnailUrl: p.thumbnail_url,
      totalDownloads: Number(p.total_downloads || 0),
      avgRating: p.avg_rating ? Number(p.avg_rating) : null,
      reviewCount: Number(p.review_count || 0),
      revenueCents: Number(p.revenue_cents || 0),
    })),
    searchTerms,
  });
});

// Admin packs CRUD
router.get("/packs", async (req, res): Promise<void> => {
  const page = parseInt(String(req.query.page || "1"));
  const limit = Math.min(parseInt(String(req.query.limit || "20")), 100);
  const offset = (page - 1) * limit;
  const conditions: any[] = [];

  if (req.query.status) conditions.push(eq(packsTable.status, req.query.status as any));
  if (req.query.search) {
    const q = `%${sanitizeLikePattern(String(req.query.search))}%`;
    conditions.push(or(ilike(packsTable.title, q), ilike(packsTable.shortDescription, q))!);
  }
  if (req.query.category) {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, String(req.query.category))).limit(1);
    if (cat) conditions.push(eq(packsTable.categoryId, cat.id));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [packs, [{ count }]] = await Promise.all([
    db.select().from(packsTable).where(whereClause).orderBy(desc(packsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(packsTable).where(whereClause),
  ]);

  const total = Number(count);
  const catIds = [...new Set(packs.map(p => p.categoryId))];
  const categories = catIds.length > 0
    ? await db.select().from(categoriesTable).where(inArray(categoriesTable.id, catIds))
    : [];
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  res.json({ packs: packs.map(p => formatPack(p, catMap[p.categoryId])), total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.post("/packs", async (req: AuthRequest, res): Promise<void> => {
  const parsed = AdminCreatePackBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const slug = parsed.data.slug || parsed.data.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const [pack] = await db.insert(packsTable).values({ ...parsed.data, slug, status: "DRAFT" }).returning();

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, pack.categoryId)).limit(1);
  logger.info({ packId: pack.id, title: pack.title, adminId: req.user!.userId }, "Admin created pack");
  res.status(201).json(formatPack(pack, cat));
});

router.get("/packs/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid pack ID" }); return; }
  const [pack] = await db.select().from(packsTable).where(eq(packsTable.id, id)).limit(1);
  if (!pack) { res.status(404).json({ error: "Pack not found" }); return; }

  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, pack.categoryId)).limit(1);
  const [prompts, files, logs] = await Promise.all([
    db.select().from(promptsTable).where(eq(promptsTable.packId, id)).orderBy(asc(promptsTable.sortOrder)),
    db.select().from(generatedFilesTable).where(eq(generatedFilesTable.packId, id)),
    db.select().from(moderationLogsTable).where(and(eq(moderationLogsTable.entityType, "pack"), eq(moderationLogsTable.entityId, id))).orderBy(desc(moderationLogsTable.createdAt)),
  ]);

  res.json({
    ...formatPack(pack, category),
    prompts: prompts.map(p => ({ id: p.id, packId: p.packId, title: p.title, body: p.body, description: p.description, aiTool: p.aiTool, useCase: p.useCase, exampleOutput: p.exampleOutput, status: p.status, sortOrder: p.sortOrder, createdAt: p.createdAt.toISOString() })),
    files: files.map(f => ({ id: f.id, packId: f.packId, fileType: f.fileType, status: f.status, publicUrl: f.publicUrl, fileSizeBytes: f.fileSizeBytes, generationCompletedAt: f.generationCompletedAt ? f.generationCompletedAt.toISOString() : null, errorMessage: f.errorMessage, createdAt: f.createdAt.toISOString() })),
    moderationLogs: logs.map(l => ({ id: l.id, entityType: l.entityType, entityId: l.entityId, action: l.action, adminId: l.adminId, notes: l.notes, beforeStatus: l.beforeStatus, afterStatus: l.afterStatus, createdAt: l.createdAt.toISOString() })),
  });
});

router.patch("/packs/:id", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid pack ID" }); return; }
  const parsed = AdminUpdatePackBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const [pack] = await db.update(packsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(packsTable.id, id)).returning();
  if (!pack) { res.status(404).json({ error: "Pack not found" }); return; }

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, pack.categoryId)).limit(1);
  logger.info({ packId: id, adminId: req.user!.userId }, "Admin updated pack");
  res.json(formatPack(pack, cat));
});

router.delete("/packs/:id", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid pack ID" }); return; }
  await db.update(packsTable).set({ status: "ARCHIVED", deletedAt: new Date() }).where(eq(packsTable.id, id));
  logger.info({ packId: id, adminId: req.user!.userId }, "Admin archived pack");
  res.json({ message: "Pack archived" });
});

router.patch("/packs/:id/status", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid pack ID" }); return; }
  const parsed = UpdateStatusBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const [existing] = await db.select().from(packsTable).where(eq(packsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Pack not found" }); return; }

  const updates: any = { status: parsed.data.status as any, updatedAt: new Date() };
  if (parsed.data.status === "PUBLISHED") {
    updates.publishedAt = new Date();
    logger.info({ packId: id, title: existing.title, adminId: req.user!.userId }, "Pack published");
  }

  const [pack] = await db.update(packsTable).set(updates).where(eq(packsTable.id, id)).returning();

  await db.insert(moderationLogsTable).values({
    entityType: "pack", entityId: id, action: parsed.data.status === "PUBLISHED" ? "APPROVE" : "REJECT",
    adminId: req.user!.userId, notes: parsed.data.notes, beforeStatus: existing.status, afterStatus: parsed.data.status,
  });

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, pack.categoryId)).limit(1);
  res.json(formatPack(pack, cat));
});

// Prompts
router.patch("/prompts/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid prompt ID" }); return; }
  const parsed = UpdatePromptBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const [prompt] = await db.update(promptsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(promptsTable.id, id)).returning();
  if (!prompt) { res.status(404).json({ error: "Prompt not found" }); return; }

  res.json({ id: prompt.id, packId: prompt.packId, title: prompt.title, body: prompt.body, description: prompt.description, aiTool: prompt.aiTool, useCase: prompt.useCase, exampleOutput: prompt.exampleOutput, status: prompt.status, sortOrder: prompt.sortOrder, createdAt: prompt.createdAt.toISOString() });
});

// Moderation queue
router.get("/moderation", async (req, res): Promise<void> => {
  const page = parseInt(String(req.query.page || "1"));
  const limit = Math.min(parseInt(String(req.query.limit || "20")), 100);
  const offset = (page - 1) * limit;

  const [packs, [{ count }]] = await Promise.all([
    db.select().from(packsTable).where(eq(packsTable.status, "PENDING_REVIEW")).orderBy(desc(packsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(packsTable).where(eq(packsTable.status, "PENDING_REVIEW")),
  ]);

  const total = Number(count);
  const catIds = [...new Set(packs.map(p => p.categoryId))];
  const categories = catIds.length > 0
    ? await db.select().from(categoriesTable).where(inArray(categoriesTable.id, catIds))
    : [];
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  res.json({ packs: packs.map(p => formatPack(p, catMap[p.categoryId])), total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.post("/moderation/:id/approve", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid pack ID" }); return; }
  const parsed = ModerationActionBody.safeParse(req.body);

  const [existing] = await db.select().from(packsTable).where(eq(packsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Pack not found" }); return; }
  if (existing.status === "PUBLISHED") {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, existing.categoryId)).limit(1);
    res.json(formatPack(existing, cat));
    return;
  }

  const [pack] = await db.update(packsTable).set({ status: "PUBLISHED", publishedAt: new Date(), moderatedAt: new Date(), moderatedBy: req.user!.userId, updatedAt: new Date() }).where(eq(packsTable.id, id)).returning();

  await db.insert(moderationLogsTable).values({ entityType: "pack", entityId: id, action: "APPROVE", adminId: req.user!.userId, notes: parsed.success ? parsed.data.notes : undefined, beforeStatus: existing.status, afterStatus: "PUBLISHED" });

  await db.execute(sql`UPDATE categories SET pack_count = pack_count + 1 WHERE id = ${pack.categoryId}`);

  logger.info({ packId: id, title: existing.title, adminId: req.user!.userId }, "Pack approved and published");

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, pack.categoryId)).limit(1);
  res.json(formatPack(pack, cat));
});

router.post("/moderation/:id/reject", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid pack ID" }); return; }
  const parsed = ModerationActionBody.safeParse(req.body);

  const [existing] = await db.select().from(packsTable).where(eq(packsTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Pack not found" }); return; }
  if (existing.status === "REJECTED") {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, existing.categoryId)).limit(1);
    res.json(formatPack(existing, cat));
    return;
  }

  const [pack] = await db.update(packsTable).set({ status: "REJECTED", moderatedAt: new Date(), moderatedBy: req.user!.userId, updatedAt: new Date() }).where(eq(packsTable.id, id)).returning();

  await db.insert(moderationLogsTable).values({ entityType: "pack", entityId: id, action: "REJECT", adminId: req.user!.userId, notes: parsed.success ? parsed.data.notes : undefined, beforeStatus: existing.status, afterStatus: "REJECTED" });

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, pack.categoryId)).limit(1);
  res.json(formatPack(pack, cat));
});

// Automation jobs
function formatJob(job: any) {
  return {
    id: job.id, jobType: job.jobType, status: job.status, priority: job.priority,
    payload: job.payload || {}, result: job.result, errorMessage: job.errorMessage,
    retryCount: job.retryCount, maxRetries: job.maxRetries, relatedPackId: job.relatedPackId,
    triggeredBy: job.triggeredBy, startedAt: job.startedAt ? job.startedAt.toISOString() : null,
    completedAt: job.completedAt ? job.completedAt.toISOString() : null, durationMs: job.durationMs,
    aiTokensUsed: job.aiTokensUsed, aiCostUsdCents: job.aiCostUsdCents, createdAt: job.createdAt.toISOString(),
  };
}

router.get("/automation", async (req, res): Promise<void> => {
  const page = parseInt(String(req.query.page || "1"));
  const limit = Math.min(parseInt(String(req.query.limit || "20")), 100);
  const offset = (page - 1) * limit;
  const conditions: any[] = [];

  if (req.query.status) conditions.push(eq(automationJobsTable.status, req.query.status as any));
  if (req.query.jobType) conditions.push(eq(automationJobsTable.jobType, req.query.jobType as any));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [jobs, [{ count }]] = await Promise.all([
    db.select().from(automationJobsTable).where(whereClause).orderBy(desc(automationJobsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(automationJobsTable).where(whereClause),
  ]);

  const total = Number(count);
  res.json({ jobs: jobs.map(formatJob), total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.post("/automation", async (req: AuthRequest, res): Promise<void> => {
  const parsed = TriggerJobBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const [job] = await db.insert(automationJobsTable).values({
    jobType: parsed.data.jobType,
    status: "PENDING",
    priority: 0,
    payload: parsed.data.payload || {},
    relatedPackId: parsed.data.packId,
    triggeredBy: `admin:${req.user!.userId}`,
    maxRetries: 3,
    retryCount: 0,
  }).returning();

  logger.info({ jobId: job.id, jobType: job.jobType, adminId: req.user!.userId }, "Automation job triggered");

  setTimeout(async () => {
    await processJob(job.id, parsed.data.jobType, parsed.data.packId, parsed.data.payload || {});
  }, 100);

  res.status(201).json(formatJob(job));
});

interface PromptTemplate {
  title: string;
  body: string;
  description: string;
  aiTool: string;
  useCase: string;
}

const PROMPT_LIBRARY: Record<string, PromptTemplate[]> = {
  "Marketing": [
    { title: "Viral Social Media Campaign Generator", body: `You are a senior social media strategist with 15+ years of experience creating viral campaigns for Fortune 500 brands. Your task is to create a complete, ready-to-launch social media campaign.\n\nBrand/Product: [BRAND NAME]\nTarget Audience: [DESCRIBE YOUR IDEAL CUSTOMER — age, interests, pain points]\nCampaign Goal: [AWARENESS / LEADS / SALES / ENGAGEMENT]\nTone: [PROFESSIONAL / PLAYFUL / URGENT / INSPIRATIONAL]\nPlatforms: [INSTAGRAM / TWITTER / LINKEDIN / TIKTOK / ALL]\n\nPlease create:\n1. Campaign concept with a memorable hook/tagline\n2. 5 unique content post ideas with captions (Instagram + LinkedIn + Twitter versions)\n3. Hashtag strategy (5 niche + 5 trending + 3 branded)\n4. Ideal posting schedule for 2 weeks\n5. One viral "pattern interrupt" idea that will stop the scroll\n6. CTA (call-to-action) strategy for each platform`, description: "Generate a complete multi-platform viral social media campaign", aiTool: "ChatGPT", useCase: "Social Media Marketing" },
    { title: "High-Converting Email Sequence Builder", body: `Act as an expert email marketing copywriter. Create a 7-email nurture sequence for:\n\nProduct/Service: [WHAT YOU'RE SELLING]\nTarget Customer: [WHO THEY ARE + THEIR BIGGEST PROBLEM]\nSequence Goal: [PURCHASE / BOOKING / SIGN-UP / UPSELL]\nBrand Voice: [FORMAL / CASUAL / BOLD / WARM]`, description: "Create a complete 7-email nurture sequence engineered for maximum conversions", aiTool: "Claude", useCase: "Email Marketing" },
  ],
  "Coding": [
    { title: "Code Review and Refactoring Expert", body: `You are a senior software engineer with 20+ years of experience. Review and improve:\n\nCode:\n\`\`\`\n[PASTE YOUR CODE HERE]\n\`\`\`\n\nLanguage/Framework: [LANGUAGE AND VERSION]\nContext: [WHAT THIS CODE IS SUPPOSED TO DO]`, description: "Comprehensive code review with refactoring suggestions", aiTool: "Claude", useCase: "Code Quality" },
  ],
  "Business": [
    { title: "Business Plan Generator", body: `Create a comprehensive business plan for:\n\nBusiness Idea: [YOUR IDEA]\nTarget Market: [WHO YOU'RE SERVING]\nInitial Investment: [BUDGET]\nTimeline: [LAUNCH DATE]`, description: "Generate a complete business plan with financials and strategy", aiTool: "ChatGPT", useCase: "Business Strategy" },
  ],
};

const FREE_AI_MODEL = "cognitivecomputations/dolphin-mistral-24b-venice-edition:free";

async function generatePromptsWithOpenRouter(packTitle: string, categoryName: string): Promise<PromptTemplate[]> {
  const { openrouter } = await import("@workspace/integrations-openrouter-ai");
  const response = await openrouter.chat.completions.create({
    model: FREE_AI_MODEL,
    max_tokens: 8192,
    messages: [{
      role: "user",
      content: `Generate 5 professional AI prompts for a "${packTitle}" prompt pack in the "${categoryName}" category. Each prompt should be practical, detailed, and immediately usable by professionals. Return ONLY a JSON array (no markdown, no explanation) with exactly these fields: title (string), body (string, the actual prompt text with placeholder brackets like [YOUR INPUT]), description (string), aiTool (one of: ChatGPT, Claude, Gemini), useCase (string).`,
    }],
  });
  const text = response.choices[0]?.message?.content || "";
  const match = text.match(/\[[\s\S]*\]/);
  if (match) return JSON.parse(match[0]) as PromptTemplate[];
  throw new Error("Could not parse prompts from free AI response");
}

async function processJob(jobId: number, jobType: string, packId?: number, payload?: Record<string, unknown>): Promise<void> {
  const startedAt = new Date();
  try {
    await db.update(automationJobsTable).set({ status: "RUNNING", startedAt }).where(eq(automationJobsTable.id, jobId));

    if (jobType === "GENERATE_PROMPTS" && packId) {
      const [pack] = await db.select().from(packsTable).where(eq(packsTable.id, packId)).limit(1);
      if (!pack) throw new Error("Pack not found");

      const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, pack.categoryId)).limit(1);
      const categoryName = category?.name || "General";

      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
      const USE_FREE_AI = payload?.freeAiMode === true || payload?.aiMode === "free";
      const OPENROUTER_READY = !!process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL && !!process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY;
      let prompts: PromptTemplate[] = [];

      if (USE_FREE_AI && OPENROUTER_READY) {
        try {
          logger.info({ jobId, packId, model: FREE_AI_MODEL }, "Generating prompts with Free AI mode (OpenRouter)");
          prompts = await generatePromptsWithOpenRouter(pack.title, categoryName);
        } catch (freeAiErr) {
          logger.error({ err: freeAiErr, jobId }, "Free AI mode error, falling back to template library");
          prompts = PROMPT_LIBRARY[categoryName] || PROMPT_LIBRARY["Marketing"];
        }
      } else if (ANTHROPIC_API_KEY && !USE_FREE_AI) {
        try {
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-3-haiku-20240307",
              max_tokens: 4000,
              messages: [{
                role: "user",
                content: `Generate 5 professional AI prompts for a "${pack.title}" prompt pack in the "${categoryName}" category. Each prompt should be practical and immediately usable. Return as JSON array with fields: title, body, description, aiTool (ChatGPT/Claude/Gemini), useCase.`,
              }],
            }),
          });
          const data = await response.json() as any;
          const text = data.content?.[0]?.text || "";
          const match = text.match(/\[[\s\S]*\]/);
          if (match) prompts = JSON.parse(match[0]);
        } catch (apiErr) {
          logger.error({ err: apiErr, jobId }, "AI API error in job, using fallback prompts");
          prompts = PROMPT_LIBRARY[categoryName] || PROMPT_LIBRARY["Marketing"];
        }
      } else if (!ANTHROPIC_API_KEY && OPENROUTER_READY) {
        try {
          logger.info({ jobId, packId }, "No Anthropic key set, auto-using Free AI mode (OpenRouter)");
          prompts = await generatePromptsWithOpenRouter(pack.title, categoryName);
        } catch (freeAiErr) {
          logger.error({ err: freeAiErr, jobId }, "Free AI auto-mode error, using template library");
          prompts = PROMPT_LIBRARY[categoryName] || PROMPT_LIBRARY["Marketing"];
        }
      } else {
        if (process.env.NODE_ENV === "production") {
          logger.error({ jobId }, "No AI service configured in production — aborting job to prevent mock data");
          throw new Error("AI generation service unavailable: no ANTHROPIC_API_KEY or OpenRouter integration configured. Job aborted in production to prevent mock data from being published.");
        }
        logger.warn({ jobId }, "No AI service configured — using template library (dev/staging only)");
        prompts = PROMPT_LIBRARY[categoryName] || PROMPT_LIBRARY["Marketing"];
      }

      let sortOrder = 1;
      for (const prompt of prompts) {
        await db.insert(promptsTable).values({
          packId,
          title: prompt.title || "Untitled",
          body: prompt.body || "",
          description: prompt.description || "",
          aiTool: prompt.aiTool || "ChatGPT",
          useCase: prompt.useCase || "General",
          status: "GENERATED",
          sortOrder: sortOrder++,
        });
      }

      await db.update(packsTable).set({ promptCount: prompts.length, updatedAt: new Date() }).where(eq(packsTable.id, packId));
    }

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    await db.update(automationJobsTable).set({ status: "COMPLETED", completedAt, durationMs }).where(eq(automationJobsTable.id, jobId));

    logger.info({ jobId, jobType, durationMs }, "Job completed");
  } catch (err) {
    logger.error({ err, jobId, jobType }, "Job failed");
    await db.update(automationJobsTable).set({
      status: "FAILED",
      errorMessage: err instanceof Error ? err.message : String(err),
      completedAt: new Date(),
    }).where(eq(automationJobsTable.id, jobId));
  }
}

// Users management
router.get("/users", async (req, res): Promise<void> => {
  const page = parseInt(String(req.query.page || "1"));
  const limit = Math.min(parseInt(String(req.query.limit || "20")), 100);
  const offset = (page - 1) * limit;
  const conditions: any[] = [];

  if (req.query.search) {
    const q = `%${sanitizeLikePattern(String(req.query.search))}%`;
    conditions.push(or(ilike(usersTable.email, q), ilike(usersTable.displayName, q))!);
  }
  if (req.query.role) conditions.push(eq(usersTable.role, req.query.role as any));
  if (req.query.status) conditions.push(eq(usersTable.status, req.query.status as any));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [users, [{ count }]] = await Promise.all([
    db.select().from(usersTable).where(whereClause).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(usersTable).where(whereClause),
  ]);

  const total = Number(count);

  res.json({
    users: users.map(u => ({
      id: u.id, email: u.email, displayName: u.displayName, avatarUrl: u.avatarUrl,
      role: u.role, status: u.status, emailVerifiedAt: u.emailVerifiedAt,
      lastLoginAt: u.lastLoginAt, createdAt: u.createdAt,
      // NEVER include: passwordHash, refreshToken, resetPasswordToken
    })),
    total, page, limit, totalPages: Math.ceil(total / limit),
  });
});

router.patch("/users/:id", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid user ID" }); return; }
  if (id === req.user!.userId) { res.status(400).json({ error: "You cannot modify your own account via the admin panel" }); return; }
  const parsed = AdminUpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const [user] = await db.update(usersTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  logger.info({ targetUserId: id, adminId: req.user!.userId }, "Admin updated user");

  res.json({
    id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl,
    role: user.role, status: user.status, emailVerifiedAt: user.emailVerifiedAt, createdAt: user.createdAt,
  });
});

router.delete("/users/:id", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid user ID" }); return; }
  if (id === req.user!.userId) { res.status(400).json({ error: "You cannot delete your own account via the admin panel" }); return; }

  const [user] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning({ id: usersTable.id });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  logger.info({ targetUserId: id, adminId: req.user!.userId }, "Admin deleted user");
  res.status(204).end();
});

// Categories management
router.get("/categories", async (_req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.name));
  res.json(cats);
});

router.post("/categories", async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const [cat] = await db.insert(categoriesTable).values(parsed.data).returning();
  logger.info({ categoryId: cat.id, name: cat.name, adminId: req.user!.userId }, "Admin created category");
  res.status(201).json(cat);
});

const UpdateCategoryBody = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  slug: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
});

router.patch("/categories/:id", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid category ID" }); return; }
  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const [cat] = await db.update(categoriesTable).set({ ...parsed.data }).where(eq(categoriesTable.id, id)).returning();
  if (!cat) { res.status(404).json({ error: "Category not found" }); return; }

  logger.info({ categoryId: id, adminId: req.user!.userId }, "Admin updated category");
  res.json(cat);
});

router.delete("/categories/:id", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid category ID" }); return; }

  const [cat] = await db.delete(categoriesTable).where(eq(categoriesTable.id, id)).returning({ id: categoriesTable.id });
  if (!cat) { res.status(404).json({ error: "Category not found" }); return; }

  logger.info({ categoryId: id, adminId: req.user!.userId }, "Admin deleted category");
  res.status(204).end();
});

// Coupons management
router.get("/coupons", async (_req, res): Promise<void> => {
  const coupons = await db.select().from(couponsTable).orderBy(desc(couponsTable.createdAt));
  res.json(coupons);
});

router.post("/coupons", async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  if (parsed.data.discountValue <= 0) {
    res.status(400).json({ error: "Discount value must be positive" });
    return;
  }
  if (parsed.data.discountType === "PERCENT" && parsed.data.discountValue > 100) {
    res.status(400).json({ error: "Percentage discount cannot exceed 100%" });
    return;
  }
  const couponData = { ...parsed.data, code: parsed.data.code.toUpperCase() };
  const [coupon] = await db.insert(couponsTable).values(couponData).returning();
  logger.info({ couponId: coupon.id, code: coupon.code, adminId: req.user!.userId }, "Admin created coupon");
  res.status(201).json(coupon);
});

const UpdateCouponBody = z.object({
  code: z.string().min(1).max(64).toUpperCase().optional(),
  discountType: z.enum(["PERCENT", "FIXED"]).optional(),
  discountValue: z.number().positive().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
}).refine(data => {
  if (data.discountType === "PERCENT" && data.discountValue !== undefined && data.discountValue > 100) return false;
  return true;
}, { message: "Percentage discount cannot exceed 100%" });

router.patch("/coupons/:id", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid coupon ID" }); return; }
  const parsed = UpdateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() }); return; }
  if (Object.keys(parsed.data).length === 0) { res.status(400).json({ error: "No fields to update" }); return; }
  const [coupon] = await db.update(couponsTable).set(parsed.data).where(eq(couponsTable.id, id)).returning();
  if (!coupon) { res.status(404).json({ error: "Coupon not found" }); return; }
  res.json(coupon);
});

// Settings
router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await db.select().from(systemSettingsTable);
  res.json(Object.fromEntries(settings.map(s => [s.key, s.value])));
});

router.patch("/settings/:key", async (req, res): Promise<void> => {
  const key = req.params.key as string;
  const { value } = req.body;

  await db.insert(systemSettingsTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: systemSettingsTable.key, set: { value, updatedAt: new Date() } });

  res.json({ key, value });
});

// ====================================================================
// FLASH SALES MANAGEMENT
// ====================================================================

// GET /api/admin/sales — list all sale events
router.get("/sales", async (_req, res): Promise<void> => {
  const sales = await db.select({
    id: saleEventsTable.id,
    packId: saleEventsTable.packId,
    packTitle: packsTable.title,
    packSlug: packsTable.slug,
    salePriceCents: saleEventsTable.salePriceCents,
    originalPriceCents: packsTable.priceCents,
    startsAt: saleEventsTable.startsAt,
    endsAt: saleEventsTable.endsAt,
    isActive: saleEventsTable.isActive,
    createdAt: saleEventsTable.createdAt,
  })
    .from(saleEventsTable)
    .leftJoin(packsTable, eq(saleEventsTable.packId, packsTable.id))
    .orderBy(desc(saleEventsTable.createdAt))
    .limit(100);

  res.json({ sales });
});

// POST /api/admin/sales — create a flash sale event
router.post("/sales", async (req: AuthRequest, res): Promise<void> => {
  const { packId, salePriceCents, startsAt, endsAt } = req.body;
  if (!packId || !salePriceCents || !startsAt || !endsAt) {
    res.status(400).json({ error: "packId, salePriceCents, startsAt, endsAt are required" });
    return;
  }

  const [pack] = await db.select().from(packsTable).where(eq(packsTable.id, packId)).limit(1);
  if (!pack) { res.status(404).json({ error: "Pack not found" }); return; }

  const startDate = new Date(startsAt);
  const endDate = new Date(endsAt);
  if (endDate <= startDate) { res.status(400).json({ error: "endsAt must be after startsAt" }); return; }
  if (salePriceCents >= pack.priceCents) { res.status(400).json({ error: "Sale price must be less than original price" }); return; }

  const [sale] = await db.insert(saleEventsTable).values({
    packId,
    salePriceCents,
    startsAt: startDate,
    endsAt: endDate,
    isActive: true,
    createdBy: req.user!.userId,
  }).returning();

  // Update pack with sale price and event reference
  await db.update(packsTable).set({
    saleEventId: sale.id,
    salePriceCents,
    updatedAt: new Date(),
  }).where(eq(packsTable.id, packId));

  logger.info({ saleId: sale.id, packId, adminId: req.user!.userId }, "Admin created flash sale");
  res.status(201).json(sale);
});

// PATCH /api/admin/sales/:id — update/deactivate a sale
router.patch("/sales/:id", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid sale ID" }); return; }

  const { isActive, endsAt, salePriceCents } = req.body;
  const updates: Record<string, any> = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (endsAt) updates.endsAt = new Date(endsAt);
  if (salePriceCents) updates.salePriceCents = salePriceCents;

  const [sale] = await db.update(saleEventsTable).set(updates).where(eq(saleEventsTable.id, id)).returning();
  if (!sale) { res.status(404).json({ error: "Sale not found" }); return; }

  // If deactivating, clear pack's sale price
  if (isActive === false) {
    await db.update(packsTable).set({ saleEventId: null, salePriceCents: null, updatedAt: new Date() })
      .where(eq(packsTable.saleEventId, id));
  }

  res.json(sale);
});

// DELETE /api/admin/sales/:id — remove a sale
router.delete("/sales/:id", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid sale ID" }); return; }

  await db.update(packsTable).set({ saleEventId: null, salePriceCents: null, updatedAt: new Date() })
    .where(eq(packsTable.saleEventId, id));
  await db.delete(saleEventsTable).where(eq(saleEventsTable.id, id));

  logger.info({ saleId: id, adminId: req.user!.userId }, "Admin deleted flash sale");
  res.json({ success: true });
});

// ====================================================================
// FEATURE FLAGS
// ====================================================================

router.get("/feature-flags", async (_req, res): Promise<void> => {
  const flags = await db.select().from(featureFlagsTable);
  res.json({ flags });
});

router.put("/feature-flags/:key", async (req: AuthRequest, res): Promise<void> => {
  const key = req.params.key as string;
  const { enabled, description } = req.body;

  const [flag] = await db.insert(featureFlagsTable)
    .values({ key, enabled: !!enabled, description, changedBy: req.user!.userId })
    .onConflictDoUpdate({
      target: [featureFlagsTable.key],
      set: { enabled: !!enabled, description, changedBy: req.user!.userId },
    } as any)
    .returning();

  logger.info({ key, enabled, adminId: req.user!.userId }, "Feature flag updated");
  res.json(flag);
});

// ====================================================================
// CONTENT REPORTS
// ====================================================================

router.get("/reports", async (req, res): Promise<void> => {
  const { status = "pending" } = req.query as Record<string, string>;
  const conditions = status !== "all" ? [eq(contentReportsTable.status, status as any)] : [];

  const reports = await db.select().from(contentReportsTable)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(desc(contentReportsTable.createdAt))
    .limit(50);

  res.json({ reports });
});

router.patch("/reports/:id", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const { status } = req.body;

  const [report] = await db.update(contentReportsTable).set({
    status,
    reviewedBy: req.user!.userId,
    reviewedAt: new Date(),
  }).where(eq(contentReportsTable.id, id)).returning();

  if (!report) { res.status(404).json({ error: "Report not found" }); return; }
  res.json(report);
});

// ====================================================================
// PACK APPEALS
// ====================================================================

router.get("/appeals", async (_req, res): Promise<void> => {
  const appeals = await db.select({
    id: packAppealsTable.id,
    packId: packAppealsTable.packId,
    packTitle: packsTable.title,
    creatorId: packAppealsTable.creatorId,
    creatorName: usersTable.displayName,
    reason: packAppealsTable.reason,
    status: packAppealsTable.status,
    reviewedAt: packAppealsTable.reviewedAt,
    createdAt: packAppealsTable.createdAt,
  })
    .from(packAppealsTable)
    .leftJoin(packsTable, eq(packAppealsTable.packId, packsTable.id))
    .leftJoin(usersTable, eq(packAppealsTable.creatorId, usersTable.id))
    .orderBy(desc(packAppealsTable.createdAt))
    .limit(50);

  res.json({ appeals });
});

router.patch("/appeals/:id", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const { status } = req.body;

  const [appeal] = await db.update(packAppealsTable).set({
    status,
    reviewedBy: req.user!.userId,
    reviewedAt: new Date(),
  }).where(eq(packAppealsTable.id, id)).returning();

  if (!appeal) { res.status(404).json({ error: "Appeal not found" }); return; }

  // If approved, unpublish reject → pending review
  if (status === "approved") {
    await db.update(packsTable).set({ status: "PENDING_REVIEW" }).where(eq(packsTable.id, appeal.packId));
  }

  res.json(appeal);
});

// ====================================================================
// AUDIT LOGS
// ====================================================================

router.get("/audit-log", async (_req, res): Promise<void> => {
  const logs = await db.select({
    id: auditLogsTable.id,
    adminId: auditLogsTable.adminId,
    adminName: usersTable.displayName,
    action: auditLogsTable.action,
    entityType: auditLogsTable.entityType,
    entityId: auditLogsTable.entityId,
    createdAt: auditLogsTable.createdAt,
  })
    .from(auditLogsTable)
    .leftJoin(usersTable, eq(auditLogsTable.adminId, usersTable.id))
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(100);

  res.json({ logs });
});

// ====================================================================
// EXPERIMENTS / A-B TESTS
// ====================================================================

router.get("/experiments", async (_req, res): Promise<void> => {
  const experiments = await db.select().from(experimentsTable).orderBy(desc(experimentsTable.createdAt)).limit(50);
  res.json({ experiments });
});

router.post("/experiments", async (req: AuthRequest, res): Promise<void> => {
  const { name, hypothesis, variants, trafficSplit = 0.5, metric = "conversion_rate" } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }

  const [experiment] = await db.insert(experimentsTable).values({
    name,
    hypothesis,
    variants: variants || [{ id: "control", name: "Control" }, { id: "variant", name: "Variant A" }],
    trafficSplit,
    metric,
    status: "draft",
  }).returning();

  res.status(201).json(experiment);
});

router.patch("/experiments/:id", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const allowed = ["name", "hypothesis", "status", "variants", "trafficSplit", "metric", "startAt", "endAt", "winnerId"];
  const updates: Record<string, any> = {};
  for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];

  const [experiment] = await db.update(experimentsTable).set(updates).where(eq(experimentsTable.id, id)).returning();
  if (!experiment) { res.status(404).json({ error: "Experiment not found" }); return; }
  res.json(experiment);
});

// ====================================================================
// API KEYS
// ====================================================================

router.get("/api-keys", async (_req, res): Promise<void> => {
  const keys = await db.select({
    id: apiKeysTable.id,
    userId: apiKeysTable.userId,
    userName: usersTable.displayName,
    name: apiKeysTable.name,
    keyPrefix: apiKeysTable.keyPrefix,
    requestCount: apiKeysTable.requestCount,
    lastUsedAt: apiKeysTable.lastUsedAt,
    revokedAt: apiKeysTable.revokedAt,
    createdAt: apiKeysTable.createdAt,
  })
    .from(apiKeysTable)
    .leftJoin(usersTable, eq(apiKeysTable.userId, usersTable.id))
    .orderBy(desc(apiKeysTable.createdAt))
    .limit(100);

  res.json({ keys });
});

router.patch("/api-keys/:id/revoke", async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const [key] = await db.update(apiKeysTable).set({ revokedAt: new Date() }).where(eq(apiKeysTable.id, id)).returning();
  if (!key) { res.status(404).json({ error: "Key not found" }); return; }
  logger.info({ keyId: id, adminId: req.user!.userId }, "API key revoked");
  res.json(key);
});

export default router;
