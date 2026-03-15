import {
  pgTable, serial, text, timestamp, integer, boolean, json,
  primaryKey, pgEnum, index, smallint, real
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { packsTable } from "./packs.js";

// ============================================================
// USER FOLLOWS
// ============================================================
export const userFollowsTable = pgTable("user_follows", {
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.followerId, table.followingId] }),
  index("idx_user_follows_follower").on(table.followerId),
  index("idx_user_follows_following").on(table.followingId),
]);

// ============================================================
// COLLECTIONS
// ============================================================
export const collectionVisibilityEnum = pgEnum("collection_visibility", ["public", "private", "followers"]);

export const collectionsTable = pgTable("collections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  visibility: collectionVisibilityEnum("visibility").notNull().default("public"),
  itemCount: integer("item_count").notNull().default(0),
  followerCount: integer("follower_count").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_collections_user_id").on(table.userId),
  index("idx_collections_visibility").on(table.visibility),
]);

export const collectionItemTypeEnum = pgEnum("collection_item_type", ["pack", "prompt"]);

export const collectionItemsTable = pgTable("collection_items", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull(),
  itemType: collectionItemTypeEnum("item_type").notNull().default("pack"),
  itemId: integer("item_id").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_collection_items_collection").on(table.collectionId, table.sortOrder),
]);

export const collectionFollowsTable = pgTable("collection_follows", {
  userId: integer("user_id").notNull(),
  collectionId: integer("collection_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.collectionId] }),
]);

// ============================================================
// PACK COMMENTS
// ============================================================
export const packCommentsTable = pgTable("pack_comments", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id").notNull(),
  userId: integer("user_id").notNull(),
  parentId: integer("parent_id"),
  body: text("body").notNull(),
  upvoteCount: integer("upvote_count").notNull().default(0),
  isFlagged: boolean("is_flagged").notNull().default(false),
  isDeleted: boolean("is_deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_pack_comments_pack_id").on(table.packId, table.createdAt),
  index("idx_pack_comments_parent").on(table.parentId),
]);

export const commentUpvotesTable = pgTable("comment_upvotes", {
  userId: integer("user_id").notNull(),
  commentId: integer("comment_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.commentId] }),
]);

// ============================================================
// PACK APPRECIATIONS
// ============================================================
export const packAppreciationsTable = pgTable("pack_appreciations", {
  userId: integer("user_id").notNull(),
  packId: integer("pack_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.packId] }),
  index("idx_pack_appreciations_pack").on(table.packId),
]);

// ============================================================
// NOTIFICATIONS
// ============================================================
export const notificationTypeEnum = pgEnum("notification_type", [
  "new_follower", "review_posted", "pack_appreciated", "new_comment",
  "comment_reply", "pack_purchase", "new_pack_from_followed", "collection_updated",
  "milestone_reached", "download_ready", "price_drop", "admin_announcement",
  "new_message", "creator_approved", "creator_rejected", "verification_approved"
]);

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  imageUrl: text("image_url"),
  ctaUrl: text("cta_url"),
  ctaLabel: text("cta_label"),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  actorId: integer("actor_id"),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_notifications_user_unread").on(table.userId, table.isRead, table.createdAt),
]);

