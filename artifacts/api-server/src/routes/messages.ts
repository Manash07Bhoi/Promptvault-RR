import { Router, type IRouter } from "express";
import { eq, and, or, desc, sql } from "drizzle-orm";
import {
  db, usersTable, conversationsTable, directMessagesTable,
  ordersTable, orderItemsTable, packsTable
} from "@workspace/db";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

// Helper: check if user can message another user
async function canMessage(senderId: number, recipientId: number): Promise<boolean> {
  if (senderId === recipientId) return false;

  // Check if sender has purchased any pack from recipient (creator->buyer or buyer->creator)
  const senderBoughtFromRecipient = await db.select({ count: sql<number>`count(*)` })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .innerJoin(packsTable, eq(orderItemsTable.packId, packsTable.id))
    .where(and(
      eq(ordersTable.userId, senderId),
      eq(packsTable.creatorId, recipientId),
      eq(ordersTable.status, "COMPLETED"),
    ));

  if (Number(senderBoughtFromRecipient[0]?.count) > 0) return true;

  // Check if recipient has purchased from sender
  const recipientBoughtFromSender = await db.select({ count: sql<number>`count(*)` })
    .from(orderItemsTable)
    .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
    .innerJoin(packsTable, eq(orderItemsTable.packId, packsTable.id))
    .where(and(
      eq(ordersTable.userId, recipientId),
      eq(packsTable.creatorId, senderId),
      eq(ordersTable.status, "COMPLETED"),
    ));

  if (Number(recipientBoughtFromSender[0]?.count) > 0) return true;

  // Check if sender is a verified creator (can message anyone)
  const [sender] = await db.select({ isVerified: usersTable.isVerified, isCreator: usersTable.isCreator })
    .from(usersTable).where(eq(usersTable.id, senderId)).limit(1);

  return !!(sender?.isVerified || sender?.isCreator);
}

// GET /api/messages/conversations - List user's conversations
router.get("/messages/conversations", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;

  const convos = await db.select({
    id: conversationsTable.id,
    participant1Id: conversationsTable.participant1Id,
    participant2Id: conversationsTable.participant2Id,
    lastMessageAt: conversationsTable.lastMessageAt,
    participant1Unread: conversationsTable.participant1Unread,
    participant2Unread: conversationsTable.participant2Unread,
    createdAt: conversationsTable.createdAt,
  }).from(conversationsTable)
    .where(or(
      eq(conversationsTable.participant1Id, userId),
      eq(conversationsTable.participant2Id, userId),
    ))
    .orderBy(desc(conversationsTable.lastMessageAt));

  // Enrich with other participant info
  const enriched = await Promise.all(convos.map(async (c) => {
    const otherId = c.participant1Id === userId ? c.participant2Id : c.participant1Id;
    const [other] = await db.select({
      id: usersTable.id,
      displayName: usersTable.displayName,
      username: usersTable.username,
      avatarUrl: usersTable.avatarUrl,
      isVerified: usersTable.isVerified,
    }).from(usersTable).where(eq(usersTable.id, otherId)).limit(1);

    // Get last message preview
    const [lastMsg] = await db.select({
      body: directMessagesTable.body,
      senderId: directMessagesTable.senderId,
      createdAt: directMessagesTable.createdAt,
    }).from(directMessagesTable)
      .where(eq(directMessagesTable.conversationId, c.id))
      .orderBy(desc(directMessagesTable.createdAt))
      .limit(1);

    const unreadCount = c.participant1Id === userId ? c.participant1Unread : c.participant2Unread;

    return {
      id: c.id,
      other,
      lastMessage: lastMsg ? {
        body: lastMsg.body.substring(0, 80),
        isFromMe: lastMsg.senderId === userId,
        createdAt: lastMsg.createdAt.toISOString(),
      } : null,
      unreadCount,
      lastMessageAt: c.lastMessageAt?.toISOString(),
      createdAt: c.createdAt.toISOString(),
    };
  }));

  res.json({ conversations: enriched });
});

