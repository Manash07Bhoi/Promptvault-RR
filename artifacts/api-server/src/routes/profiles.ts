import { Router, type IRouter } from "express";
import { eq, and, desc, ilike, or, sql, ne } from "drizzle-orm";
import {
  db, usersTable, packsTable, userFollowsTable, userActivityTable,
  reviewsTable, orderItemsTable, ordersTable, creatorApplicationsTable
} from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";
import { logger } from "../utils/logger.js";
import { sanitizeLikePattern } from "../utils/db-utils.js";

const router: IRouter = Router();

function serializePublicUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    coverImageUrl: user.coverImageUrl,
    bio: user.bio,
    location: user.location,
    websiteUrl: user.websiteUrl,
    twitterHandle: user.twitterHandle,
    linkedinUrl: user.linkedinUrl,
    githubHandle: user.githubHandle,
    youtubeUrl: user.youtubeUrl,
    specialties: user.specialties || [],
    isCreator: user.isCreator,
    isVerified: user.isVerified,
    followerCount: user.followerCount || 0,
    followingCount: user.followingCount || 0,
    publicPackCount: user.publicPackCount || 0,
    totalDownloadsAllPacks: user.totalDownloadsAllPacks || 0,
    profileVisibility: user.profileVisibility || "public",
    subscriptionPlan: user.subscriptionPlan || "free",
    createdAt: user.createdAt?.toISOString(),
  };
}

// GET /api/users/:username - Public profile
router.get("/users/:username", async (req: AuthRequest, res): Promise<void> => {
  const username = req.params.username as string;
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.username, String(username).toLowerCase()))
    .limit(1);

  if (!user || user.deletedAt) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.profileVisibility === "private" && req.user?.userId !== user.id) {
    res.status(403).json({ error: "This profile is private" });
    return;
  }

  // Check if current user follows this user
  let isFollowing = false;
  if (req.user?.userId && req.user.userId !== user.id) {
    const [follow] = await db.select().from(userFollowsTable)
      .where(and(
        eq(userFollowsTable.followerId, req.user.userId),
        eq(userFollowsTable.followingId, user.id)
      )).limit(1);
    isFollowing = !!follow;
  }

  // Get average rating across all their packs
  const ratingResult = await db.select({
    avgRating: sql<number>`AVG(${packsTable.avgRating})`,
  }).from(packsTable)
    .where(and(eq(packsTable.creatorId, user.id), eq(packsTable.status, "PUBLISHED")));

  res.json({
    ...serializePublicUser(user),
    isFollowing,
    avgRating: ratingResult[0]?.avgRating || null,
  });
});

// GET /api/users/:username/packs - Published packs by user
router.get("/users/:username/packs", async (req, res): Promise<void> => {
  const username = req.params.username as string;
  const { sort = "newest", page = "1" } = req.query as Record<string, string>;
  const pageNum = parseInt(page) || 1;
  const limit = 12;
  const offset = (pageNum - 1) * limit;

  const [user] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.username, String(username).toLowerCase())).limit(1);

  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const orderBy = sort === "downloads" ? desc(packsTable.totalDownloads) :
    sort === "rating" ? desc(packsTable.avgRating) :
      desc(packsTable.publishedAt);

  const packs = await db.select().from(packsTable)
    .where(and(eq(packsTable.creatorId, user.id), eq(packsTable.status, "PUBLISHED")))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  res.json({ packs, page: pageNum });
});

// GET /api/users/:username/followers
router.get("/users/:username/followers", async (req, res): Promise<void> => {
  const username = req.params.username as string;
  const { cursor, q } = req.query as Record<string, string>;

  const [user] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.username, String(username).toLowerCase())).limit(1);

  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const followers = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    displayName: usersTable.displayName,
    avatarUrl: usersTable.avatarUrl,
    bio: usersTable.bio,
    isVerified: usersTable.isVerified,
    publicPackCount: usersTable.publicPackCount,
    followerCount: usersTable.followerCount,
  }).from(userFollowsTable)
    .innerJoin(usersTable, eq(userFollowsTable.followerId, usersTable.id))
    .where(
      and(
        eq(userFollowsTable.followingId, user.id),
        q ? or(ilike(usersTable.displayName, `%${sanitizeLikePattern(q)}%`), ilike(usersTable.username, `%${sanitizeLikePattern(q)}%`)) : undefined
      )
    )
    .orderBy(desc(userFollowsTable.createdAt))
    .limit(20);

  res.json({ followers });
});