export const notificationPreferencesTable = pgTable("notification_preferences", {
  userId: integer("user_id").primaryKey(),
  preferences: json("preferences").notNull().default({}),
  digestFrequency: text("digest_frequency").notNull().default("realtime"),
  quietHoursStart: integer("quiet_hours_start"),
  quietHoursEnd: integer("quiet_hours_end"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ============================================================
// PROMPT BOOKMARKS
// ============================================================
export const promptBookmarksTable = pgTable("prompt_bookmarks", {
  userId: integer("user_id").notNull(),
  promptId: integer("prompt_id").notNull(),
  personalRating: smallint("personal_rating"),
  usedCount: integer("used_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.promptId] }),
  index("idx_prompt_bookmarks_user").on(table.userId),
]);

// ============================================================
// CART
// ============================================================
export const cartTable = pgTable("cart", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const cartItemsTable = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").notNull(),
  packId: integer("pack_id").notNull(),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_cart_items_cart").on(table.cartId),
]);

// ============================================================
// GIFT ORDERS
// ============================================================
export const giftOrdersTable = pgTable("gift_orders", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  recipientEmail: text("recipient_email").notNull(),
  senderMessage: text("sender_message"),
  redemptionToken: text("redemption_token").notNull().unique(),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  recipientUserId: integer("recipient_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_gift_orders_token").on(table.redemptionToken),
]);

// ============================================================
// BUNDLE PACK ITEMS
// ============================================================
export const packBundleItemsTable = pgTable("pack_bundle_items", {
  id: serial("id").primaryKey(),
  bundlePackId: integer("bundle_pack_id").notNull(),
  includedPackId: integer("included_pack_id").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [
  index("idx_pack_bundle_items_bundle").on(table.bundlePackId),
]);

// ============================================================
// SALE EVENTS
// ============================================================
export const saleEventsTable = pgTable("sale_events", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id").notNull(),
  salePriceCents: integer("sale_price_cents").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_sale_events_pack").on(table.packId),
  index("idx_sale_events_active").on(table.isActive, table.endsAt),
]);

// ============================================================
// SUBSCRIPTIONS
// ============================================================
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["pro", "teams", "enterprise"]);
export const subscriptionStatusEnum = pgEnum("subscription_status_type", ["active", "cancelled", "past_due", "trialing", "incomplete"]);

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  plan: subscriptionPlanEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const subscriptionCreditsTable = pgTable("subscription_credits", {
  userId: integer("user_id").primaryKey(),
  creditsAvailable: integer("credits_available").notNull().default(0),
  creditsUsed: integer("credits_used").notNull().default(0),
  creditsExpiring: integer("credits_expiring").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastRefreshedAt: timestamp("last_refreshed_at", { withTimezone: true }),
});

// ============================================================
// TEAM WORKSPACES
// ============================================================
export const teamMemberRoleEnum = pgEnum("team_member_role", ["admin", "member"]);

export const teamWorkspacesTable = pgTable("team_workspaces", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  name: text("name").notNull(),
  seatCount: integer("seat_count").notNull().default(5),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teamMembersTable = pgTable("team_members", {
  workspaceId: integer("workspace_id").notNull(),
  userId: integer("user_id").notNull(),
  role: teamMemberRoleEnum("role").notNull().default("member"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.workspaceId, table.userId] }),
]);

// ============================================================
// REFERRALS
// ============================================================
export const referralStatusEnum = pgEnum("referral_status", ["pending", "converted", "expired"]);

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(),
  referredUserId: integer("referred_user_id"),
  code: text("code").notNull().unique(),
  clickCount: integer("click_count").notNull().default(0),
  status: referralStatusEnum("status").notNull().default("pending"),
  creditAwardedCents: integer("credit_awarded_cents").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_referrals_code").on(table.code),
  index("idx_referrals_referrer").on(table.referrerId),
]);

// ============================================================
// AFFILIATE PROGRAM
// ============================================================
export const affiliateProgramStatusEnum = pgEnum("affiliate_program_status", ["pending", "approved", "rejected", "suspended"]);

export const affiliateProgramsTable = pgTable("affiliate_programs", {
  userId: integer("user_id").primaryKey(),
  status: affiliateProgramStatusEnum("status").notNull().default("pending"),
  commissionRate: real("commission_rate").notNull().default(0.20),
  stripeConnectId: text("stripe_connect_id"),
  referralCode: text("referral_code").notNull().unique(),
  totalEarningsCents: integer("total_earnings_cents").notNull().default(0),
  pendingPayoutCents: integer("pending_payout_cents").notNull().default(0),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

export const affiliateConversionsTable = pgTable("affiliate_conversions", {
  id: serial("id").primaryKey(),
  affiliateUserId: integer("affiliate_user_id").notNull(),
  convertedUserId: integer("converted_user_id").notNull(),
  orderId: integer("order_id").notNull(),
  commissionCents: integer("commission_cents").notNull(),
  status: text("status").notNull().default("pending"),
  cookieSetAt: timestamp("cookie_set_at", { withTimezone: true }),
  convertedAt: timestamp("converted_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_affiliate_conversions_affiliate").on(table.affiliateUserId),
]);

// ============================================================
// USER RECOMMENDATIONS
// ============================================================
export const userRecommendationsTable = pgTable("user_recommendations", {
  userId: integer("user_id").notNull(),
  packId: integer("pack_id").notNull(),
  score: real("score").notNull().default(0),
  reason: text("reason"),
  computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.packId] }),
  index("idx_user_recommendations_user").on(table.userId, table.score),
]);

