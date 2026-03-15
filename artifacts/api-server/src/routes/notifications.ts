import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, notificationsTable, notificationPreferencesTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

// GET /api/notifications
router.get("/notifications", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;
  const { filter = "all", page = "1" } = req.query as Record<string, string>;
  const pageNum = parseInt(page) || 1;
  const limit = 20;
  const offset = (pageNum - 1) * limit;

  let whereClause = eq(notificationsTable.userId, userId) as any;
  if (filter === "unread") whereClause = and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false));

  const notifications = await db.select().from(notificationsTable)
    .where(whereClause)
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(notificationsTable).where(whereClause);

  res.json({
    notifications: notifications.map(n => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      readAt: n.readAt?.toISOString(),
    })),
    total: Number(count),
    page: pageNum,
  });
});

// GET /api/notifications/unread-count
router.get("/notifications/unread-count", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.userId, req.user!.userId), eq(notificationsTable.isRead, false)));

  res.json({ count: Number(count) });
});

// PATCH /api/notifications/:id/read
router.patch("/notifications/:id/read", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  await db.update(notificationsTable)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.user!.userId)));
  res.json({ success: true });
});

// POST /api/notifications/read-all
router.post("/notifications/read-all", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  await db.update(notificationsTable)
    .set({ isRead: true, readAt: new Date() })
    .where(and(eq(notificationsTable.userId, req.user!.userId), eq(notificationsTable.isRead, false)));
  res.json({ success: true });
});

// DELETE /api/notifications/:id
router.delete("/notifications/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const id = parseInt(req.params.id as string);
  await db.delete(notificationsTable)
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.user!.userId)));
  res.json({ success: true });
});

// GET /api/notifications/preferences
router.get("/notifications/preferences", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [prefs] = await db.select().from(notificationPreferencesTable)
    .where(eq(notificationPreferencesTable.userId, req.user!.userId)).limit(1);

  res.json(prefs || {
    userId: req.user!.userId,
    preferences: {},
    digestFrequency: "realtime",
    quietHoursStart: null,
    quietHoursEnd: null,
  });
});

// PATCH /api/notifications/preferences
router.patch("/notifications/preferences", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { preferences, digestFrequency, quietHoursStart, quietHoursEnd } = req.body;

  await db.insert(notificationPreferencesTable).values({
    userId: req.user!.userId,
    preferences: preferences || {},
    digestFrequency: digestFrequency || "realtime",
    quietHoursStart,
    quietHoursEnd,
  }).onConflictDoUpdate({
    target: notificationPreferencesTable.userId,
    set: { preferences, digestFrequency, quietHoursStart, quietHoursEnd },
  });

  res.json({ success: true });
});

// Helper to create a notification (exported for use in other routes)
export async function createNotification(userId: number, type: any, payload: {
  title: string; body: string; imageUrl?: string; ctaUrl?: string; ctaLabel?: string;
  actorId?: number; entityType?: string; entityId?: number;
}) {
  try {
    await db.insert(notificationsTable).values({
      userId,
      type,
      title: payload.title,
      body: payload.body,
      imageUrl: payload.imageUrl,
      ctaUrl: payload.ctaUrl,
      ctaLabel: payload.ctaLabel,
      actorId: payload.actorId,
      entityType: payload.entityType,
      entityId: payload.entityId,
    });
  } catch (e) {
    // Non-blocking
  }
}

export default router;