// GET /api/users/:username/following
router.get("/users/:username/following", async (req, res): Promise<void> => {
  const username = req.params.username as string;
  const { q } = req.query as Record<string, string>;

  const [user] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.username, String(username).toLowerCase())).limit(1);

  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const following = await db.select({
    id: usersTable.id,
    username: usersTable.username,
    displayName: usersTable.displayName,
    avatarUrl: usersTable.avatarUrl,
    bio: usersTable.bio,
    isVerified: usersTable.isVerified,
    publicPackCount: usersTable.publicPackCount,
    followerCount: usersTable.followerCount,
  }).from(userFollowsTable)
    .innerJoin(usersTable, eq(userFollowsTable.followingId, usersTable.id))
    .where(
      and(
        eq(userFollowsTable.followerId, user.id),
        q ? or(ilike(usersTable.displayName, `%${sanitizeLikePattern(q)}%`), ilike(usersTable.username, `%${sanitizeLikePattern(q)}%`)) : undefined
      )
    )
    .orderBy(desc(userFollowsTable.createdAt))
    .limit(20);

  res.json({ following });
});

// POST /api/user/:username/follow
router.post("/user/:username/follow", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const username = req.params.username as string;
  const followerId = req.user!.userId;

  const [target] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.username, String(username).toLowerCase())).limit(1);

  if (!target) { res.status(404).json({ error: "User not found" }); return; }
  if (target.id === followerId) { res.status(400).json({ error: "Cannot follow yourself" }); return; }

  await db.insert(userFollowsTable).values({
    followerId,
    followingId: target.id,
  }).onConflictDoNothing();

  // Update counts
  await db.update(usersTable).set({ followingCount: sql`${usersTable.followingCount} + 1` }).where(eq(usersTable.id, followerId));
  await db.update(usersTable).set({ followerCount: sql`${usersTable.followerCount} + 1` }).where(eq(usersTable.id, target.id));

  res.json({ following: true });
});

// DELETE /api/user/:username/follow
router.delete("/user/:username/follow", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const username = req.params.username as string;
  const followerId = req.user!.userId;

  const [target] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.username, String(username).toLowerCase())).limit(1);

  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  await db.delete(userFollowsTable).where(
    and(eq(userFollowsTable.followerId, followerId), eq(userFollowsTable.followingId, target.id))
  );

  await db.update(usersTable).set({ followingCount: sql`GREATEST(${usersTable.followingCount} - 1, 0)` }).where(eq(usersTable.id, followerId));
  await db.update(usersTable).set({ followerCount: sql`GREATEST(${usersTable.followerCount} - 1, 0)` }).where(eq(usersTable.id, target.id));

  res.json({ following: false });
});

// GET /api/user/activity - Activity feed (people you follow)
router.get("/user/activity", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;

  const following = await db.select({ followingId: userFollowsTable.followingId })
    .from(userFollowsTable).where(eq(userFollowsTable.followerId, userId));

  if (following.length === 0) {
    res.json({ activities: [] });
    return;
  }

  const followingIds = following.map(f => f.followingId);

  const activities = await db.select({
    id: userActivityTable.id,
    userId: userActivityTable.userId,
    activityType: userActivityTable.activityType,
    entityType: userActivityTable.entityType,
    entityId: userActivityTable.entityId,
    metadata: userActivityTable.metadata,
    createdAt: userActivityTable.createdAt,
    userName: usersTable.displayName,
    userUsername: usersTable.username,
    userAvatar: usersTable.avatarUrl,
  }).from(userActivityTable)
    .innerJoin(usersTable, eq(userActivityTable.userId, usersTable.id))
    .where(
      and(
        sql`${userActivityTable.userId} = ANY(${sql`ARRAY[${followingIds.join(",")}]::int[]`})`,
        eq(userActivityTable.isPublic, true)
      )
    )
    .orderBy(desc(userActivityTable.createdAt))
    .limit(50);

  res.json({ activities });
});

// GET /api/creators - Creator directory
router.get("/creators", async (req, res): Promise<void> => {
  const { specialty, minPacks, minRating, q, page = "1" } = req.query as Record<string, string>;
  const pageNum = parseInt(page) || 1;
  const limit = 20;
  const offset = (pageNum - 1) * limit;

  let query = db.select({
    id: usersTable.id,
    username: usersTable.username,
    displayName: usersTable.displayName,
    avatarUrl: usersTable.avatarUrl,
    bio: usersTable.bio,
    specialties: usersTable.specialties,
    isVerified: usersTable.isVerified,
    publicPackCount: usersTable.publicPackCount,
    followerCount: usersTable.followerCount,
    totalDownloadsAllPacks: usersTable.totalDownloadsAllPacks,
  }).from(usersTable)
    .where(
      and(
        eq(usersTable.isCreator, true),
        eq(usersTable.profileVisibility, "public"),
        q ? or(ilike(usersTable.displayName, `%${sanitizeLikePattern(q)}%`), ilike(usersTable.username, `%${sanitizeLikePattern(q)}%`)) : undefined,
        minPacks ? sql`${usersTable.publicPackCount} >= ${parseInt(minPacks)}` : undefined,
      )
    )
    .orderBy(desc(usersTable.totalDownloadsAllPacks))
    .limit(limit)
    .offset(offset);

  const creators = await query;
  res.json({ creators, page: pageNum });
});

