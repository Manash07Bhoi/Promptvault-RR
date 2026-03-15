import { pgTable, serial, timestamp, integer, text, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id").notNull(),
  userId: integer("user_id").notNull(),
  orderId: integer("order_id"),
  rating: integer("rating").notNull(),
  title: text("title"),
  body: text("body"),
  isVerified: boolean("is_verified").notNull().default(false),
  isFlagged: boolean("is_flagged").notNull().default(false),
  helpfulCount: integer("helpful_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("idx_reviews_pack_id").on(table.packId, table.createdAt),
  index("idx_reviews_user_id").on(table.userId),
]);

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