// POST /api/messages/conversations - Start or get existing conversation
router.post("/messages/conversations", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const senderId = req.user!.userId;
  const { recipientId } = req.body;

  if (!recipientId || isNaN(parseInt(recipientId))) {
    res.status(400).json({ error: "recipientId required" });
    return;
  }

  const rid = parseInt(recipientId);

  const allowed = await canMessage(senderId, rid);
  if (!allowed) {
    res.status(403).json({ error: "You can only message creators whose packs you've purchased, or buyers of your packs." });
    return;
  }

  // Check if conversation exists (order-independent)
  const p1 = Math.min(senderId, rid);
  const p2 = Math.max(senderId, rid);

  const [existing] = await db.select().from(conversationsTable)
    .where(and(
      eq(conversationsTable.participant1Id, p1),
      eq(conversationsTable.participant2Id, p2),
    )).limit(1);

  if (existing) {
    res.json({ conversation: existing });
    return;
  }

  const [convo] = await db.insert(conversationsTable).values({
    participant1Id: p1,
    participant2Id: p2,
  }).returning();

  res.status(201).json({ conversation: convo });
});

// GET /api/messages/conversations/:id - Get messages in a conversation
router.get("/messages/conversations/:id", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;
  const convoId = parseInt(req.params.id as string);
  const page = parseInt(req.query.page as string || "1");
  const limit = 30;
  const offset = (page - 1) * limit;

  const [convo] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, convoId)).limit(1);
  if (!convo) { res.status(404).json({ error: "Conversation not found" }); return; }
  if (convo.participant1Id !== userId && convo.participant2Id !== userId) {
    res.status(403).json({ error: "Not your conversation" }); return;
  }

  const msgs = await db.select({
    id: directMessagesTable.id,
    conversationId: directMessagesTable.conversationId,
    senderId: directMessagesTable.senderId,
    body: directMessagesTable.body,
    isRead: directMessagesTable.isRead,
    readAt: directMessagesTable.readAt,
    createdAt: directMessagesTable.createdAt,
  }).from(directMessagesTable)
    .where(eq(directMessagesTable.conversationId, convoId))
    .orderBy(desc(directMessagesTable.createdAt))
    .limit(limit)
    .offset(offset);

  // Mark unread messages as read
  await db.update(directMessagesTable)
    .set({ isRead: true, readAt: new Date() })
    .where(and(
      eq(directMessagesTable.conversationId, convoId),
      eq(directMessagesTable.isRead, false),
    ));

  // Reset unread count for this user
  if (convo.participant1Id === userId) {
    await db.update(conversationsTable).set({ participant1Unread: 0 }).where(eq(conversationsTable.id, convoId));
  } else {
    await db.update(conversationsTable).set({ participant2Unread: 0 }).where(eq(conversationsTable.id, convoId));
  }

  // Get other participant info
  const otherId = convo.participant1Id === userId ? convo.participant2Id : convo.participant1Id;
  const [other] = await db.select({
    id: usersTable.id,
    displayName: usersTable.displayName,
    username: usersTable.username,
    avatarUrl: usersTable.avatarUrl,
    isVerified: usersTable.isVerified,
  }).from(usersTable).where(eq(usersTable.id, otherId)).limit(1);

  res.json({
    conversation: { ...convo, other },
    messages: msgs.reverse().map(m => ({
      ...m,
      readAt: m.readAt?.toISOString(),
      createdAt: m.createdAt.toISOString(),
      isFromMe: m.senderId === userId,
    })),
    page,
    hasMore: msgs.length === limit,
  });
});

// POST /api/messages/conversations/:id/messages - Send a message
router.post("/messages/conversations/:id/messages", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.user!.userId;
  const convoId = parseInt(req.params.id as string);
  const { body } = req.body;

  if (!body || body.trim().length === 0) { res.status(400).json({ error: "Message body required" }); return; }
  if (body.length > 2000) { res.status(400).json({ error: "Message too long (max 2000 chars)" }); return; }

  const [convo] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, convoId)).limit(1);
  if (!convo) { res.status(404).json({ error: "Conversation not found" }); return; }
  if (convo.participant1Id !== userId && convo.participant2Id !== userId) {
    res.status(403).json({ error: "Not your conversation" }); return;
  }

  const [msg] = await db.insert(directMessagesTable).values({
    conversationId: convoId,
    senderId: userId,
    body: body.trim(),
  }).returning();

  // Update conversation metadata - increment unread for OTHER participant
  const isParticipant1 = convo.participant1Id === userId;
  await db.update(conversationsTable).set({
    lastMessageAt: new Date(),
    participant1Unread: isParticipant1 ? convo.participant1Unread : sql`${conversationsTable.participant1Unread} + 1`,
    participant2Unread: isParticipant1 ? sql`${conversationsTable.participant2Unread} + 1` : convo.participant2Unread,
  }).where(eq(conversationsTable.id, convoId));

  res.status(201).json({
    ...msg,
    createdAt: msg.createdAt.toISOString(),
    isFromMe: true,
  });
});

export default router;
