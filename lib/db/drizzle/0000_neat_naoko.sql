CREATE TYPE "public"."profile_visibility" AS ENUM('public', 'private', 'followers_only');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('BUYER', 'CREATOR', 'ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'SUSPENDED', 'PENDING', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."user_subscription_plan" AS ENUM('free', 'pro', 'teams', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."pack_status" AS ENUM('DRAFT', 'AI_GENERATED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."pack_type" AS ENUM('single', 'bundle');--> statement-breakpoint
CREATE TYPE "public"."prompt_status" AS ENUM('DRAFT', 'GENERATED', 'APPROVED', 'REJECTED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'DISPUTED');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'DEAD');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('GENERATE_PROMPTS', 'GENERATE_PACK', 'GENERATE_PDF', 'GENERATE_ZIP', 'GENERATE_IMAGE', 'CREATE_LISTING', 'SEND_EMAIL');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('PERCENT', 'FIXED');--> statement-breakpoint
CREATE TYPE "public"."file_status" AS ENUM('QUEUED', 'GENERATING', 'READY', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('PDF', 'ZIP', 'THUMBNAIL', 'PREVIEW_IMAGE');--> statement-breakpoint
CREATE TYPE "public"."moderation_action" AS ENUM('APPROVE', 'REJECT', 'FLAG', 'EDIT_AND_APPROVE');--> statement-breakpoint
CREATE TYPE "public"."affiliate_program_status" AS ENUM('pending', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."collection_item_type" AS ENUM('pack', 'prompt');--> statement-breakpoint
CREATE TYPE "public"."collection_visibility" AS ENUM('public', 'private', 'followers');--> statement-breakpoint
CREATE TYPE "public"."community_prompt_status" AS ENUM('pending', 'approved', 'featured', 'removed');--> statement-breakpoint
CREATE TYPE "public"."content_report_entity" AS ENUM('pack', 'prompt', 'comment', 'user', 'collection');--> statement-breakpoint
CREATE TYPE "public"."content_report_status" AS ENUM('pending', 'reviewed', 'actioned', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."creator_application_status" AS ENUM('pending', 'approved', 'rejected', 'more_info_requested');--> statement-breakpoint
CREATE TYPE "public"."experiment_status" AS ENUM('draft', 'running', 'paused', 'completed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('new_follower', 'review_posted', 'pack_appreciated', 'new_comment', 'comment_reply', 'pack_purchase', 'new_pack_from_followed', 'collection_updated', 'milestone_reached', 'download_ready', 'price_drop', 'admin_announcement', 'new_message', 'creator_approved', 'creator_rejected', 'verification_approved');--> statement-breakpoint
CREATE TYPE "public"."pack_appeal_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'converted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('pro', 'teams', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."subscription_status_type" AS ENUM('active', 'cancelled', 'past_due', 'trialing', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."ticket_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."user_activity_type" AS ENUM('pack_published', 'pack_updated', 'review_posted', 'milestone_reached', 'new_follower', 'collection_created', 'collection_updated');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified_at" timestamp with time zone,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'BUYER' NOT NULL,
	"status" "user_status" DEFAULT 'PENDING' NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"bio" text,
	"stripe_customer_id" text,
	"preferences" json,
	"last_login_at" timestamp with time zone,
	"reset_password_token" text,
	"reset_password_expires_at" timestamp with time zone,
	"email_verification_token" text,
	"refresh_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"username" text,
	"cover_image_url" text,
	"location" text,
	"website_url" text,
	"twitter_handle" text,
	"linkedin_url" text,
	"github_handle" text,
	"youtube_url" text,
	"specialties" text[] DEFAULT '{}' NOT NULL,
	"is_creator" boolean DEFAULT false NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"total_downloads_all_packs" integer DEFAULT 0 NOT NULL,
	"public_pack_count" integer DEFAULT 0 NOT NULL,
	"follower_count" integer DEFAULT 0 NOT NULL,
	"following_count" integer DEFAULT 0 NOT NULL,
	"profile_visibility" "profile_visibility" DEFAULT 'public' NOT NULL,
	"credit_balance_cents" integer DEFAULT 0 NOT NULL,
	"trust_score" integer DEFAULT 50 NOT NULL,
	"referral_code" text,
	"subscription_plan" "user_subscription_plan" DEFAULT 'free' NOT NULL,
	"stripe_connect_id" text,
	"commission_rate" integer DEFAULT 70 NOT NULL,
	"username_changed_at" timestamp with time zone,
	"verification_requested_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"parent_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"pack_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "packs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"short_description" text,
	"category_id" integer NOT NULL,
	"status" "pack_status" DEFAULT 'DRAFT' NOT NULL,
	"ai_tool_targets" text[] DEFAULT '{}' NOT NULL,
	"prompt_count" integer DEFAULT 0 NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"compare_price_cents" integer,
	"is_free" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_bestseller" boolean DEFAULT false NOT NULL,
	"thumbnail_url" text,
	"preview_image_url" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"total_downloads" integer DEFAULT 0 NOT NULL,
	"total_revenue_cents" integer DEFAULT 0 NOT NULL,
	"avg_rating" real,
	"review_count" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"ai_generation_id" integer,
	"moderated_by" integer,
	"moderated_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"creator_id" integer,
	"pack_type" "pack_type" DEFAULT 'single' NOT NULL,
	"license_type" text DEFAULT 'personal' NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"appreciation_count" integer DEFAULT 0 NOT NULL,
	"sale_event_id" integer,
	"sale_price_cents" integer,
	"language" text DEFAULT 'en' NOT NULL,
	"quality_score" integer,
	CONSTRAINT "packs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"pack_id" integer NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"description" text,
	"ai_tool" text,
	"status" "prompt_status" DEFAULT 'DRAFT' NOT NULL,
	"use_case" text,
	"variables" json,
	"example_output" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"bookmark_count" integer DEFAULT 0 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"pack_id" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"title_snapshot" text NOT NULL,
	"download_count" integer DEFAULT 0 NOT NULL,
	"first_downloaded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_session_id" text,
	"refunded_at" timestamp with time zone,
	"refund_reason" text,
	"completed_at" timestamp with time zone,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"gift_order_id" integer,
	"is_gift" boolean DEFAULT false NOT NULL,
	"credit_applied_cents" integer DEFAULT 0 NOT NULL,
	"affiliate_conversion_id" integer
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"pack_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"order_id" integer,
	"rating" integer NOT NULL,
	"title" text,
	"body" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_type" "job_type" NOT NULL,
	"status" "job_status" DEFAULT 'PENDING' NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"payload" json DEFAULT '{}'::json NOT NULL,
	"result" json,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"related_pack_id" integer,
	"triggered_by" text,
	"bull_job_id" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"duration_ms" integer,
	"ai_tokens_used" integer,
	"ai_cost_usd_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"user_id" integer,
	"session_id" text,
	"pack_id" integer,
	"properties" json,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" real NOT NULL,
	"min_order_cents" integer,
	"max_uses" integer,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "generated_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"pack_id" integer NOT NULL,
	"file_type" "file_type" NOT NULL,
	"status" "file_status" DEFAULT 'QUEUED' NOT NULL,
	"storage_key" text,
	"public_url" text,
	"file_size_bytes" integer,
	"checksum_sha256" text,
	"generation_started_at" timestamp with time zone,
	"generation_completed_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"action" "moderation_action" NOT NULL,
	"admin_id" integer NOT NULL,
	"notes" text,
	"before_status" text,
	"after_status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "prompt_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt_id" integer NOT NULL,
	"version" integer NOT NULL,
	"body" text NOT NULL,
	"changed_by" integer,
	"change_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_packs" (
	"user_id" integer NOT NULL,
	"pack_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_packs_user_id_pack_id_pk" PRIMARY KEY("user_id","pack_id")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" json,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "affiliate_conversions" (
	"id" serial PRIMARY KEY NOT NULL,
	"affiliate_user_id" integer NOT NULL,
	"converted_user_id" integer NOT NULL,
	"order_id" integer NOT NULL,
	"commission_cents" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"cookie_set_at" timestamp with time zone,
	"converted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_programs" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"status" "affiliate_program_status" DEFAULT 'pending' NOT NULL,
	"commission_rate" real DEFAULT 0.2 NOT NULL,
	"stripe_connect_id" text,
	"referral_code" text NOT NULL,
	"total_earnings_cents" integer DEFAULT 0 NOT NULL,
	"pending_payout_cents" integer DEFAULT 0 NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_at" timestamp with time zone,
	CONSTRAINT "affiliate_programs_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"name" text NOT NULL,
	"last_used_at" timestamp with time zone,
	"request_count" integer DEFAULT 0 NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" integer,
	"before" json,
	"after" json,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"cart_id" integer NOT NULL,
	"pack_id" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "collection_follows" (
	"user_id" integer NOT NULL,
	"collection_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_follows_user_id_collection_id_pk" PRIMARY KEY("user_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "collection_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"collection_id" integer NOT NULL,
	"item_type" "collection_item_type" DEFAULT 'pack' NOT NULL,
	"item_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"cover_image_url" text,
	"visibility" "collection_visibility" DEFAULT 'public' NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"follower_count" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment_upvotes" (
	"user_id" integer NOT NULL,
	"comment_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comment_upvotes_user_id_comment_id_pk" PRIMARY KEY("user_id","comment_id")
);
--> statement-breakpoint
CREATE TABLE "community_prompt_votes" (
	"user_id" integer NOT NULL,
	"prompt_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "community_prompt_votes_user_id_prompt_id_pk" PRIMARY KEY("user_id","prompt_id")
);
--> statement-breakpoint
CREATE TABLE "community_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"body" text NOT NULL,
	"title" text,
	"ai_tool" text,
	"category" text,
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"status" "community_prompt_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" integer NOT NULL,
	"entity_type" "content_report_entity" NOT NULL,
	"entity_id" integer NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"status" "content_report_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"participant1_id" integer NOT NULL,
	"participant2_id" integer NOT NULL,
	"last_message_at" timestamp with time zone,
	"participant1_unread" integer DEFAULT 0 NOT NULL,
	"participant2_unread" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_agreements" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"agreed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" text DEFAULT '1.0' NOT NULL,
	"commission_rate" real DEFAULT 0.7 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"bio" text,
	"specialties" json DEFAULT '[]'::json NOT NULL,
	"stripe_connect_id" text,
	"status" "creator_application_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creator_applications_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "direct_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"body" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiment_assignments" (
	"user_id" integer NOT NULL,
	"experiment_id" integer NOT NULL,
	"variant_id" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "experiment_assignments_user_id_experiment_id_pk" PRIMARY KEY("user_id","experiment_id")
);
--> statement-breakpoint
CREATE TABLE "experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hypothesis" text,
	"variants" json DEFAULT '[]'::json NOT NULL,
	"traffic_split" real DEFAULT 0.5 NOT NULL,
	"metric" text DEFAULT 'conversion_rate' NOT NULL,
	"status" "experiment_status" DEFAULT 'draft' NOT NULL,
	"start_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	"winner_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"key" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"description" text,
	"changed_by" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gift_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"recipient_email" text NOT NULL,
	"sender_message" text,
	"redemption_token" text NOT NULL,
	"scheduled_for" timestamp with time zone,
	"redeemed_at" timestamp with time zone,
	"recipient_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_orders_redemption_token_unique" UNIQUE("redemption_token")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"preferences" json DEFAULT '{}'::json NOT NULL,
	"digest_frequency" text DEFAULT 'realtime' NOT NULL,
	"quiet_hours_start" integer,
	"quiet_hours_end" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"image_url" text,
	"cta_url" text,
	"cta_label" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"actor_id" integer,
	"entity_type" text,
	"entity_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pack_appeals" (
	"id" serial PRIMARY KEY NOT NULL,
	"pack_id" integer NOT NULL,
	"creator_id" integer NOT NULL,
	"reason" text NOT NULL,
	"status" "pack_appeal_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pack_appreciations" (
	"user_id" integer NOT NULL,
	"pack_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pack_appreciations_user_id_pack_id_pk" PRIMARY KEY("user_id","pack_id")
);
--> statement-breakpoint
CREATE TABLE "pack_bundle_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"bundle_pack_id" integer NOT NULL,
	"included_pack_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pack_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"pack_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"parent_id" integer,
	"body" text NOT NULL,
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"is_flagged" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_bookmarks" (
	"user_id" integer NOT NULL,
	"prompt_id" integer NOT NULL,
	"personal_rating" smallint,
	"used_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prompt_bookmarks_user_id_prompt_id_pk" PRIMARY KEY("user_id","prompt_id")
);
--> statement-breakpoint
CREATE TABLE "redirect_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"status_code" integer DEFAULT 301 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redirect_rules_from_path_unique" UNIQUE("from_path")
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_id" integer NOT NULL,
	"referred_user_id" integer,
	"code" text NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"status" "referral_status" DEFAULT 'pending' NOT NULL,
	"credit_awarded_cents" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "sale_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"pack_id" integer NOT NULL,
	"sale_price_cents" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"query" text NOT NULL,
	"filters" json,
	"is_subscribed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_credits" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"credits_available" integer DEFAULT 0 NOT NULL,
	"credits_used" integer DEFAULT 0 NOT NULL,
	"credits_expiring" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"last_refreshed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"plan" "subscription_plan" NOT NULL,
	"status" "subscription_status_type" NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"status" "ticket_status" DEFAULT 'open' NOT NULL,
	"priority" "ticket_priority" DEFAULT 'normal' NOT NULL,
	"assigned_to" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"workspace_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" "team_member_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_workspace_id_user_id_pk" PRIMARY KEY("workspace_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "team_workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"name" text NOT NULL,
	"seat_count" integer DEFAULT 5 NOT NULL,
	"stripe_subscription_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"author_id" integer,
	"body" text NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trust_scores" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"score" integer DEFAULT 50 NOT NULL,
	"last_computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"factors" json
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"activity_type" "user_activity_type" NOT NULL,
	"entity_type" text,
	"entity_id" integer,
	"metadata" json,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_follows" (
	"follower_id" integer NOT NULL,
	"following_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "user_recommendations" (
	"user_id" integer NOT NULL,
	"pack_id" integer NOT NULL,
	"score" real DEFAULT 0 NOT NULL,
	"reason" text,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_recommendations_user_id_pack_id_pk" PRIMARY KEY("user_id","pack_id")
);
--> statement-breakpoint
CREATE TABLE "pack_embeddings" (
	"pack_id" integer PRIMARY KEY NOT NULL,
	"embedding" vector(1536),
	"model" text DEFAULT 'text-embedding-3-small' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pack_embeddings" ADD CONSTRAINT "pack_embeddings_pack_id_packs_id_fk" FOREIGN KEY ("pack_id") REFERENCES "public"."packs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_username" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_users_referral_code" ON "users" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "idx_packs_status_published" ON "packs" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "idx_packs_category_status" ON "packs" USING btree ("category_id","status");--> statement-breakpoint
CREATE INDEX "idx_packs_featured" ON "packs" USING btree ("is_featured","status");--> statement-breakpoint
CREATE INDEX "idx_packs_slug" ON "packs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_packs_downloads" ON "packs" USING btree ("total_downloads");--> statement-breakpoint
CREATE INDEX "idx_prompts_pack_id" ON "prompts" USING btree ("pack_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_pack_id" ON "order_items" USING btree ("pack_id");--> statement-breakpoint
CREATE INDEX "idx_orders_user_id" ON "orders" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_stripe_session" ON "orders" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_pack_id" ON "reviews" USING btree ("pack_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_reviews_user_id" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_analytics_pack_created" ON "analytics_events" USING btree ("pack_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_generated_files_pack_id" ON "generated_files" USING btree ("pack_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_logs_entity" ON "moderation_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_newsletter_email" ON "newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_prompt_versions_prompt_id" ON "prompt_versions" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "idx_saved_packs_user" ON "saved_packs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_affiliate_conversions_affiliate" ON "affiliate_conversions" USING btree ("affiliate_user_id");--> statement-breakpoint
CREATE INDEX "idx_api_keys_user" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_api_keys_hash" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_admin" ON "audit_logs" USING btree ("admin_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_entity" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_cart_items_cart" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "idx_collection_items_collection" ON "collection_items" USING btree ("collection_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_collections_user_id" ON "collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_collections_visibility" ON "collections" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_community_prompts_status" ON "community_prompts" USING btree ("status","upvote_count");--> statement-breakpoint
CREATE INDEX "idx_content_reports_status" ON "content_reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_content_reports_entity" ON "content_reports" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_p1" ON "conversations" USING btree ("participant1_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_p2" ON "conversations" USING btree ("participant2_id");--> statement-breakpoint
CREATE INDEX "idx_creator_applications_status" ON "creator_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_direct_messages_conversation" ON "direct_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_gift_orders_token" ON "gift_orders" USING btree ("redemption_token");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_unread" ON "notifications" USING btree ("user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "idx_pack_appeals_status" ON "pack_appeals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pack_appeals_pack" ON "pack_appeals" USING btree ("pack_id");--> statement-breakpoint
CREATE INDEX "idx_pack_appreciations_pack" ON "pack_appreciations" USING btree ("pack_id");--> statement-breakpoint
CREATE INDEX "idx_pack_bundle_items_bundle" ON "pack_bundle_items" USING btree ("bundle_pack_id");--> statement-breakpoint
CREATE INDEX "idx_pack_comments_pack_id" ON "pack_comments" USING btree ("pack_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_pack_comments_parent" ON "pack_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_prompt_bookmarks_user" ON "prompt_bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_referrals_code" ON "referrals" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_referrals_referrer" ON "referrals" USING btree ("referrer_id");--> statement-breakpoint
CREATE INDEX "idx_sale_events_pack" ON "sale_events" USING btree ("pack_id");--> statement-breakpoint
CREATE INDEX "idx_sale_events_active" ON "sale_events" USING btree ("is_active","ends_at");--> statement-breakpoint
CREATE INDEX "idx_saved_searches_user" ON "saved_searches" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_support_tickets_status" ON "support_tickets" USING btree ("status","priority");--> statement-breakpoint
CREATE INDEX "idx_ticket_messages_ticket" ON "ticket_messages" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "idx_user_activity_user" ON "user_activity" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_user_activity_public" ON "user_activity" USING btree ("is_public","created_at");--> statement-breakpoint
CREATE INDEX "idx_user_follows_follower" ON "user_follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "idx_user_follows_following" ON "user_follows" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "idx_user_recommendations_user" ON "user_recommendations" USING btree ("user_id","score");