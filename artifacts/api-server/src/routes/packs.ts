import { Router, type IRouter } from "express";
import { eq, desc, asc, sql, and, gte, lte, ilike, or, inArray } from "drizzle-orm";
import { db, packsTable, categoriesTable, ordersTable, orderItemsTable, promptsTable } from "@workspace/db";
import { optionalAuth, requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { generatePackPDF } from "../lib/pdf-generator.js";
import { logger } from "../utils/logger.js";
import { z } from "zod";
import { cacheAside, TTL } from "../lib/cache.js";

const router: IRouter = Router();

const packsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.string().trim().max(100).optional(),
  search: z.string().trim().max(200).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  isFree: z.string().optional(),
  sort: z.enum(["newest", "popular", "price_asc", "price_desc", "rating"]).optional(),
});

function sanitizeSearchQuery(q: string): string {
  return q.replace(/[%_\\]/g, "\\$&");
}

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
    totalDownloads: pack.totalDownloads,
    avgRating: pack.avgRating,
    reviewCount: pack.reviewCount,
    publishedAt: pack.publishedAt ? pack.publishedAt.toISOString() : null,
    createdAt: pack.createdAt.toISOString(),
    seoTitle: pack.seoTitle,
    seoDescription: pack.seoDescription,
    // NEVER include: moderatedBy, aiGenerationId, totalRevenueCents, deletedAt
  };
}

// ⚡ Bolt: Optimized checkPurchased to use a single JOIN query.
// This reduces latency by avoiding two roundtrips to the DB, saves memory,
// and eliminates a silent bug where users with >50 orders wouldn't get access.
async function checkPurchased(userId: number, packId: number): Promise<boolean> {
  const items = await db.select({ id: orderItemsTable.id })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(and(
      eq(ordersTable.userId, userId),
      eq(ordersTable.status, "COMPLETED"),
      eq(orderItemsTable.packId, packId)
    ))
    .limit(1);
  return items.length > 0;
}

router.get("/packs", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = packsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { page, limit, category, search, minPrice, maxPrice, isFree, sort } = parsed.data;
  const offset = (page - 1) * limit;

  // Cache key encodes all filter params; skip cache when search is active (too many variants)
  const cacheKey = !search
    ? `packs:list:${page}:${limit}:${category || ""}:${minPrice ?? ""}:${maxPrice ?? ""}:${isFree || ""}:${sort || "newest"}`
    : null;

  const fetchPacks = async () => {
    const conditions = [eq(packsTable.status, "PUBLISHED")];

    if (category) {
      const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, category)).limit(1);
      if (cat) conditions.push(eq(packsTable.categoryId, cat.id));
    }

    if (search) {
      const sanitized = sanitizeSearchQuery(search);
      const q = `%${sanitized}%`;
      conditions.push(or(ilike(packsTable.title, q), ilike(packsTable.shortDescription, q))!);
    }

    if (minPrice !== undefined) conditions.push(gte(packsTable.priceCents, minPrice));
    if (maxPrice !== undefined) conditions.push(lte(packsTable.priceCents, maxPrice));
    if (isFree === "true") conditions.push(eq(packsTable.isFree, true));

    const sortMap: Record<string, any> = {
      newest: desc(packsTable.publishedAt),
      popular: desc(packsTable.totalDownloads),
      price_asc: asc(packsTable.priceCents),
      price_desc: desc(packsTable.priceCents),
      rating: desc(packsTable.avgRating),
    };
    const orderBy = sortMap[sort || "newest"] || desc(packsTable.publishedAt);

    const [packs, [{ count }]] = await Promise.all([
      db.select().from(packsTable).where(and(...conditions)).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(packsTable).where(and(...conditions)),
    ]);

    const total = Number(count);
    const cats = packs.length > 0
      ? await db.select().from(categoriesTable).where(inArray(categoriesTable.id, [...new Set(packs.map(p => p.categoryId))]))
      : [];
    const catMap = Object.fromEntries(cats.map(c => [c.id, c]));

    return {
      packs: packs.map(p => formatPack(p, catMap[p.categoryId])),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  };

  const result = cacheKey
    ? await cacheAside(cacheKey, TTL.PACK_LIST, fetchPacks)
    : await fetchPacks();

  res.json(result);
});

router.get("/packs/featured", async (_req, res): Promise<void> => {
  const result = await cacheAside("packs:featured", TTL.FEATURED_PACKS, async () => {
    const packs = await db.select().from(packsTable)
      .where(and(eq(packsTable.status, "PUBLISHED"), eq(packsTable.isFeatured, true)))
      .orderBy(desc(packsTable.totalDownloads))
      .limit(8);

    const categories = packs.length > 0
      ? await db.select().from(categoriesTable).where(inArray(categoriesTable.id, [...new Set(packs.map(p => p.categoryId))]))
      : [];
    const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

    return packs.map(p => formatPack(p, catMap[p.categoryId]));
  });
  res.json(result);
});

