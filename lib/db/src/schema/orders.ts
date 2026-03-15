import { pgTable, text, serial, timestamp, integer, boolean, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const orderStatusEnum = pgEnum("order_status", ["PENDING", "COMPLETED", "FAILED", "REFUNDED", "DISPUTED"]);

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  subtotalCents: integer("subtotal_cents").notNull().default(0),
  discountCents: integer("discount_cents").notNull().default(0),
  taxCents: integer("tax_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  currency: text("currency").notNull().default("usd"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeSessionId: text("stripe_session_id"),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  refundReason: text("refund_reason"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  // Phase 2 fields
  giftOrderId: integer("gift_order_id"),
  isGift: boolean("is_gift").notNull().default(false),
  creditAppliedCents: integer("credit_applied_cents").notNull().default(0),
  affiliateConversionId: integer("affiliate_conversion_id"),
}, (table) => [
  index("idx_orders_user_id").on(table.userId, table.createdAt),
  index("idx_orders_status").on(table.status),
  index("idx_orders_stripe_session").on(table.stripeSessionId),
]);

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  packId: integer("pack_id").notNull(),
  priceCents: integer("price_cents").notNull(),
  titleSnapshot: text("title_snapshot").notNull(),
  downloadCount: integer("download_count").notNull().default(0),
  firstDownloadedAt: timestamp("first_downloaded_at", { withTimezone: true }),
}, (table) => [
  index("idx_order_items_order_id").on(table.orderId),
  index("idx_order_items_pack_id").on(table.packId),
]);

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

export const insertOrderItemSchema = createInsertSchema(orderItemsTable).omit({ id: true });
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItemsTable.$inferSelect;
