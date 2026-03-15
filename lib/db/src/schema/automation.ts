import { pgTable, serial, text, timestamp, integer, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobTypeEnum = pgEnum("job_type", [
  "GENERATE_PROMPTS", "GENERATE_PACK", "GENERATE_PDF", "GENERATE_ZIP",
  "GENERATE_IMAGE", "CREATE_LISTING", "SEND_EMAIL"
]);

export const jobStatusEnum = pgEnum("job_status", [
  "PENDING", "RUNNING", "COMPLETED", "FAILED", "RETRYING", "DEAD"
]);

export const automationJobsTable = pgTable("automation_jobs", {
  id: serial("id").primaryKey(),
  jobType: jobTypeEnum("job_type").notNull(),
  status: jobStatusEnum("status").notNull().default("PENDING"),
  priority: integer("priority").notNull().default(0),
  payload: json("payload").notNull().default({}),
  result: json("result"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  relatedPackId: integer("related_pack_id"),
  triggeredBy: text("triggered_by"),
  bullJobId: text("bull_job_id"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  durationMs: integer("duration_ms"),
  aiTokensUsed: integer("ai_tokens_used"),
  aiCostUsdCents: integer("ai_cost_usd_cents"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertJobSchema = createInsertSchema(automationJobsTable).omit({ id: true, createdAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type AutomationJob = typeof automationJobsTable.$inferSelect;
