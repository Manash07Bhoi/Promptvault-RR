import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, packsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

async function getOrdersWithItems(userId: number) {
  const orders = await db.select().from(ordersTable)
    .where(eq(ordersTable.userId, userId))
    .orderBy(ordersTable.createdAt);

  if (orders.length === 0) return [];

  const items = await db.select().from(orderItemsTable)
    .where(inArray(orderItemsTable.orderId, orders.map(o => o.id)));

  const packIds = [...new Set(items.map(i => i.packId))];
  const packs = packIds.length > 0
    ? await db.select({ id: packsTable.id, slug: packsTable.slug }).from(packsTable).where(inArray(packsTable.id, packIds))
    : [];
  const slugMap = Object.fromEntries(packs.map(p => [p.id, p.slug]));

  const itemsByOrder: Record<number, any[]> = {};
  for (const item of items) {
    if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = [];
    itemsByOrder[item.orderId].push({
      id: item.id,
      packId: item.packId,
      packSlug: slugMap[item.packId] || "",
      titleSnapshot: item.titleSnapshot,
      priceCents: item.priceCents,
      downloadCount: item.downloadCount,
      firstDownloadedAt: item.firstDownloadedAt ? item.firstDownloadedAt.toISOString() : null,
    });
  }

  return orders.map(o => ({
    id: o.id,
    userId: o.userId,
    status: o.status,
    subtotalCents: o.subtotalCents,
    discountCents: o.discountCents,
    taxCents: o.taxCents,
    totalCents: o.totalCents,
    currency: o.currency,
    stripePaymentIntentId: o.stripePaymentIntentId,
    completedAt: o.completedAt ? o.completedAt.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
    items: itemsByOrder[o.id] || [],
  }));
}

// GET /api/orders/purchased-pack-ids - Fast lookup for purchased pack IDs
router.get("/orders/purchased-pack-ids", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const items = await db.select({ packId: orderItemsTable.packId })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(and(eq(ordersTable.userId, req.user!.userId), eq(ordersTable.status, "COMPLETED")));
  const packIds = [...new Set(items.map(i => i.packId))];
  res.json({ packIds });
});

router.get("/orders", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const orders = await getOrdersWithItems(req.user!.userId);
  res.json(orders);
});

router.get("/orders/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const [order] = await db.select().from(ordersTable)
    .where(and(eq(ordersTable.id, id), eq(ordersTable.userId, req.user!.userId))).limit(1);

  if (!order) { res.status(403).json({ error: "Access denied" }); return; }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const packIds = [...new Set(items.map(i => i.packId))];
  const packs = packIds.length > 0
    ? await db.select({ id: packsTable.id, slug: packsTable.slug }).from(packsTable).where(inArray(packsTable.id, packIds))
    : [];
  const slugMap = Object.fromEntries(packs.map(p => [p.id, p.slug]));

  res.json({
    id: order.id,
    userId: order.userId,
    status: order.status,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    currency: order.currency,
    stripePaymentIntentId: order.stripePaymentIntentId,
    completedAt: order.completedAt ? order.completedAt.toISOString() : null,
    createdAt: order.createdAt.toISOString(),
    items: items.map(i => ({
      id: i.id,
      packId: i.packId,
      packSlug: slugMap[i.packId] || "",
      titleSnapshot: i.titleSnapshot,
      priceCents: i.priceCents,
      downloadCount: i.downloadCount,
      firstDownloadedAt: i.firstDownloadedAt ? i.firstDownloadedAt.toISOString() : null,
    })),
  });
});

export default router;
