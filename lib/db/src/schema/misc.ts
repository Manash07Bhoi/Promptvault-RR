import { pgTable, serial, text, timestamp, integer, boolean, json, real, primaryKey, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Generated files
export const fileTypeEnum = pgEnum("file_type", ["PDF", "ZIP", "THUMBNAIL", "PREVIEW_IMAGE"]);
export const fileStatusEnum = pgEnum("file_status", ["QUEUED", "GENERATING", "READY", "FAILED"]);

export const generatedFilesTable = pgTable("generated_files", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id").notNull(),
  fileType: fileTypeEnum("file_type").notNull(),
  status: fileStatusEnum("status").notNull().default("QUEUED"),
  storageKey: text("storage_key"),
  publicUrl: text("public_url"),
  fileSizeBytes: integer("file_size_bytes"),
  checksumSha256: text("checksum_sha256"),
  generationStartedAt: timestamp("generation_started_at", { withTimezone: true }),
  generationCompletedAt: timestamp("generation_completed_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_generated_files_pack_id").on(table.packId),
]);

// Coupons
export const discountTypeEnum = pgEnum("discount_type", ["PERCENT", "FIXED"]);

export const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: real("discount_value").notNull(),
  minOrderCents: integer("min_order_cents"),
  maxUses: integer("max_uses"),
  usesCount: integer("uses_count").notNull().default(0),
  validFrom: timestamp("valid_from", { withTimezone: true }),
  validUntil: timestamp("valid_until", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Analytics events
export const analyticsEventsTable = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(),
  userId: integer("user_id"),
  sessionId: text("session_id"),
  packId: integer("pack_id"),
  properties: json("properties"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_analytics_pack_created").on(table.packId, table.createdAt),
]);

// Moderation logs
export const moderationActionEnum = pgEnum("moderation_action", ["APPROVE", "REJECT", "FLAG", "EDIT_AND_APPROVE"]);

export const moderationLogsTable = pgTable("moderation_logs", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  action: moderationActionEnum("action").notNull(),
  adminId: integer("admin_id").notNull(),
  notes: text("notes"),
  beforeStatus: text("before_status"),
  afterStatus: text("after_status"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_moderation_logs_entity").on(table.entityType, table.entityId),
]);

// Saved packs (wishlist)
export const savedPacksTable = pgTable("saved_packs", {
  userId: integer("user_id").notNull(),
  packId: integer("pack_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.packId] }),
  index("idx_saved_packs_user").on(table.userId),
]);

// Tags
export const tagsTable = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  usageCount: integer("usage_count").notNull().default(0),
});

// System settings
export const systemSettingsTable = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: json("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// Prompt versions
export const promptVersionsTable = pgTable("prompt_versions", {
  id: serial("id").primaryKey(),
  promptId: integer("prompt_id").notNull(),
  version: integer("version").notNull(),
  body: text("body").notNull(),
  changedBy: integer("changed_by"),
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_prompt_versions_prompt_id").on(table.promptId),
]);

// Newsletter subscribers
export const newsletterSubscribersTable = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  isActive: boolean("is_active").notNull().default(true),
  unsubscribeToken: text("unsubscribe_token").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_newsletter_email").on(table.email),
]);

export const insertCouponSchema = createInsertSchema(couponsTable).omit({ id: true, createdAt: true });
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof couponsTable.$inferSelect;

export const insertGeneratedFileSchema = createInsertSchema(generatedFilesTable).omit({ id: true, createdAt: true });
export type InsertGeneratedFile = z.infer<typeof insertGeneratedFileSchema>;
export type GeneratedFile = typeof generatedFilesTable.$inferSelect;
