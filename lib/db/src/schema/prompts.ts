import { pgTable, text, serial, timestamp, integer, json, pgEnum, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const promptStatusEnum = pgEnum("prompt_status", ["DRAFT", "GENERATED", "APPROVED", "REJECTED", "ARCHIVED"]);

export const promptsTable = pgTable("prompts", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  description: text("description"),
  aiTool: text("ai_tool"),
  status: promptStatusEnum("status").notNull().default("DRAFT"),
  useCase: text("use_case"),
  variables: json("variables"),
  exampleOutput: text("example_output"),
  sortOrder: integer("sort_order").notNull().default(0),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  // Phase 2 fields
  bookmarkCount: integer("bookmark_count").notNull().default(0),
  usageCount: integer("usage_count").notNull().default(0),
}, (table) => [
  index("idx_prompts_pack_id").on(table.packId, table.sortOrder),
]);

export const insertPromptSchema = createInsertSchema(promptsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPrompt = z.infer<typeof insertPromptSchema>;
export type Prompt = typeof promptsTable.$inferSelect;
