import { pgTable, serial, text, timestamp, integer, boolean, json, primaryKey, pgEnum, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { packsTable } from "./packs";

// We need pgvector extension imported
import { customType } from "drizzle-orm/pg-core";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)';
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
});

export const packEmbeddingsTable = pgTable("pack_embeddings", {
  id: serial("id").primaryKey(),
  packId: integer("pack_id").notNull().references(() => packsTable.id, { onDelete: "cascade" }),
  embedding: vector("embedding"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
