import { Router, type IRouter } from "express";
import { eq, and, desc, ilike, or, sql } from "drizzle-orm";
import { sanitizeLikePattern } from "../utils/db-utils.js";
import {
  db, usersTable, communityPromptsTable, communityPromptVotesTable
} from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

// GET /api/community/prompts
router.get("/community/prompts", async (req: AuthRequest, res): Promise<void> => {
  const { q = "", sort = "trending", category, page = "1", limit: limitStr = "20" } = req.query as Record<string, string>;
  const pageNum = parseInt(page) || 1;
  const limit = Math.min(parseInt(limitStr) || 20, 50);
  const offset = (pageNum - 1) * limit;

  let orderBy;
  if (sort === "newest") orderBy = desc(communityPromptsTable.createdAt);
  else if (sort === "most-voted") orderBy = desc(communityPromptsTable.upvoteCount);
  else orderBy = desc(communityPromptsTable.upvoteCount); // trending = most upvotes

  let whereClause = or(
    eq(communityPromptsTable.status, "approved"),
    eq(communityPromptsTable.status, "featured")
  ) as any;

  if (q) {
    whereClause = and(whereClause, ilike(communityPromptsTable.body, `%${sanitizeLikePattern(q)}%`));
  }
  if (category && category !== "All") {
    whereClause = and(whereClause, eq(communityPromptsTable.aiTool, category));
  }

  const prompts = await db.select({
    id: communityPromptsTable.id,
    body: communityPromptsTable.body,
    aiTool: communityPromptsTable.aiTool,
    upvoteCount: communityPromptsTable.upvoteCount,
    commentCount: communityPromptsTable.commentCount,
    status: communityPromptsTable.status,
    createdAt: communityPromptsTable.createdAt,
    userId: communityPromptsTable.userId,
    displayName: usersTable.displayName,
    username: usersTable.username,
    avatarUrl: usersTable.avatarUrl,
    isVerified: usersTable.isVerified,
  }).from(communityPromptsTable)
    .innerJoin(usersTable, eq(communityPromptsTable.userId, usersTable.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(communityPromptsTable).where(whereClause);

  // If user is logged in, check their votes
  let votedIds: Set<number> = new Set();
  if (req.user?.userId) {
    try {
      const votes = await db.select({ promptId: communityPromptVotesTable.promptId })
        .from(communityPromptVotesTable)
        .where(eq(communityPromptVotesTable.userId, req.user.userId));
      votedIds = new Set(votes.map(v => v.promptId));
    } catch (e) {
      // Table may not exist yet
    }
  }

  res.json({
    prompts: prompts.map(p => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      hasVoted: votedIds.has(p.id),
    })),
    total: Number(count),
    page: pageNum,
    hasMore: offset + prompts.length < Number(count),
  });
});

// POST /api/community/prompts - Submit a community prompt
router.post("/community/prompts", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;
  const { body, aiTool } = req.body;

  if (!body || body.trim().length < 20) {
    res.status(400).json({ error: "Prompt body must be at least 20 characters" });
    return;
  }
  if (body.length > 2000) {
    res.status(400).json({ error: "Prompt body must be under 2000 characters" });
    return;
  }

  const [prompt] = await db.insert(communityPromptsTable).values({
    userId,
    body: body.trim(),
    aiTool: aiTool || null,
    status: "approved",
  }).returning();

  res.status(201).json(prompt);
});

// POST /api/community/prompts/:id/vote - Upvote a community prompt
router.post("/community/prompts/:id/vote", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;
  const promptId = parseInt(req.params.id as string);

  try {
    await db.insert(communityPromptVotesTable).values({ userId, promptId });
    await db.update(communityPromptsTable)
      .set({ upvoteCount: sql`${communityPromptsTable.upvoteCount} + 1` })
      .where(eq(communityPromptsTable.id, promptId));
    res.json({ voted: true });
  } catch (e: any) {
    if (e.code === "23505") {
      res.status(409).json({ error: "Already voted" });
    } else {
      res.status(500).json({ error: "Failed to vote" });
    }
  }
});

// DELETE /api/community/prompts/:id/vote - Remove vote
router.delete("/community/prompts/:id/vote", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;
  const promptId = parseInt(req.params.id as string);

  await db.delete(communityPromptVotesTable)
    .where(and(
      eq(communityPromptVotesTable.userId, userId),
      eq(communityPromptVotesTable.promptId, promptId),
    ));
  await db.update(communityPromptsTable)
    .set({ upvoteCount: sql`GREATEST(${communityPromptsTable.upvoteCount} - 1, 0)` })
    .where(eq(communityPromptsTable.id, promptId));

  res.json({ voted: false });
});

// GET /api/community/prompts/top - Top voted prompts (for homepage widget)
router.get("/community/prompts/top", async (req, res): Promise<void> => {
  const prompts = await db.select({
    id: communityPromptsTable.id,
    body: communityPromptsTable.body,
    aiTool: communityPromptsTable.aiTool,
    upvoteCount: communityPromptsTable.upvoteCount,
    createdAt: communityPromptsTable.createdAt,
    displayName: usersTable.displayName,
    username: usersTable.username,
    avatarUrl: usersTable.avatarUrl,
  }).from(communityPromptsTable)
    .innerJoin(usersTable, eq(communityPromptsTable.userId, usersTable.id))
    .where(or(
      eq(communityPromptsTable.status, "approved"),
      eq(communityPromptsTable.status, "featured"),
    ))
    .orderBy(desc(communityPromptsTable.upvoteCount))
    .limit(6);

  res.json({ prompts: prompts.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })) });
});

export default router;
