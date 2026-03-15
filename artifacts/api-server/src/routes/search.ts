import { Router, type IRouter } from "express";
import { desc, ilike, or, and, eq, sql, inArray } from "drizzle-orm";
import { db, packsTable, categoriesTable } from "@workspace/db";
import { searchLimit } from "../lib/rate-limiters.js";
import { z } from "zod";
import { sanitizeLikePattern } from "../utils/db-utils.js";

const router: IRouter = Router();

const searchQuerySchema = z.object({
  q: z.string().trim().max(200).default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

router.get("/search", searchLimit, async (req, res): Promise<void> => {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { q, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  if (!q) {
    res.json({ packs: [], total: 0, page, limit, totalPages: 0 });
    return;
  }

  const searchPattern = `%${sanitizeLikePattern(q)}%`;
  const conditions = [
    eq(packsTable.status, "PUBLISHED"),
    or(
      ilike(packsTable.title, searchPattern),
      ilike(packsTable.shortDescription, searchPattern),
      ilike(packsTable.description, searchPattern),
    )!,
  ];

  const [packs, [{ count }]] = await Promise.all([
    db.select().from(packsTable)
      .where(and(...conditions))
      .orderBy(desc(packsTable.totalDownloads))
      .limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(packsTable).where(and(...conditions)),
  ]);

  const total = Number(count);
  const catIds = [...new Set(packs.map(p => p.categoryId))];
  const categories = catIds.length > 0
    ? await db.select().from(categoriesTable).where(inArray(categoriesTable.id, catIds))
    : [];
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  res.json({
    packs: packs.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      shortDescription: p.shortDescription,
      categoryId: p.categoryId,
      categoryName: catMap[p.categoryId]?.name || null,
      categorySlug: catMap[p.categoryId]?.slug || null,
      status: p.status,
      aiToolTargets: p.aiToolTargets || [],
      promptCount: p.promptCount,
      priceCents: p.priceCents,
      comparePriceCents: p.comparePriceCents,
      isFree: p.isFree,
      isFeatured: p.isFeatured,
      isBestseller: p.isBestseller,
      thumbnailUrl: p.thumbnailUrl,
      tags: p.tags || [],
      totalDownloads: p.totalDownloads,
      avgRating: p.avgRating,
      reviewCount: p.reviewCount,
      publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
      createdAt: p.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export default router;