router.get("/packs/trending", async (req, res): Promise<void> => {
  const categorySlug = req.query.category ? String(req.query.category).trim().slice(0, 100) : null;

  const result = await cacheAside(`packs:trending:${categorySlug || "all"}`, TTL.TRENDING_PACKS, async () => {
    const conditions: any[] = [eq(packsTable.status, "PUBLISHED")];

    if (categorySlug) {
      const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, categorySlug)).limit(1);
      if (cat) conditions.push(eq(packsTable.categoryId, cat.id));
    }

    const packs = await db.select().from(packsTable)
      .where(and(...conditions))
      .orderBy(desc(packsTable.totalDownloads), desc(packsTable.avgRating))
      .limit(20);

    const categories = packs.length > 0
      ? await db.select().from(categoriesTable).where(inArray(categoriesTable.id, [...new Set(packs.map(p => p.categoryId))]))
      : [];
    const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

    return packs.map(p => formatPack(p, catMap[p.categoryId]));
  });

  res.json(result);
});

router.get("/packs/bestsellers", async (_req, res): Promise<void> => {
  const result = await cacheAside("packs:bestsellers", TTL.BESTSELLERS, async () => {
    const packs = await db.select().from(packsTable)
      .where(and(eq(packsTable.status, "PUBLISHED"), eq(packsTable.isBestseller, true)))
      .orderBy(desc(packsTable.totalDownloads))
      .limit(10);

    const categories = packs.length > 0
      ? await db.select().from(categoriesTable).where(inArray(categoriesTable.id, [...new Set(packs.map(p => p.categoryId))]))
      : [];
    const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

    return packs.map(p => formatPack(p, catMap[p.categoryId]));
  });
  res.json(result);
});

router.get("/packs/:slug", optionalAuth, async (req: AuthRequest, res): Promise<void> => {
  const slug = String(req.params.slug).trim().slice(0, 200);
  const [pack] = await db.select().from(packsTable).where(eq(packsTable.slug, slug)).limit(1);

  if (!pack || (pack.status as string) === "DELETED") {
    res.status(404).json({ error: "Pack not found" });
    return;
  }

  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, pack.categoryId)).limit(1);

  const allPrompts = await db.select().from(promptsTable)
    .where(eq(promptsTable.packId, pack.id))
    .orderBy(asc(promptsTable.sortOrder));

  let isPurchased = false;
  if (req.user) {
    isPurchased = await checkPurchased(req.user.userId, pack.id);
  }

  const FREE_PREVIEW_COUNT = 1;
  const formattedPrompts = allPrompts.map((p, idx) => ({
    id: p.id,
    title: p.title,
    body: isPurchased || idx < FREE_PREVIEW_COUNT ? p.body : "",
    description: p.description,
    aiTool: p.aiTool,
    useCase: p.useCase,
    isBlurred: !isPurchased && idx >= FREE_PREVIEW_COUNT,
    sortOrder: p.sortOrder,
  }));

  res.json({
    ...formatPack(pack, category),
    prompts: formattedPrompts,
    isPurchased,
  });
});

router.get("/packs/:slug/related", async (req, res): Promise<void> => {
  const slug = String(req.params.slug).trim().slice(0, 200);
  const [pack] = await db.select().from(packsTable).where(eq(packsTable.slug, slug)).limit(1);
  if (!pack) {
    res.json([]);
    return;
  }

  const related = await db.select().from(packsTable)
    .where(and(
      eq(packsTable.status, "PUBLISHED"),
      eq(packsTable.categoryId, pack.categoryId),
      sql`${packsTable.id} != ${pack.id}`
    ))
    .orderBy(desc(packsTable.totalDownloads))
    .limit(4);

  const categories = related.length > 0
    ? await db.select().from(categoriesTable).where(inArray(categoriesTable.id, [...new Set(related.map(p => p.categoryId))]))
    : [];
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  res.json(related.map(p => formatPack(p, catMap[p.categoryId])));
});

// Secure PDF download — requires purchase
router.get("/packs/:slug/download", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  try {
    const slug = String(req.params.slug).trim().slice(0, 200);
    const [pack] = await db.select().from(packsTable).where(eq(packsTable.slug, slug)).limit(1);
    if (!pack) { res.status(404).json({ error: "Pack not found" }); return; }

    // Triple check: auth (handled by requireAuth), ownership, purchase
    if (!pack.isFree && pack.priceCents > 0) {
      const purchased = await checkPurchased(req.user!.userId, pack.id);
      if (!purchased) {
        logger.warn({ userId: req.user!.userId, packId: pack.id, path: req.path }, "Authorization denied: no purchase");
        res.status(403).json({ error: "You have not purchased this pack. Please purchase it first." });
        return;
      }
    }

    const prompts = await db.select().from(promptsTable)
      .where(eq(promptsTable.packId, pack.id))
      .orderBy(asc(promptsTable.sortOrder));

    const pdfBuffer = await generatePackPDF(
      {
        title: pack.title,
        slug: pack.slug,
        shortDescription: pack.shortDescription,
        description: pack.description,
        aiToolTargets: pack.aiToolTargets as string[] | null,
        avgRating: pack.avgRating as string | null,
        priceCents: pack.priceCents,
        isFree: pack.isFree ?? false,
        tags: pack.tags as string[] | null,
      },
      prompts.map((p) => ({
        title: p.title,
        body: p.body,
        description: p.description,
        aiTool: p.aiTool,
        useCase: p.useCase,
        sortOrder: p.sortOrder,
      })),
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pack.slug}-promptvault.pdf"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.end(pdfBuffer);
  } catch (err) {
    logger.error({ err }, "PDF generation error");
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

export default router;
