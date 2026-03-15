import { Router, type IRouter } from "express";
import { sql, eq, desc } from "drizzle-orm";
import { db, promptsTable, packsTable, categoriesTable, usersTable, reviewsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  const [promptsResult, packsResult, categoriesResult, usersResult, reviewsResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(promptsTable),
    db.select({ count: sql<number>`count(*)` }).from(packsTable).where(eq(packsTable.status, "PUBLISHED")),
    db.select({ count: sql<number>`count(*)` }).from(categoriesTable),
    db.select({ count: sql<number>`count(*)` }).from(usersTable),
    db.select({ count: sql<number>`count(*)` }).from(reviewsTable),
  ]);

  res.json({
    totalPrompts: Number(promptsResult[0]?.count ?? 0),
    totalPacks: Number(packsResult[0]?.count ?? 0),
    totalCategories: Number(categoriesResult[0]?.count ?? 0),
    totalUsers: Number(usersResult[0]?.count ?? 0),
    totalReviews: Number(reviewsResult[0]?.count ?? 0),
  });
});

// GET /sitemap.xml - Dynamic XML sitemap
router.get("/sitemap.xml", async (_req, res): Promise<void> => {
  const baseUrl = process.env.SITE_URL || "https://promptvault--ganeswar07rana.replit.app";

  const [packs, categories] = await Promise.all([
    db.select({ slug: packsTable.slug, updatedAt: packsTable.updatedAt })
      .from(packsTable)
      .where(eq(packsTable.status, "PUBLISHED"))
      .orderBy(desc(packsTable.updatedAt))
      .limit(1000),
    db.select({ slug: categoriesTable.slug, createdAt: categoriesTable.createdAt })
      .from(categoriesTable)
      .limit(100),
  ]);

  const staticUrls: Array<{ loc: string; priority: string; changefreq: string; lastmod?: string }> = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/explore", priority: "0.9", changefreq: "daily" },
    { loc: "/trending", priority: "0.8", changefreq: "daily" },
    { loc: "/pricing", priority: "0.7", changefreq: "weekly" },
    { loc: "/creators", priority: "0.7", changefreq: "weekly" },
    { loc: "/community", priority: "0.6", changefreq: "daily" },
    { loc: "/about", priority: "0.4", changefreq: "monthly" },
    { loc: "/contact", priority: "0.3", changefreq: "monthly" },
  ];

  const packUrls = packs.map(p => ({
    loc: `/packs/${p.slug}`,
    lastmod: p.updatedAt?.toISOString().split("T")[0],
    priority: "0.8",
    changefreq: "weekly",
  }));

  const categoryUrls = categories.map(c => ({
    loc: `/categories/${c.slug}`,
    lastmod: c.createdAt?.toISOString().split("T")[0],
    priority: "0.6",
    changefreq: "weekly",
  }));

  const allUrls = [...staticUrls, ...packUrls, ...categoryUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq || "monthly"}</changefreq>
    <priority>${u.priority || "0.5"}</priority>
  </url>`).join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(xml);
});

export default router;
