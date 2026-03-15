import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, cartTable, cartItemsTable, packsTable, orderItemsTable, ordersTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

async function getOrCreateCart(userId: number) {
  let [cart] = await db.select().from(cartTable).where(eq(cartTable.userId, userId)).limit(1);
  if (!cart) {
    [cart] = await db.insert(cartTable).values({ userId }).returning();
  }
  return cart;
}

// GET /api/cart
router.get("/cart", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const cart = await getOrCreateCart(req.user!.userId);

  const items = await db.select({
    id: cartItemsTable.id,
    cartId: cartItemsTable.cartId,
    packId: cartItemsTable.packId,
    addedAt: cartItemsTable.addedAt,
    packTitle: packsTable.title,
    packSlug: packsTable.slug,
    packThumbnail: packsTable.thumbnailUrl,
    packPriceCents: packsTable.priceCents,
    packComparePriceCents: packsTable.comparePriceCents,
    packIsFree: packsTable.isFree,
    packSalePriceCents: packsTable.salePriceCents,
  }).from(cartItemsTable)
    .innerJoin(packsTable, eq(cartItemsTable.packId, packsTable.id))
    .where(eq(cartItemsTable.cartId, cart.id))
    .orderBy(desc(cartItemsTable.addedAt));

  const subtotal = items.reduce((sum, item) => {
    const price = item.packSalePriceCents ?? item.packPriceCents;
    return sum + (item.packIsFree ? 0 : price);
  }, 0);

  res.json({ cart: { ...cart, items, subtotalCents: subtotal } });
});

// POST /api/cart/items - Add to cart
router.post("/cart/items", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { packId } = req.body;
  if (!packId) { res.status(400).json({ error: "packId required" }); return; }

  const [pack] = await db.select().from(packsTable).where(eq(packsTable.id, packId)).limit(1);
  if (!pack || pack.status !== "PUBLISHED") { res.status(404).json({ error: "Pack not found" }); return; }

  // Check already purchased
  const alreadyPurchased = await db.select({ id: orderItemsTable.id })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(and(eq(orderItemsTable.packId, packId), eq(ordersTable.userId, req.user!.userId), eq(ordersTable.status, "COMPLETED")))
    .limit(1);

  if (alreadyPurchased.length > 0) {
    res.status(400).json({ error: "You already own this pack" });
    return;
  }

  const cart = await getOrCreateCart(req.user!.userId);

  const [existing] = await db.select().from(cartItemsTable)
    .where(and(eq(cartItemsTable.cartId, cart.id), eq(cartItemsTable.packId, packId))).limit(1);

  if (existing) { res.status(400).json({ error: "Already in cart" }); return; }

  const [item] = await db.insert(cartItemsTable).values({ cartId: cart.id, packId }).returning();
  res.status(201).json({ item });
});

// DELETE /api/cart/items/:packId
router.delete("/cart/items/:packId", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.packId as string);
  const cart = await getOrCreateCart(req.user!.userId);
  await db.delete(cartItemsTable).where(and(eq(cartItemsTable.cartId, cart.id), eq(cartItemsTable.packId, packId)));
  res.json({ success: true });
});

// DELETE /api/cart - Clear cart
router.delete("/cart", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const cart = await getOrCreateCart(req.user!.userId);
  await db.delete(cartItemsTable).where(eq(cartItemsTable.cartId, cart.id));
  res.json({ success: true });
});

export default router;
