import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, usersTable, ordersTable, orderItemsTable, packsTable, savedPacksTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { UpdateUserProfileBody as UpdateProfileBody, UpdatePasswordBody } from "@workspace/api-zod";
import { verifyPassword, hashPassword } from "../lib/auth.js";
import { serializeUser, serializeOrder, serializeOrderItem } from "../lib/serialize.js";
import { z } from "zod";
import { logger } from "../utils/logger.js";

const router: IRouter = Router();

const packIdParamSchema = z.object({
  packId: z.coerce.number().int().min(1),
});

const orderIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

router.get("/user/profile", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(serializeUser(user));
});

router.patch("/user/profile", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed", fields: parsed.error.formErrors.fieldErrors }); return; }

  const [user] = await db.update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(usersTable.id, req.user!.userId))
    .returning();

  res.json(serializeUser(user));
});

router.patch("/user/password", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdatePasswordBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Validation failed" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }

  const newHash = await hashPassword(parsed.data.newPassword);
  await db.update(usersTable).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(usersTable.id, user.id));

  logger.info({ userId: user.id }, "Password updated");
  res.json({ message: "Password updated successfully" });
});

router.get("/user/purchases", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const orders = await db.select().from(ordersTable)
    .where(and(eq(ordersTable.userId, req.user!.userId), eq(ordersTable.status, "COMPLETED")))
    .orderBy(ordersTable.createdAt);

  if (orders.length === 0) {
    res.json([]);
    return;
  }

  const allItems = await db.select().from(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, orders.map(o => o.id)));

  const packIds = [...new Set(allItems.map(i => i.packId))];
  const packs = packIds.length > 0
    ? await db.select({ id: packsTable.id, slug: packsTable.slug }).from(packsTable).where(inArray(packsTable.id, packIds))
    : [];
  const packSlugMap = Object.fromEntries(packs.map(p => [p.id, p.slug]));

  const itemsByOrder: Record<number, ReturnType<typeof serializeOrderItem>[]> = {};
  for (const item of allItems) {
    if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = [];
    itemsByOrder[item.orderId].push(serializeOrderItem(item, packSlugMap[item.packId] || ""));
  }

  res.json(orders.map(o => serializeOrder(o, itemsByOrder[o.id] || [])));
});

router.get("/user/saved-packs", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const saved = await db.select().from(savedPacksTable).where(eq(savedPacksTable.userId, req.user!.userId));

  if (saved.length === 0) {
    res.json([]);
    return;
  }

  const packs = await db.select().from(packsTable).where(inArray(packsTable.id, saved.map(s => s.packId)));
  // Explicitly whitelist fields — no sensitive internal data
  res.json(packs.map(p => ({
    id: p.id, title: p.title, slug: p.slug, shortDescription: p.shortDescription,
    categoryId: p.categoryId, status: p.status, aiToolTargets: p.aiToolTargets || [],
    promptCount: p.promptCount, priceCents: p.priceCents, comparePriceCents: p.comparePriceCents,
    isFree: p.isFree, isFeatured: p.isFeatured, isBestseller: p.isBestseller,
    thumbnailUrl: p.thumbnailUrl, tags: p.tags || [],
    totalDownloads: p.totalDownloads, avgRating: p.avgRating, reviewCount: p.reviewCount,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/user/saved-packs/:packId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = packIdParamSchema.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid pack ID" }); return; }

  await db.insert(savedPacksTable).values({ userId: req.user!.userId, packId: parsed.data.packId }).onConflictDoNothing();
  res.json({ message: "Pack saved" });
});

router.delete("/user/saved-packs/:packId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = packIdParamSchema.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid pack ID" }); return; }

  await db.delete(savedPacksTable).where(and(
    eq(savedPacksTable.userId, req.user!.userId),
    eq(savedPacksTable.packId, parsed.data.packId),
  ));
  res.json({ message: "Pack removed from wishlist" });
});

router.get("/user/downloads/:packId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = packIdParamSchema.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid pack ID" }); return; }

  const packId = parsed.data.packId;

  const fileTypeSchema = z.enum(["PDF", "ZIP"]).default("PDF");
  const fileTypeParsed = fileTypeSchema.safeParse(req.query.fileType);
  const fileType = fileTypeParsed.success ? fileTypeParsed.data : "PDF";

  const orders = await db.select().from(ordersTable)
    .where(and(eq(ordersTable.userId, req.user!.userId), eq(ordersTable.status, "COMPLETED")));

  if (orders.length === 0) {
    logger.warn({ userId: req.user!.userId, packId }, "Authorization denied: no orders");
    res.status(403).json({ error: "You have not purchased this pack" });
    return;
  }

  const [item] = await db.select().from(orderItemsTable)
    .where(and(
      inArray(orderItemsTable.orderId, orders.map(o => o.id)),
      eq(orderItemsTable.packId, packId)
    )).limit(1);

  if (!item) {
    logger.warn({ userId: req.user!.userId, packId }, "Authorization denied: pack not in orders");
    res.status(403).json({ error: "You have not purchased this pack" });
    return;
  }

  await db.update(orderItemsTable)
    .set({ downloadCount: (item.downloadCount || 0) + 1, firstDownloadedAt: item.firstDownloadedAt || new Date() })
    .where(eq(orderItemsTable.id, item.id));

  const expiresAt = new Date(Date.now() + 3600000);
  res.json({
    url: `/api/packs/${packId}/download?type=${fileType}`,
    fileType,
    expiresAt: expiresAt.toISOString(),
  });
});

const preferencesSchema = z.object({
  notifications: z.object({
    newPacks: z.boolean().optional(),
    orderUpdates: z.boolean().optional(),
    promotionalEmails: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
  }).optional(),
}).passthrough();

router.get("/user/preferences", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select({ preferences: usersTable.preferences }).from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(user.preferences || {});
});

router.patch("/user/preferences", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const parsed = preferencesSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid preferences" }); return; }

  const [current] = await db.select({ preferences: usersTable.preferences }).from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  const merged = { ...(current?.preferences as object || {}), ...parsed.data };

  await db.update(usersTable).set({ preferences: merged, updatedAt: new Date() }).where(eq(usersTable.id, req.user!.userId));
  res.json(merged);
});

export default router;