// ============================================================
// USER ACTIVITY (for activity feed)
// ============================================================
export const userActivityTypeEnum = pgEnum("user_activity_type", [
  "pack_published", "pack_updated", "review_posted", "milestone_reached",
  "new_follower", "collection_created", "collection_updated"
]);

export const userActivityTable = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  activityType: userActivityTypeEnum("activity_type").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  metadata: json("metadata"),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_user_activity_user").on(table.userId, table.createdAt),
  index("idx_user_activity_public").on(table.isPublic, table.createdAt),
]);

// ============================================================
// COMMUNITY PROMPTS
// ============================================================
export const communityPromptStatusEnum = pgEnum("community_prompt_status", ["pending", "approved", "featured", "removed"]);

export const communityPromptsTable = pgTable("community_prompts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  body: text("body").notNull(),
  title: text("title"),
  aiTool: text("ai_tool"),
  category: text("category"),
  upvoteCount: integer("upvote_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  status: communityPromptStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_community_prompts_status").on(table.status, table.upvoteCount),
]);

export const communityPromptVotesTable = pgTable("community_prompt_votes", {
  userId: integer("user_id").notNull(),
  promptId: integer("prompt_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.promptId] }),
]);

// ============================================================
// SUPPORT TICKETS
// ============================================================
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "resolved", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "normal", "high", "urgent"]);

export const supportTicketsTable = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  status: ticketStatusEnum("status").notNull().default("open"),
  priority: ticketPriorityEnum("priority").notNull().default("normal"),
  assignedTo: integer("assigned_to"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_support_tickets_status").on(table.status, table.priority),
]);

export const ticketMessagesTable = pgTable("ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  authorId: integer("author_id"),
  body: text("body").notNull(),
  isInternal: boolean("is_internal").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_ticket_messages_ticket").on(table.ticketId),
]);

// ============================================================
// API KEYS (Developer Platform)
// ============================================================
export const apiKeysTable = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  keyPrefix: text("key_prefix").notNull(),
  name: text("name").notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  requestCount: integer("request_count").notNull().default(0),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_api_keys_user").on(table.userId),
  index("idx_api_keys_hash").on(table.keyHash),
]);

// ============================================================
// A/B EXPERIMENTS
// ============================================================
export const experimentStatusEnum = pgEnum("experiment_status", ["draft", "running", "paused", "completed"]);

export const experimentsTable = pgTable("experiments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hypothesis: text("hypothesis"),
  variants: json("variants").notNull().default([]),
  trafficSplit: real("traffic_split").notNull().default(0.5),
  metric: text("metric").notNull().default("conversion_rate"),
  status: experimentStatusEnum("status").notNull().default("draft"),
  startAt: timestamp("start_at", { withTimezone: true }),
  endAt: timestamp("end_at", { withTimezone: true }),
  winnerId: text("winner_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const experimentAssignmentsTable = pgTable("experiment_assignments", {
  userId: integer("user_id").notNull(),
  experimentId: integer("experiment_id").notNull(),
  variantId: text("variant_id").notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.experimentId] }),
]);

