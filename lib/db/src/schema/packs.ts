import { pgTable, text, serial, timestamp, integer, boolean, real, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";

export const packStatusEnum = pgEnum("pack_status", [
  "DRAFT", "AI_GENERATED", "PENDING_REVIEW", "APPROVED", "REJECTED", "PUBLISHED", "ARCHIVED"
]);

export const packTypeEnum = pgEnum("pack_type", ["single", "bundle"]);

export const packsTable = pgTable("packs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  categoryId: integer("category_id").notNull(),
  status: packStatusEnum("status").notNull().default("DRAFT"),
  aiToolTargets: text("ai_tool_targets").array().notNull().default([]),
  promptCount: integer("prompt_count").notNull().default(0),
  priceCents: integer("price_cents").notNull().default(0),
  comparePriceCents: integer("compare_price_cents"),
  isFree: boolean("is_free").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  isBestseller: boolean("is_bestseller").notNull().default(false),
  thumbnailUrl: text("thumbnail_url"),
  previewImageUrl: text("preview_image_url"),
  tags: text("tags").array().notNull().default([]),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  totalDownloads: integer("total_downloads").notNull().default(0),
  totalRevenueCents: integer("total_revenue_cents").notNull().default(0),
  avgRating: real("avg_rating"),
  reviewCount: integer("review_count").notNull().default(0),
  version: integer("version").notNull().default(1),
  aiGenerationId: integer("ai_generation_id"),
  moderatedBy: integer("moderated_by"),
  moderatedAt: timestamp("moderated_at", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  // Phase 2 fields
  creatorId: integer("creator_id"),
  packType: packTypeEnum("pack_type").notNull().default("single"),
  licenseType: text("license_type").notNull().default("personal"),
  viewCount: integer("view_count").notNull().default(0),
  appreciationCount: integer("appreciation_count").notNull().default(0),
  saleEventId: integer("sale_event_id"),
  salePriceCents: integer("sale_price_cents"),
  language: text("language").notNull().default("en"),
  qualityScore: integer("quality_score"),
}, (table) => [
  index("idx_packs_status_published").on(table.status, table.publishedAt),
  index("idx_packs_category_status").on(table.categoryId, table.status),
  index("idx_packs_featured").on(table.isFeatured, table.status),
  index("idx_packs_slug").on(table.slug),
  index("idx_packs_downloads").on(table.totalDownloads),
]);

export const insertPackSchema = createInsertSchema(packsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPack = z.infer<typeof insertPackSchema>;
export type Pack = typeof packsTable.$inferSelect;
