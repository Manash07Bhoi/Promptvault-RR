import { Router, type IRouter } from "express";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import {
  db, promptsTable, promptBookmarksTable, packsTable,
  ordersTable, orderItemsTable
} from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

// Helper: verify user owns this pack
async function userOwnsPack(userId: number, packId: number): Promise<boolean> {
  const [item] = await db.select({ id: orderItemsTable.id })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .where(and(
      eq(orderItemsTable.packId, packId),
      eq(ordersTable.userId, userId),
      eq(ordersTable.status, "COMPLETED")
    )).limit(1);
  return !!item;
}

// GET /api/packs/:packId/prompts/full - All prompts for purchased pack
router.get("/packs/:packId/prompts/full", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const packId = parseInt(req.params.packId as string);
  const userId = req.user!.userId;

  const owns = await userOwnsPack(userId, packId);
  if (!owns) {
    res.status(403).json({ error: "You need to purchase this pack to access its prompts" });
    return;
  }

  const prompts = await db.select().from(promptsTable)
    .where(eq(promptsTable.packId, packId))
    .orderBy(promptsTable.sortOrder);

  // Get user's bookmark status for these prompts
  const promptIds = prompts.map(p => p.id);
  let bookmarks: any[] = [];
  if (promptIds.length > 0) {
    bookmarks = await db.select().from(promptBookmarksTable)
      .where(and(
        eq(promptBookmarksTable.userId, userId),
        inArray(promptBookmarksTable.promptId, promptIds)
      ));
  }

  const bookmarkMap = new Map(bookmarks.map(b => [b.promptId, b]));

  res.json({
    prompts: prompts.map(p => ({
      ...p,
      bookmark: bookmarkMap.get(p.id) || null,
    })),
  });
});

// POST /api/prompts/:id/bookmark - Add to personal library
router.post("/prompts/:id/bookmark", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const promptId = parseInt(req.params.id as string);
  const userId = req.user!.userId;

  const [prompt] = await db.select({ packId: promptsTable.packId }).from(promptsTable).where(eq(promptsTable.id, promptId)).limit(1);
  if (!prompt) { res.status(404).json({ error: "Prompt not found" }); return; }

  const owns = await userOwnsPack(userId, prompt.packId);
  if (!owns) { res.status(403).json({ error: "Purchase this pack to bookmark its prompts" }); return; }

  const [bookmark] = await db.insert(promptBookmarksTable).values({
    userId,
    promptId,
  }).onConflictDoNothing().returning();

  await db.update(promptsTable).set({ bookmarkCount: sql`${promptsTable.bookmarkCount} + 1` }).where(eq(promptsTable.id, promptId));

  res.status(201).json(bookmark);
});

// DELETE /api/prompts/:id/bookmark
router.delete("/prompts/:id/bookmark", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const promptId = parseInt(req.params.id as string);
  await db.delete(promptBookmarksTable).where(
    and(eq(promptBookmarksTable.userId, req.user!.userId), eq(promptBookmarksTable.promptId, promptId))
  );
  await db.update(promptsTable).set({ bookmarkCount: sql`GREATEST(${promptsTable.bookmarkCount} - 1, 0)` }).where(eq(promptsTable.id, promptId));
  res.json({ success: true });
});

// PATCH /api/prompts/:id/bookmark - Update personal rating/usage
router.patch("/prompts/:id/bookmark", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const promptId = parseInt(req.params.id as string);
  const { personalRating, usedCount } = req.body;

  await db.update(promptBookmarksTable).set({
    personalRating: personalRating !== undefined ? personalRating : undefined,
    usedCount: usedCount !== undefined ? usedCount : undefined,
  }).where(and(eq(promptBookmarksTable.userId, req.user!.userId), eq(promptBookmarksTable.promptId, promptId)));

  res.json({ success: true });
});

// GET /api/user/library - Personal prompt library
router.get("/user/library", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;
  const { aiTool, packId, minRating, sort = "date" } = req.query as Record<string, string>;

  const bookmarks = await db.select({
    userId: promptBookmarksTable.userId,
    promptId: promptBookmarksTable.promptId,
    personalRating: promptBookmarksTable.personalRating,
    usedCount: promptBookmarksTable.usedCount,
    lastUsedAt: promptBookmarksTable.lastUsedAt,
    createdAt: promptBookmarksTable.createdAt,
    title: promptsTable.title,
    body: promptsTable.body,
    aiTool: promptsTable.aiTool,
    useCase: promptsTable.useCase,
    variables: promptsTable.variables,
    packId: promptsTable.packId,
    packTitle: packsTable.title,
    packSlug: packsTable.slug,
  }).from(promptBookmarksTable)
    .innerJoin(promptsTable, eq(promptBookmarksTable.promptId, promptsTable.id))
    .innerJoin(packsTable, eq(promptsTable.packId, packsTable.id))
    .where(eq(promptBookmarksTable.userId, userId))
    .orderBy(sort === "rating" ? desc(promptBookmarksTable.personalRating) :
      sort === "used" ? desc(promptBookmarksTable.usedCount) :
        desc(promptBookmarksTable.createdAt));

  res.json({ prompts: bookmarks });
});

// POST /api/prompts/:id/used - Mark prompt as used
router.post("/prompts/:id/used", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const promptId = parseInt(req.params.id as string);
  const userId = req.user!.userId;

  await db.update(promptBookmarksTable).set({
    usedCount: sql`${promptBookmarksTable.usedCount} + 1`,
    lastUsedAt: new Date(),
  }).where(and(eq(promptBookmarksTable.userId, userId), eq(promptBookmarksTable.promptId, promptId)));

  await db.update(promptsTable).set({ usageCount: sql`${promptsTable.usageCount} + 1` }).where(eq(promptsTable.id, promptId));

  res.json({ success: true });
});

export default router;