// ============================================================
// REDIRECT RULES (SEO)
// ============================================================
export const redirectRulesTable = pgTable("redirect_rules", {
  id: serial("id").primaryKey(),
  fromPath: text("from_path").notNull().unique(),
  toPath: text("to_path").notNull(),
  statusCode: integer("status_code").notNull().default(301),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// CREATOR AGREEMENTS
// ============================================================
export const creatorAgreementsTable = pgTable("creator_agreements", {
  userId: integer("user_id").primaryKey(),
  agreedAt: timestamp("agreed_at", { withTimezone: true }).notNull().defaultNow(),
  version: text("version").notNull().default("1.0"),
  commissionRate: real("commission_rate").notNull().default(0.70),
});

// ============================================================
// CREATOR APPLICATIONS
// ============================================================
export const creatorApplicationStatusEnum = pgEnum("creator_application_status", [
  "pending", "approved", "rejected", "more_info_requested"
]);

export const creatorApplicationsTable = pgTable("creator_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  bio: text("bio"),
  specialties: json("specialties").notNull().default([]),
  stripeConnectId: text("stripe_connect_id"),
  status: creatorApplicationStatusEnum("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_creator_applications_status").on(table.status),
]);

// ============================================================
// DIRECT MESSAGES
// ============================================================
export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  participant1Id: integer("participant1_id").notNull(),
  participant2Id: integer("participant2_id").notNull(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  participant1Unread: integer("participant1_unread").notNull().default(0),
  participant2Unread: integer("participant2_unread").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_conversations_p1").on(table.participant1Id),
  index("idx_conversations_p2").on(table.participant2Id),
]);

export const directMessagesTable = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderId: integer("sender_id").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_direct_messages_conversation").on(table.conversationId, table.createdAt),
]);

// ============================================================
// FEATURE FLAGS
// ============================================================
export const featureFlagsTable = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  description: text("description"),
  changedBy: integer("changed_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ============================================================
// CONTENT REPORTS
// ============================================================
export const contentReportEntityEnum = pgEnum("content_report_entity", ["pack", "prompt", "comment", "user", "collection"]);
export const contentReportStatusEnum = pgEnum("content_report_status", ["pending", "reviewed", "actioned", "dismissed"]);

export const contentReportsTable = pgTable("content_reports", {
  id: serial("id").primaryKey(),
  reporterId: integer("reporter_id").notNull(),
  entityType: contentReportEntityEnum("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  reason: text("reason").notNull(),
  details: text("details"),
  status: contentReportStatusEnum("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_content_reports_status").on(table.status, table.createdAt),
  index("idx_content_reports_entity").on(table.entityType, table.entityId),
]);

// ============================================================
// PACK APPEALS
// ============================================================
export const packAppealStatusEnum = pgEnum("pack_appeal_status", ["pending", "approved", "rejected"]);

export const packAppealsTable = pgTable("pack_appeals", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id").notNull(),
  creatorId: integer("creator_id").notNull(),
  reason: text("reason").notNull(),
  status: packAppealStatusEnum("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_pack_appeals_status").on(table.status),
  index("idx_pack_appeals_pack").on(table.packId),
]);

// ============================================================
// TRUST SCORES
// ============================================================
export const trustScoresTable = pgTable("trust_scores", {
  userId: integer("user_id").primaryKey(),
  score: integer("score").notNull().default(50),
  lastComputedAt: timestamp("last_computed_at", { withTimezone: true }).notNull().defaultNow(),
  factors: json("factors"),
});

// ============================================================
// AUDIT LOGS
// ============================================================
export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  before: json("before"),
  after: json("after"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_audit_logs_admin").on(table.adminId, table.createdAt),
  index("idx_audit_logs_entity").on(table.entityType, table.entityId),
]);

// ============================================================
// SAVED SEARCHES
// ============================================================
export const savedSearchesTable = pgTable("saved_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  query: text("query").notNull(),
  filters: json("filters"),
  isSubscribed: boolean("is_subscribed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_saved_searches_user").on(table.userId),
]);

// ============================================================
// EXPORTS
// ============================================================
export const insertCollectionSchema = createInsertSchema(collectionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collectionsTable.$inferSelect;

export const insertPackCommentSchema = createInsertSchema(packCommentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPackComment = z.infer<typeof insertPackCommentSchema>;
export type PackComment = typeof packCommentsTable.$inferSelect;

export const insertNotificationSchema = createInsertSchema(notificationsTable).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;

export const insertSupportTicketSchema = createInsertSchema(supportTicketsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTicketsTable.$inferSelect;

// Custom vector type for pgvector
import { customType } from "drizzle-orm/pg-core";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value.replace(/\[|\]/g, '').split(',').map(Number);
  },
});

export const packEmbeddingsTable = pgTable("pack_embeddings", {
  packId: integer("pack_id").primaryKey().references(() => packsTable.id, { onDelete: "cascade" }),
  embedding: vector("embedding"),
  model: text("model").notNull().default("text-embedding-3-small"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