// GET /api/user/profile/completion - Profile completion score
router.get("/user/profile/completion", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const checks = [
    { key: "avatar", label: "Upload a profile photo", points: 15, done: !!user.avatarUrl },
    { key: "displayName", label: "Set your display name", points: 10, done: !!user.displayName && user.displayName.length > 0 },
    { key: "bio", label: "Write a bio (50+ chars)", points: 15, done: !!user.bio && user.bio.length >= 50 },
    { key: "username", label: "Choose a username", points: 10, done: !!user.username },
    { key: "socialLink", label: "Add a social link", points: 10, done: !!(user.twitterHandle || user.linkedinUrl || user.githubHandle || user.youtubeUrl) },
    { key: "specialties", label: "Add at least 3 specialties", points: 10, done: (user.specialties || []).length >= 3 },
    { key: "coverImage", label: "Upload a cover image", points: 10, done: !!user.coverImageUrl },
    { key: "location", label: "Set your location", points: 5, done: !!user.location },
    { key: "website", label: "Add your website URL", points: 5, done: !!user.websiteUrl },
  ];

  const totalPoints = checks.reduce((sum, c) => sum + (c.done ? c.points : 0), 0);
  const maxPoints = checks.reduce((sum, c) => sum + c.points, 0);
  const percentage = Math.round((totalPoints / maxPoints) * 100);

  res.json({ percentage, totalPoints, maxPoints, checks });
});

// PATCH /api/user/profile/extended - Update extended profile
router.patch("/user/profile/extended", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;
  const {
    username, displayName, bio, location, websiteUrl,
    twitterHandle, linkedinUrl, githubHandle, youtubeUrl,
    specialties, profileVisibility, coverImageUrl, avatarUrl
  } = req.body;

  if (username) {
    const clean = String(username).toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (clean.length < 3 || clean.length > 30) {
      res.status(400).json({ error: "Username must be 3–30 characters (letters, numbers, underscores)" });
      return;
    }
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable)
      .where(and(eq(usersTable.username, clean), ne(usersTable.id, userId))).limit(1);
    if (existing) { res.status(409).json({ error: "Username already taken" }); return; }

    const [me] = await db.select({ usernameChangedAt: usersTable.usernameChangedAt }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (me?.usernameChangedAt) {
      const daysSince = (Date.now() - me.usernameChangedAt.getTime()) / (1000 * 86400);
      if (daysSince < 30) {
        res.status(400).json({ error: `Username can only be changed once per 30 days. ${Math.ceil(30 - daysSince)} days remaining.` });
        return;
      }
    }
  }

  const updateData: Record<string, any> = {};
  if (username) { updateData.username = String(username).toLowerCase().replace(/[^a-z0-9_]/g, ""); updateData.usernameChangedAt = new Date(); }
  if (displayName !== undefined) updateData.displayName = displayName;
  if (bio !== undefined) updateData.bio = bio;
  if (location !== undefined) updateData.location = location;
  if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
  if (twitterHandle !== undefined) updateData.twitterHandle = twitterHandle;
  if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
  if (githubHandle !== undefined) updateData.githubHandle = githubHandle;
  if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl;
  if (specialties !== undefined) updateData.specialties = specialties;
  if (profileVisibility !== undefined) updateData.profileVisibility = profileVisibility;
  if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

  const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, userId)).returning();
  res.json(serializePublicUser(updated));
});

// GET /api/user/username/check - Check username availability
router.get("/user/username/check", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { username } = req.query as { username: string };
  if (!username) { res.status(400).json({ error: "username required" }); return; }

  const clean = String(username).toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (clean.length < 3 || clean.length > 30) {
    res.json({ available: false, reason: "3–30 characters, letters/numbers/underscores only" });
    return;
  }

  const [existing] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(and(eq(usersTable.username, clean), ne(usersTable.id, req.user!.userId))).limit(1);

  res.json({ available: !existing, username: clean });
});

// POST /api/user/verify/request - Request creator verification
router.post("/user/verify/request", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  await db.update(usersTable)
    .set({ verificationRequestedAt: new Date() })
    .where(eq(usersTable.id, req.user!.userId));
  res.json({ message: "Verification request submitted" });
});

export default router;
