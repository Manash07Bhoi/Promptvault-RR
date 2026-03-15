import { pgTable, text, serial, timestamp, pgEnum, json, boolean, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["BUYER", "CREATOR", "ADMIN", "SUPER_ADMIN"]);
export const userStatusEnum = pgEnum("user_status", ["ACTIVE", "SUSPENDED", "PENDING", "DELETED"]);
export const profileVisibilityEnum = pgEnum("profile_visibility", ["public", "private", "followers_only"]);
export const userSubscriptionPlanEnum = pgEnum("user_subscription_plan", ["free", "pro", "teams", "enterprise"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("BUYER"),
  status: userStatusEnum("status").notNull().default("PENDING"),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  stripeCustomerId: text("stripe_customer_id"),
  preferences: json("preferences"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpiresAt: timestamp("reset_password_expires_at", { withTimezone: true }),
  emailVerificationToken: text("email_verification_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  // Phase 2 fields
  username: text("username").unique(),
  coverImageUrl: text("cover_image_url"),
  location: text("location"),
  websiteUrl: text("website_url"),
  twitterHandle: text("twitter_handle"),
  linkedinUrl: text("linkedin_url"),
  githubHandle: text("github_handle"),
  youtubeUrl: text("youtube_url"),
  specialties: text("specialties").array().notNull().default([]),
  isCreator: boolean("is_creator").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  totalDownloadsAllPacks: integer("total_downloads_all_packs").notNull().default(0),
  publicPackCount: integer("public_pack_count").notNull().default(0),
  followerCount: integer("follower_count").notNull().default(0),
  followingCount: integer("following_count").notNull().default(0),
  profileVisibility: profileVisibilityEnum("profile_visibility").notNull().default("public"),
  creditBalanceCents: integer("credit_balance_cents").notNull().default(0),
  trustScore: integer("trust_score").notNull().default(50),
  referralCode: text("referral_code").unique(),
  subscriptionPlan: userSubscriptionPlanEnum("subscription_plan").notNull().default("free"),
  stripeConnectId: text("stripe_connect_id"),
  commissionRate: integer("commission_rate").notNull().default(70),
  usernameChangedAt: timestamp("username_changed_at", { withTimezone: true }),
  verificationRequestedAt: timestamp("verification_requested_at", { withTimezone: true }),
}, (table) => [
  index("idx_users_username").on(table.username),
  index("idx_users_referral_code").on(table.referralCode),
]);

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
