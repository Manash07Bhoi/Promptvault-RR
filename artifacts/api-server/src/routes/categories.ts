import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, categoriesTable, packsTable } from "@workspace/db";
import { z } from "zod";
import { cacheAside, TTL } from "../lib/cache.js";
import { serializeCategory, serializePackPublic } from "../lib/serialize.js";

const router: IRouter = Router();

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

router.get("/categories", async (_req, res): Promise<void> => {
  const result = await cacheAside("categories:all", TTL.CATEGORIES, async () => {
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.sortOrder);
    return categories.map(serializeCategory);
  });
  res.json(result);
});

router.get("/categories/:slug", async (req, res): Promise<void> => {
  const slug = req.params.slug.trim().slice(0, 100);
  const result = await cacheAside(`categories:${slug}`, TTL.CATEGORIES, async () => {
    const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, slug)).limit(1);
    return cat ? serializeCategory(cat) : null;
  });

  if (!result) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(result);
});

router.get("/categories/:slug/packs", async (req, res): Promise<void> => {
  const slug = req.params.slug.trim().slice(0, 100);
  const parsed = paginationSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, slug)).limit(1);
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const cacheKey = `category:${cat.id}:packs:${page}:${limit}`;
  const result = await cacheAside(cacheKey, TTL.PACK_LIST, async () => {
    const [packs, [{ count }]] = await Promise.all([
      db.select().from(packsTable)
        .where(and(eq(packsTable.categoryId, cat.id), eq(packsTable.status, "PUBLISHED")))
        .orderBy(desc(packsTable.totalDownloads))
        .limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(packsTable)
        .where(and(eq(packsTable.categoryId, cat.id), eq(packsTable.status, "PUBLISHED"))),
    ]);

    const total = Number(count);
    return {
      packs: packs.map(p => serializePackPublic(p, { categoryName: cat.name, categorySlug: cat.slug })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });

  res.json(result);
});

export default router;
