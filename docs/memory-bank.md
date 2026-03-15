# PromptVault — Complete Project Memory Bank

> **Purpose:** Single source of truth for the entire PromptVault project. Every architectural
> decision, every feature, every file, every API route, every DB table, every design pattern,
> and every known issue is documented here. Treat this as the project's permanent long-term memory.
>
> **Last Updated:** March 14, 2026
> **Project Owner:** Roshan
> **Build Status:** Phase 2 in progress

---

## TABLE OF CONTENTS

1. [Project Identity](#1-project-identity)
2. [Repository & Monorepo Structure](#2-repository--monorepo-structure)
3. [Technology Stack](#3-technology-stack)
4. [Package Inventory](#4-package-inventory)
5. [Database Schema — All Tables](#5-database-schema--all-tables)
6. [Backend API — All Routes](#6-backend-api--all-routes)
7. [Frontend — All Pages & Routes](#7-frontend--all-pages--routes)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Authentication & Security System](#9-authentication--security-system)
10. [Commerce & Checkout Flow](#10-commerce--checkout-flow)
11. [Admin & Automation System](#11-admin--automation-system)
12. [Notification System](#12-notification-system)
13. [Social & Community Features](#13-social--community-features)
14. [Creator & Seller System](#14-creator--seller-system)
15. [Caching & Performance](#15-caching--performance)
16. [File Storage & PDF Generation](#16-file-storage--pdf-generation)
17. [Email System](#17-email-system)
18. [Observability & Error Tracking](#18-observability--error-tracking)
19. [Testing Infrastructure](#19-testing-infrastructure)
20. [Development Workflows & Scripts](#20-development-workflows--scripts)
21. [Environment Variables — Complete Reference](#21-environment-variables--complete-reference)
22. [Feature Status — Complete Inventory](#22-feature-status--complete-inventory)
23. [Known Issues & Bugs](#23-known-issues--bugs)
24. [Design System & UI Patterns](#24-design-system--ui-patterns)
25. [Business Rules & Logic](#25-business-rules--logic)
26. [Deployment & Production](#26-deployment--production)
27. [Future Roadmap](#27-future-roadmap)

---

## 1. PROJECT IDENTITY

| Field | Value |
|-------|-------|
| **Product Name** | PromptVault |
| **Product Type** | AI prompt pack marketplace (SaaS) |
| **Business Model** | Freemium + one-time pack purchases + Pro subscription |
| **Target Users** | Professionals who use AI tools (ChatGPT, Claude, Midjourney, etc.) |
| **Developer / Owner** | Roshan |
| **Platform** | Web app (React + Express) — mobile app planned (P3) |
| **Phase** | Phase 2 (advanced features on top of working MVP) |
| **Hidden Admin Login** | `/pvx-admin` — double-click logo to reveal form |
| **Refund Policy** | All sales are final. No money-back guarantee. No refund window. |

### What PromptVault Does

Users browse and purchase curated packs of AI prompts organised by category and AI tool. Each pack
contains 10–100 professionally written prompts for tools like ChatGPT, Claude, Midjourney, Gemini, etc.
Administrators can trigger AI-powered pack generation via an automation pipeline, review generated content,
and publish it. The platform supports social features (follows, collections, comments, appreciations),
a personal prompt library, and creator accounts for third-party sellers.

---

## 2. REPOSITORY & MONOREPO STRUCTURE

```
workspace/
├── artifacts/                      # Deployable applications
│   ├── promptvault/                # Frontend React app (@workspace/promptvault)
│   ├── api-server/                 # Backend Express API (@workspace/api-server)
│   └── mockup-sandbox/             # Design preview server (@workspace/mockup-sandbox)
│
├── lib/                            # Shared libraries
│   ├── db/                         # Drizzle ORM schema + DB client (@workspace/db)
│   ├── api-spec/                   # OpenAPI 3.1 spec + Orval codegen (@workspace/api-spec)
│   ├── api-client-react/           # Generated React Query hooks (@workspace/api-client-react)
│   ├── api-zod/                    # Generated Zod schemas (@workspace/api-zod)
│   ├── integrations/               # Third-party integration connectors
│   └── integrations-openrouter-ai/ # OpenRouter AI integration
│
├── scripts/                        # Utility scripts (@workspace/scripts)
│   └── src/
│       └── seed.ts                 # Database seeder
│
├── docs/                           # Project documentation (this directory)
│   ├── README.md                   # Docs index
│   ├── memory-bank.md              # This file — complete project memory
│   ├── Final-Work.md               # Remaining tasks and missing features
│   ├── Debug.md                    # Bug tracker and security audit
│   └── E2E-Testing.md              # Testing guide
│
├── attached_assets/                # PRD files and reference documents
│   ├── PromptVault_PRD_*.txt       # Phase 1 PRD
│   ├── PromptVault_Phase2_PRD_*.txt# Phase 2 PRD
│   └── Pasted-*.txt               # Debug and implementation prompts
│
├── Missing-remaining-work.md       # Phase 2 gap analysis (root level)
├── pnpm-workspace.yaml             # Workspace package list
├── tsconfig.base.json              # Shared TypeScript config
├── tsconfig.json                   # Root project references
├── package.json                    # Root devDependencies
└── replit.md                       # Replit memory file (high-level)
```

### Monorepo Rules

- **Package manager:** pnpm workspaces
- **TypeScript:** `composite: true` in every package; build with `tsc --build` from root
- **Imports:** Cross-package imports use workspace aliases (`@workspace/db`, `@workspace/api-client-react`)
- **Typecheck:** Always run `pnpm run typecheck` from root (uses project references)
- **Never** run `tsc` inside a single package — dependencies won't be built

---

## 3. TECHNOLOGY STACK

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 24 | Runtime |
| TypeScript | 5.9 | Language |
| Express | 5 | HTTP framework |
| Drizzle ORM | latest | Database ORM |
| PostgreSQL | 16 | Primary database |
| Zod (v4) | latest | Runtime validation |
| drizzle-zod | latest | Schema → Zod bridge |
| bcrypt | latest | Password hashing (cost factor 12) |
| jsonwebtoken | latest | JWT access + refresh tokens |
| Stripe SDK | latest | Payments |
| pdfkit | latest | PDF generation |
| Helmet | latest | Security headers |
| CORS | latest | Cross-origin config |
| express-rate-limit | latest | Rate limiting |
| pino | latest | Structured logging |
| Sentry | latest | Error tracking |
| esbuild | latest | Production bundler (CJS output) |

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| Vite | 6 | Dev server + bundler |
| TypeScript | 5.9 | Language |
| Tailwind CSS | 4 | Styling |
| Radix UI | latest | Accessible component primitives |
| Lucide React | latest | Icons |
| TanStack Query | latest | Server state / data fetching |
| Zustand | latest | Client state (auth store) |
| Wouter | latest | Routing |
| Recharts | latest | Charts (admin analytics) |
| Sentry | latest | Frontend error tracking |

### Infrastructure

| Item | Technology |
|------|-----------|
| Database | Replit PostgreSQL (auto-provisioned) |
| Cache | In-memory (MemoryCache class) — Redis planned for production |
| File Storage | Local disk (`/public/files`) — S3 planned for production |
| Email | Resend API (falls back to console.log in dev) |
| AI Generation | OpenRouter API / Anthropic |
| Payments | Stripe |
| Error Tracking | Sentry (optional, no-ops without DSN) |
| Deployment | Replit hosting |

---

## 4. PACKAGE INVENTORY

### `artifacts/promptvault` — Frontend App

- **Dev port:** `19275`
- **Proxy:** `/api` → `http://localhost:5000` (Vite proxy)
- **Entry:** `src/main.tsx` → wraps in `<App>` with `<QueryClientProvider>`, `<HelmetProvider>`, `<Toaster>`, Sentry
- **Router:** Wouter (in `src/App.tsx`)
- **State:** Zustand (`src/store/use-auth-store.ts`) — persisted to localStorage
- **API client:** Generated React Query hooks from `@workspace/api-client-react`
- **Build:** `BASE_PATH=/ pnpm --filter @workspace/promptvault build`

### `artifacts/api-server` — Backend API

- **Dev port:** `8080`
- **Entry:** `src/index.ts` → validates env → starts Express → graceful shutdown
- **App config:** `src/app.ts` → CORS, Helmet, rate limiting, body parsing, routes
- **Build:** esbuild → `dist/index.cjs` (CJS bundle)
- **Seed:** `src/seed.ts` — run via `pnpm --filter @workspace/scripts run seed`

### `lib/db` — Database Layer

- **ORM:** Drizzle ORM
- **Schema files:** `src/schema/users.ts`, `categories.ts`, `packs.ts`, `prompts.ts`, `orders.ts`, `reviews.ts`, `automation.ts`, `misc.ts`, `social.ts`
- **Exports:** `db` (Drizzle instance), all table definitions, insert schemas
- **Migrations:** `pnpm --filter @workspace/db run push` (dev) | Replit auto-migration (production)

### `lib/api-spec` — OpenAPI Spec

- **Spec:** `openapi.yaml` (OpenAPI 3.1)
- **Codegen:** Orval — generates React Query hooks and Zod schemas
- **Run codegen:** `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-client-react` — Generated React Query Hooks

- **Location:** `src/generated/`
- **Custom fetch:** `src/custom-fetch.ts` — intercepts 401, silent refresh, retry
- **Used by:** `artifacts/promptvault` for all API calls

### `lib/api-zod` — Generated Zod Schemas

- **Location:** `src/generated/`
- **Used by:** `artifacts/api-server` for request/response validation

---

## 5. DATABASE SCHEMA — ALL TABLES

### Core Tables (Phase 1)

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| email | VARCHAR UNIQUE | Disposable domains blocked on registration |
| passwordHash | TEXT | bcrypt cost 12; legacy PBKDF2 auto-detected |
| displayName | VARCHAR(100) | |
| role | ENUM | `USER`, `ADMIN`, `SUPER_ADMIN` |
| status | ENUM | `ACTIVE`, `SUSPENDED`, `DELETED` |
| emailVerified | BOOLEAN | |
| avatarUrl | TEXT | |
| bio | TEXT | |
| refreshToken | TEXT | Hashed refresh token |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |
| **Phase 2 — missing fields** | | See `Missing-remaining-work.md` Section 1 |

Missing: `username`, `coverImageUrl`, `location`, `websiteUrl`, `twitterHandle`, `linkedinUrl`,
`githubHandle`, `youtubeUrl`, `specialties` (TEXT[]), `isCreator`, `totalDownloadsAllPacks`,
`publicPackCount`, `followerCount`, `followingCount`, `profileVisibility`, `creditBalanceCents`

#### `categories`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | VARCHAR | |
| slug | VARCHAR UNIQUE | |
| description | TEXT | |
| icon | VARCHAR | Lucide icon name |
| color | VARCHAR | Hex color for UI theming |
| packCount | INT | Denormalised |
| createdAt | TIMESTAMP | |

#### `packs` (prompt_packs)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| title | VARCHAR | |
| slug | VARCHAR UNIQUE | |
| description | TEXT | |
| seoDescription | TEXT | |
| categoryId | UUID FK → categories | |
| status | ENUM | `DRAFT`, `AI_GENERATED`, `PENDING_REVIEW`, `PUBLISHED`, `REJECTED`, `ARCHIVED` |
| priceCents | INT | Price in cents |
| comparePriceCents | INT | Strike-through price |
| isFree | BOOLEAN | |
| isFeatured | BOOLEAN | |
| isBestseller | BOOLEAN | |
| isNew | BOOLEAN | |
| thumbnailUrl | TEXT | |
| promptCount | INT | Denormalised |
| totalDownloads | INT | Denormalised |
| avgRating | DECIMAL | |
| reviewCount | INT | |
| aiTool | VARCHAR | ChatGPT, Claude, Midjourney, etc. |
| tags | TEXT[] | |
| publishedAt | TIMESTAMP | |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |
| **Phase 2 — missing fields** | | `creatorId` FK, `packType` ENUM (single/bundle) |

#### `prompts`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| packId | UUID FK → packs | |
| title | VARCHAR | |
| body | TEXT | The actual prompt text |
| description | TEXT | |
| aiTool | VARCHAR | |
| useCase | VARCHAR | |
| sortOrder | INT | |
| createdAt | TIMESTAMP | |

#### `orders`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| userId | UUID FK → users | |
| status | ENUM | `PENDING`, `COMPLETED`, `REFUNDED`, `FAILED` |
| totalCents | INT | |
| couponId | UUID FK → coupons | nullable |
| discountCents | INT | |
| stripeSessionId | TEXT | |
| stripePaymentIntentId | TEXT | |
| createdAt | TIMESTAMP | |
| updatedAt | TIMESTAMP | |

#### `order_items`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| orderId | UUID FK → orders | |
| packId | UUID FK → packs | |
| priceCents | INT | Price at time of purchase |
| downloadCount | INT | Increments on each download |
| createdAt | TIMESTAMP | |

#### `reviews`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| packId | UUID FK → packs | |
| userId | UUID FK → users | |
| rating | SMALLINT | 1–5 |
| title | VARCHAR(100) | |
| body | TEXT | |
| status | ENUM | `PUBLISHED`, `FLAGGED`, `REMOVED` |
| createdAt | TIMESTAMP | |

#### `coupons`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| code | VARCHAR UNIQUE | Stored uppercase |
| discountType | ENUM | `PERCENT`, `FIXED` |
| discountValue | DECIMAL | |
| maxUses | INT | |
| usesCount | INT | |
| expiresAt | TIMESTAMP | nullable |
| isActive | BOOLEAN | |
| createdAt | TIMESTAMP | |

#### `saved_packs` (wishlist)
| Column | Type | Notes |
|--------|------|-------|
| userId | UUID FK | Composite PK |
| packId | UUID FK | Composite PK |
| createdAt | TIMESTAMP | |

#### `automation_jobs`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| type | ENUM | `GENERATE_PACK`, `GENERATE_PROMPTS`, `GENERATE_PDF`, etc. |
| status | ENUM | `PENDING`, `RUNNING`, `COMPLETED`, `FAILED` |
| payload | JSONB | Job parameters |
| result | JSONB | Job output |
| error | TEXT | Error message if failed |
| startedAt | TIMESTAMP | |
| completedAt | TIMESTAMP | |
| createdAt | TIMESTAMP | |

#### `generated_files`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| packId | UUID FK → packs | |
| fileType | ENUM | `PDF`, `ZIP` |
| status | ENUM | `GENERATING`, `READY`, `FAILED` |
| filePath | TEXT | Local path or S3 key |
| fileSizeBytes | INT | |
| createdAt | TIMESTAMP | |

### Phase 2 Social Tables (schema exists in DB)

#### `user_follows`
| Column | Type |
|--------|------|
| followerId | UUID FK → users (composite PK) |
| followingId | UUID FK → users (composite PK) |
| createdAt | TIMESTAMP |

#### `collections`
| Column | Type |
|--------|------|
| id | UUID PK |
| userId | UUID FK → users |
| title | VARCHAR(100) |
| description | VARCHAR(500) |
| coverImageUrl | TEXT |
| visibility | ENUM: public/private/followers |
| itemCount | INT |
| followerCount | INT |
| isFeatured | BOOLEAN |
| createdAt, updatedAt | TIMESTAMP |

#### `collection_items`
| Column | Type |
|--------|------|
| collectionId | UUID FK |
| packId | UUID FK (nullable) |
| promptId | UUID FK (nullable) |
| sortOrder | INT |
| addedAt | TIMESTAMP |

#### `collection_follows`
| Column | Type |
|--------|------|
| userId | UUID FK (composite PK) |
| collectionId | UUID FK (composite PK) |
| createdAt | TIMESTAMP |

#### `pack_appreciations`
| Column | Type |
|--------|------|
| userId | UUID FK (composite PK) |
| packId | UUID FK (composite PK) |
| createdAt | TIMESTAMP |

#### `pack_comments`
| Column | Type |
|--------|------|
| id | UUID PK |
| packId | UUID FK |
| userId | UUID FK |
| parentId | UUID FK (self, nullable — for replies) |
| body | TEXT |
| upvoteCount | INT |
| status | ENUM: published/flagged/removed |
| createdAt | TIMESTAMP |

#### `comment_upvotes`
| Column | Type |
|--------|------|
| userId | UUID FK (composite PK) |
| commentId | UUID FK (composite PK) |
| createdAt | TIMESTAMP |

#### `notifications`
| Column | Type |
|--------|------|
| id | SERIAL PK |
| userId | UUID FK |
| type | ENUM (16 types — see below) |
| title | VARCHAR |
| body | TEXT |
| imageUrl | TEXT |
| ctaUrl | TEXT |
| isRead | BOOLEAN |
| readAt | TIMESTAMP |
| actorId | UUID FK (nullable) |
| entityType | VARCHAR |
| entityId | VARCHAR |
| createdAt | TIMESTAMP |

**Notification type enum values:**
`new_follower`, `review_posted`, `pack_appreciated`, `new_comment`, `comment_reply`,
`pack_purchase`, `new_pack_from_followed`, `collection_updated`, `milestone_reached`,
`download_ready`, `price_drop`, `admin_announcement`, `new_message`, `creator_approved`,
`creator_rejected`, `verification_approved`

#### `referrals`
| Column | Type |
|--------|------|
| id | UUID PK |
| referrerId | UUID FK → users |
| referredUserId | UUID FK → users |
| referralCode | VARCHAR UNIQUE |
| clickCount | INT |
| status | ENUM |
| creditAwarded | BOOLEAN |
| createdAt | TIMESTAMP |

#### `user_activity`
| Column | Type |
|--------|------|
| id | UUID PK |
| userId | UUID FK |
| type | ENUM (user_activity_type) |
| packId | UUID FK (nullable) |
| collectionId | UUID FK (nullable) |
| metadata | JSONB |
| createdAt | TIMESTAMP |

**user_activity_type enum values:**
`pack_published`, `pack_updated`, `review_posted`, `milestone_reached`,
`new_follower`, `collection_created`, `collection_updated`

### Phase 2 Commerce Tables (schema exists in DB)

- `gift_orders` — gift purchase metadata (token, recipient email, sender message)
- `sale_events` — flash sale definitions (packId, salePriceCents, startAt, endAt)
- `cart_items` — persistent server-side cart

### Phase 2 Subscription Tables (schema exists in DB)

- `subscriptions` — user subscription records (plan, stripeSubscriptionId, status)
- `subscription_credits` — monthly pack credits balance
- `teams` — team accounts
- `team_memberships` — seat management

### Phase 2 Creator Tables (schema exists in DB)

- `creator_applications` — application with eligibility check, stripeAccountId
- `creator_payouts` — payout history

### Tables That Still Need to Be Created

| Table | Purpose |
|-------|---------|
| `pack_embeddings` | pgvector semantic search |
| `saved_searches` | User saved search queries |
| `search_events` | Search click analytics |
| `user_recommendations` | Collaborative filtering results |
| `notification_preferences` | Per-user notification settings |
| `prompt_bookmarks` | Personal prompt library |
| `messages` | Direct messaging |
| `conversations` | Message thread metadata |
| `trust_scores` | User trust computation |
| `pack_appeals` | Content appeal submissions |
| `content_reports` | User-submitted reports |
| `analytics_events` | General event analytics |
| `bundle_items` | Bundle pack membership |

---

## 6. BACKEND API — ALL ROUTES

**Base URL:** `/api`
**Auth:** `Authorization: Bearer <accessToken>` header
**Admin:** Same header; server checks `user.role === 'ADMIN' || 'SUPER_ADMIN'`

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/healthz` | None | Full health check with DB + Redis latency |

### Authentication (`src/routes/auth.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Register (blocks 400+ disposable email domains) |
| POST | `/auth/login` | None | Login → `{ user, accessToken, refreshToken }` |
| POST | `/auth/logout` | User | Revokes refresh token |
| POST | `/auth/refresh` | None | Silent token refresh via refreshToken |
| GET | `/auth/me` | User | Current user data |
| POST | `/auth/verify-email` | None | Verify email with token |
| POST | `/auth/resend-verification` | None | Resend verification email |
| POST | `/auth/forgot-password` | None | Send reset email (rate-limited 3/hr) |
| POST | `/auth/reset-password` | None | Reset password with token |

### Packs (`src/routes/packs.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/packs` | None | List published packs (filters: category, search, isFree, sort, minPrice, maxPrice, page, limit) |
| GET | `/packs/featured` | None | Featured packs (`isFeatured=true`) |
| GET | `/packs/trending` | None | Trending packs (by totalDownloads, time-windowed) |
| GET | `/packs/bestsellers` | None | Bestseller packs |
| GET | `/packs/:slug` | None | Pack detail + first 3 prompts (rest returned but marked blurred) |
| GET | `/packs/:slug/related` | None | Related packs (same category) |

### Categories (`src/routes/categories.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | None | All categories with pack counts |
| GET | `/categories/:slug` | None | Single category detail |

### Search (`src/routes/search.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search?q=` | None | Full-text search (PostgreSQL `ILIKE`) across packs |

### Reviews (`src/routes/reviews.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/reviews/:packId` | None | List reviews for a pack |
| POST | `/reviews` | User | Submit review (requires purchase) |
| DELETE | `/reviews/:id` | User | Delete own review |

### Stats (`src/routes/stats.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stats` | None | Platform stats: totalPrompts, totalPacks, totalUsers, totalDownloads |

### Orders (`src/routes/orders.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/orders` | User | User's order history |
| GET | `/orders/:id` | User | Single order detail (403 if not owner) |

### User (`src/routes/user.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/user/purchases` | User | User's purchased packs |
| GET | `/user/purchases/:packId/download` | User | Download file (requires ownership) |
| GET | `/user/wishlist` | User | Saved/wishlisted packs |
| POST | `/user/wishlist/:packId` | User | Add to wishlist |
| DELETE | `/user/wishlist/:packId` | User | Remove from wishlist |
| PUT | `/user/profile` | User | Update profile fields |

### Checkout (`src/routes/checkout.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/checkout/session` | User | Create Stripe Checkout Session |
| POST | `/checkout/webhook` | None | Stripe webhook (raw body; sig verified) |
| POST | `/checkout/validate-coupon` | User | Validate coupon code |

### Newsletter (`src/routes/newsletter.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/newsletter/subscribe` | None | Subscribe email to newsletter |

### Profiles (`src/routes/profiles.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/:username` | None | Public profile by username |
| GET | `/users/:username/packs` | None | User's published packs |
| GET | `/users/:username/followers` | None | Follower list |
| GET | `/users/:username/following` | None | Following list |
| POST | `/users/:id/follow` | User | Follow a user |
| DELETE | `/users/:id/follow` | User | Unfollow a user |

### Notifications (`src/routes/notifications.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | User | List notifications (filter: all/unread/purchases/social/system) |
| GET | `/notifications/unread-count` | User | Unread badge count |
| PATCH | `/notifications/:id/read` | User | Mark single as read |
| POST | `/notifications/read-all` | User | Mark all as read |

### Social (`src/routes/social.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/collections` | None | Public/featured collections |
| POST | `/collections` | User | Create collection |
| GET | `/collections/:id` | None | Collection detail |
| PUT | `/collections/:id` | User | Update collection (owner only) |
| DELETE | `/collections/:id` | User | Delete collection (owner only) |
| POST | `/collections/:id/items` | User | Add item to collection |
| DELETE | `/collections/:id/items/:itemId` | User | Remove item |
| POST | `/collections/:id/follow` | User | Follow collection |
| DELETE | `/collections/:id/follow` | User | Unfollow collection |
| GET | `/packs/:id/comments` | None | List pack comments |
| POST | `/packs/:id/comments` | User | Post comment |
| POST | `/comments/:id/upvote` | User | Upvote comment |
| GET | `/activity-feed` | User | Activity feed from followed users |
| GET | `/referrals/me` | User | Referral programme stats |

### Cart (`src/routes/cart.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cart` | User | Get cart contents |
| POST | `/cart` | User | Add item to cart |
| DELETE | `/cart/:packId` | User | Remove item from cart |
| DELETE | `/cart` | User | Clear cart |

### Creator (`src/routes/creator.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/creator/apply` | User | Submit creator application |
| GET | `/creator/dashboard` | Creator | Creator stats |
| GET | `/creator/packs` | Creator | Creator's packs |
| POST | `/creator/packs` | Creator | Create pack |
| PUT | `/creator/packs/:id` | Creator | Update pack |
| GET | `/creator/analytics` | Creator | Analytics data |
| GET | `/creator/payouts` | Creator | Payout history |

### Prompt Library (`src/routes/prompt-library.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/prompt-library` | User | Personal prompt library |
| POST | `/prompts/:id/bookmark` | User | Bookmark a prompt |
| DELETE | `/prompts/:id/bookmark` | User | Remove bookmark |
| PATCH | `/prompts/:id/bookmark` | User | Update rating / mark used |

### Subscriptions (`src/routes/subscriptions.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/subscriptions/me` | User | Current subscription status |
| POST | `/subscriptions/upgrade` | User | Start Stripe subscription (⚠️ returns placeholder URL) |
| POST | `/subscriptions/cancel` | User | Cancel subscription |
| GET | `/subscriptions/credits` | User | Pack credit balance |

### Gifts (`src/routes/gifts.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/packs/:id/gift` | User | Purchase pack as gift |
| GET | `/gift/:token` | None | Gift redemption info |
| POST | `/gift/:token/redeem` | User | Redeem gift |

### Messages (`src/routes/messages.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/messages` | User | Inbox (conversations list) |
| GET | `/messages/:conversationId` | User | Conversation thread |
| POST | `/messages` | User | Send message |

### Community (`src/routes/community.ts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/community/prompts` | None | Community prompt feed |
| POST | `/community/prompts` | User | Submit community prompt |
| POST | `/community/prompts/:id/vote` | User | Upvote community prompt |

### Admin (`src/routes/admin.ts` — mounted at `/admin`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/dashboard` | Admin | KPI stats + chart data |
| GET | `/admin/packs` | Admin | All packs (any status, paginated) |
| PUT | `/admin/packs/:id` | Admin | Update any pack field |
| DELETE | `/admin/packs/:id` | Admin | Delete pack |
| GET | `/admin/packs/pending` | Admin | Packs pending review |
| POST | `/admin/packs/:id/approve` | Admin | Approve → PUBLISHED |
| POST | `/admin/packs/:id/reject` | Admin | Reject with reason |
| GET | `/admin/users` | Admin | All users (paginated, searchable) |
| PATCH | `/admin/users/:id/status` | Admin | Change user status (suspend/restore) |
| GET | `/admin/categories` | Admin | All categories |
| POST | `/admin/categories` | Admin | Create category |
| PATCH | `/admin/categories/:id` | Admin | Update category |
| DELETE | `/admin/categories/:id` | Admin | Delete (if no packs) |
| GET | `/admin/automation` | Admin | List automation jobs |
| POST | `/admin/automation` | Admin | Trigger new automation job |
| POST | `/admin/automation/:id/retry` | Admin | Retry failed job |
| GET | `/admin/coupons` | Admin | List coupons |
| POST | `/admin/coupons` | Admin | Create coupon |
| PATCH | `/admin/coupons/:id` | Admin | Update coupon |
| DELETE | `/admin/coupons/:id` | Admin | Delete coupon |
| GET | `/admin/analytics` | Admin | Revenue and performance analytics |
| GET | `/admin/files` | Admin | Generated files list |
| POST | `/admin/files/:id/regenerate` | Admin | Trigger file regeneration |
| GET | `/admin/settings` | Admin | Platform settings + feature flags |
| PUT | `/admin/settings` | Admin | Update settings/feature flags |
| GET | `/admin/moderation` | Admin | Moderation queue |
| POST | `/admin/moderation/:id/action` | Admin | Take moderation action |

---

## 7. FRONTEND — ALL PAGES & ROUTES

All 50+ routes registered in `artifacts/promptvault/src/App.tsx`. Pages are lazy-loaded with `React.lazy()` and `<Suspense>`.

### Public Routes

| Route | Component File | Status |
|-------|--------------|--------|
| `/` | `pages/home.tsx` | ✅ Complete |
| `/explore` | `pages/explore.tsx` | ✅ Complete |
| `/packs/:slug` | `pages/pack-detail.tsx` | ✅ Complete |
| `/search` | `pages/search.tsx` | ✅ Basic |
| `/pricing` | `pages/pricing.tsx` | ✅ Complete |
| `/trending` | `pages/trending.tsx` | ✅ Basic |
| `/categories/:slug` | `pages/category.tsx` | ✅ Complete |
| `/creators` | `pages/creators.tsx` | ✅ Basic listing |
| `/creator/:username` | `pages/creator.tsx` | ✅ Basic |
| `/u/:username` | `pages/user-profile.tsx` | ⚠️ Partial |
| `/u/:username/followers` | `pages/followers.tsx` | ⚠️ Needs pagination |
| `/u/:username/following` | `pages/following.tsx` | ⚠️ Needs pagination |
| `/collections` | `pages/collections-page.tsx` | ⚠️ Partial |
| `/collections/:id` | `pages/collection-detail.tsx` | ⚠️ Partial |
| `/community` | `pages/community.tsx` | ⚠️ Partial |
| `/discover-creators` | `pages/discover-creators.tsx` | ⚠️ Basic |
| `/affiliate` | `pages/affiliate.tsx` | ⚠️ Landing only |
| `/sales` / `/flash-sales` | `pages/flash-sales.tsx` | ⚠️ Partial |
| `/become-a-creator` | (component) | ⚠️ Landing only |
| `/about` | `pages/about.tsx` | ✅ Complete |
| `/privacy` | `pages/privacy.tsx` | ✅ GDPR-compliant |
| `/terms` | `pages/terms.tsx` | ✅ Complete |
| `/contact` | `pages/contact.tsx` | ✅ Complete |
| `/docs/api` | `pages/docs/` | ⚠️ Basic |

### Auth Routes

| Route | Component File | Status |
|-------|--------------|--------|
| `/login` | `pages/auth/login.tsx` | ✅ Complete |
| `/signup` | `pages/auth/signup.tsx` | ✅ Complete |
| `/pvx-admin` | `pages/auth/admin-login.tsx` | ✅ Complete (hidden) |
| `/forgot-password` | `pages/auth/forgot-password.tsx` | ✅ Complete |
| `/reset-password` | `pages/auth/reset-password.tsx` | ✅ Complete |
| `/verify-email` | `pages/auth/email-verification.tsx` | ✅ Complete |

### Commerce Routes

| Route | Component File | Status |
|-------|--------------|--------|
| `/cart` | `pages/cart.tsx` | ✅ Basic |
| `/checkout` | `pages/checkout/index.tsx` | ✅ Complete |
| `/checkout/success` | `pages/checkout/` | ✅ Complete |
| `/checkout/cancel` | `pages/checkout/` | ✅ Complete |
| `/gift/:token` | `pages/gift-redeem.tsx` | ⚠️ Partial |

### Dashboard Routes (protected)

| Route | Component File | Status |
|-------|--------------|--------|
| `/dashboard` | `pages/dashboard/home.tsx` | ✅ Complete |
| `/dashboard/purchases` | `pages/dashboard/purchases.tsx` | ✅ Complete |
| `/dashboard/downloads` | `pages/dashboard/downloads.tsx` | ✅ Complete |
| `/dashboard/wishlist` | `pages/dashboard/wishlist.tsx` | ✅ Complete |
| `/dashboard/settings` | `pages/dashboard/settings.tsx` | ✅ Complete |
| `/dashboard/orders/:id` | `pages/dashboard/order-detail.tsx` | ✅ Complete |
| `/dashboard/review/:packId` | `pages/dashboard/write-review.tsx` | ✅ Complete |
| `/dashboard/profile/edit` | `pages/dashboard/edit-profile.tsx` | ⚠️ Basic form |
| `/dashboard/notifications` | `pages/dashboard/notifications.tsx` | ⚠️ UI exists, backend delivery incomplete |
| `/dashboard/library` | `pages/dashboard/prompt-library.tsx` | ⚠️ Partial |
| `/dashboard/packs/:packId/prompts` | `pages/pack-prompts.tsx` | ⚠️ Partial |
| `/dashboard/activity` | `pages/dashboard/activity-feed.tsx` | ⚠️ Partial |
| `/dashboard/subscription` | `pages/dashboard/subscription.tsx` | ⚠️ Basic (Stripe placeholder) |
| `/dashboard/team` | `pages/dashboard/team.tsx` | ⚠️ Not implemented |
| `/dashboard/messages` | `pages/dashboard/messages.tsx` | ⚠️ Placeholder |
| `/dashboard/collections` | `pages/dashboard/collections.tsx` | ⚠️ Partial |
| `/dashboard/referrals` | `pages/dashboard/referrals.tsx` | ⚠️ Basic UI |
| `/dashboard/verification` | (component) | ❌ Empty stub |

### Creator Routes (protected)

| Route | Status |
|-------|--------|
| `/creator/dashboard` | ❌ Empty stub |
| `/creator/packs/new` | ❌ Empty stub |
| `/creator/packs/:id/edit` | ❌ Empty stub |
| `/creator/analytics` | ❌ Empty stub |
| `/creator/payouts` | ❌ Empty stub |

### Admin Routes (admin-only)

| Route | Component File | Status |
|-------|--------------|--------|
| `/admin` | `pages/admin/dashboard.tsx` | ✅ Complete |
| `/admin/automation` | `pages/admin/automation.tsx` | ✅ Complete |
| `/admin/approval` | `pages/admin/approval.tsx` | ✅ Complete |
| `/admin/categories` | `pages/admin/categories.tsx` | ✅ Complete |
| `/admin/analytics` | `pages/admin/analytics.tsx` | ⚠️ Basic charts |
| `/admin/users` | `pages/admin/users.tsx` | ✅ Complete |
| `/admin/packs` | `pages/admin/packs.tsx` | ✅ Complete |
| `/admin/files` | `pages/admin/files.tsx` | ✅ Complete |
| `/admin/settings` | `pages/admin/settings.tsx` | ✅ Complete |
| `/admin/moderation` | `pages/admin/moderation.tsx` | ⚠️ Basic |
| `/admin/notifications` | `pages/admin/notifications.tsx` | ⚠️ Basic |
| `/admin/creators` | `pages/admin/creators.tsx` | ⚠️ Basic |
| `/admin/experiments` | `pages/admin/experiments.tsx` | ⚠️ Basic |
| `/admin/finance` | `pages/admin/finance.tsx` | ⚠️ Basic |
| `/admin/pricing` | `pages/admin/pricing.tsx` | ⚠️ Basic |
| `/admin/seo` | `pages/admin/seo.tsx` | ⚠️ Basic |
| `/admin/support` | `pages/admin/support.tsx` | ⚠️ Basic |
| `/admin/pack-editor` | `pages/admin/pack-editor.tsx` | ✅ Complete |

### Error Pages

| Route | Component | Status |
|-------|-----------|--------|
| `*` (catchall) | `pages/not-found.tsx` | ✅ |
| `/403` | `pages/forbidden.tsx` | ✅ |
| `/500` | `pages/server-error.tsx` | ✅ |

---

## 8. FRONTEND ARCHITECTURE

### Layout System

```
src/components/layout/
├── navbar.tsx          — Sticky top nav with auth state, cart, notifications bell
├── footer.tsx          — Links, newsletter form, social icons
├── public-layout.tsx   — Navbar + Footer wrapper for public pages
├── dashboard-layout.tsx — Sidebar + main content wrapper for /dashboard
└── admin-layout.tsx    — Admin sidebar + main content wrapper for /admin
```

### Shared Components

```
src/components/shared/
├── pack-card.tsx         — Used everywhere; shows thumbnail, price, rating, wishlist heart
├── cookie-consent.tsx    — GDPR banner (Necessary/Functional/Analytics/Marketing)
└── error-boundary.tsx    — Wraps entire app; catches React errors
```

### UI Component Library

Radix UI primitives styled with Tailwind CSS. Located in `src/components/ui/`:
accordion, alert, avatar, badge, button, calendar, card, carousel, chart, checkbox,
command, dialog, drawer, dropdown-menu, form, hover-card, input, label, menubar,
navigation-menu, pagination, popover, progress, radio-group, scroll-area, select,
separator, sheet, skeleton, slider, switch, table, tabs, textarea, toast, toggle,
tooltip + custom Recharts wrapper (`chart.tsx`)

### State Management

**Zustand (`src/store/use-auth-store.ts`):**
- Persisted to localStorage (`promptvault-auth`)
- Stores: `user`, `accessToken`, `refreshToken`, `isAuthenticated`, `isAdmin`
- Actions: `setAuth`, `updateUser`, `setAccessToken`, `logout`

**TanStack Query:**
- All server state managed via React Query
- Query keys: `src/lib/query-keys.ts` — structured key factory for packs, categories, user, reviews, search, admin
- Cache invalidation: on mutation success, call `queryClient.invalidateQueries(queryKeys.xxx)`

### API Client

`lib/api-client-react/src/custom-fetch.ts`:
- Injects `Authorization: Bearer <token>` from Zustand store
- On 401: silently calls `/api/auth/refresh`, updates token, retries original request
- On failed refresh: calls `authStore.logout()` → redirects to `/login`

### Routing

Wouter (`src/App.tsx`):
- All routes defined with `<Route path="..." component={...} />`
- Protected routes: wrap with `<ProtectedRoute>` (redirects to `/login?returnUrl=<path>`)
- Admin routes: wrap with `<AdminRoute>` (redirects buyers to `/dashboard`)
- All page components are lazy-loaded

### Query Keys Reference

```typescript
queryKeys.packs.list(filters)       // Pack list
queryKeys.packs.detail(slug)        // Pack detail
queryKeys.packs.featured()          // Featured packs
queryKeys.packs.trending(filters)   // Trending packs
queryKeys.categories.list()         // Categories
queryKeys.user.me                   // Current user
queryKeys.user.purchases(userId)    // User purchases
queryKeys.user.wishlist(userId)     // Wishlist
queryKeys.user.orders(userId)       // Orders
queryKeys.admin.dashboard           // Admin KPIs
queryKeys.admin.packs(filters)      // Admin pack list
queryKeys.admin.users(filters)      // Admin user list
queryKeys.admin.automation(filters) // Automation jobs
```

---

## 9. AUTHENTICATION & SECURITY SYSTEM

### Password Hashing

- **Algorithm:** bcrypt with cost factor 12
- **Legacy support:** PBKDF2 hashes auto-detected on login and verified (backward compatible)
- **Upgrade:** Legacy hashes auto-upgraded to bcrypt on successful login

### JWT Tokens

| Token | Secret | Expiry | Payload |
|-------|--------|--------|---------|
| Access | `JWT_SECRET` | 15 minutes | `{ userId, role, sessionId }` |
| Refresh | `JWT_REFRESH_SECRET` | 30 days | `{ userId, sessionId }` |

Token payload contains **only** `userId`, `role`, `sessionId` — no email or personal data.

### Refresh Flow

1. Access token expires → API returns 401
2. `custom-fetch.ts` intercepts 401 → calls `POST /api/auth/refresh` with refreshToken
3. New access token received → stored in Zustand
4. Original request retried transparently
5. If refresh also fails → `authStore.logout()` → redirect to `/login`

### Rate Limiting (per IP)

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/login` | 10 requests | 15 minutes |
| `/auth/register` | 5 requests | 1 hour |
| `/auth/forgot-password` | 3 requests | 1 hour |
| `/search` | 60 requests | 1 minute |
| Global | 120 requests | 1 minute |
| `/checkout/webhook` | ∞ (skipped) | — |

### Security Headers (Helmet)

```
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: (custom directives)
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Request-ID: <uuid> (per-request)
```

### CORS Policy

Allowed origins:
- `process.env.APP_URL`
- `process.env.CLIENT_URL`
- `*.replit.dev`, `*.repl.co` (dev only)
- `localhost:*` (dev only)

**Production action required:** Lock to `CLIENT_URL` only.

### Input Validation

All request bodies validated through Zod schemas (either hand-written or from `@workspace/api-zod`).
Express `body-parser` limit: 2MB (JSON and URL-encoded).

### Response Serialization

`src/lib/serialize.ts` whitelist serializers — strip internal fields before sending to client:
- `serializeUser` — strips `passwordHash`, `refreshToken`, internal timestamps
- `serializeUserPublic` — minimal public profile (id, displayName, avatarUrl, role)
- `serializePackPublic` — buyer-facing (strips admin-only fields)
- `serializePackAdmin` — full pack data for admin routes
- `serializeCategory`, `serializeReview`, `serializeOrder`, `serializeCoupon`

---

## 10. COMMERCE & CHECKOUT FLOW

### Purchase Flow (Paid Pack)

```
User → /packs/:slug → "Buy Now"
  → POST /api/checkout/session { packId, couponCode? }
  → Server validates: pack exists + PUBLISHED, user not already purchased
  → Applies coupon if provided (fetches from DB, checks validity)
  → Creates Stripe Checkout Session (price from DB, NEVER from request body)
  → Returns { checkoutUrl }
  → Frontend redirects to Stripe-hosted checkout
  → User completes payment with test/live card
  → Stripe fires webhook → POST /api/checkout/webhook
  → Server verifies Stripe signature
  → Creates Order (status=COMPLETED) + OrderItem(s)
  → Sends confirmation email (or logs to console in dev)
  → User redirected to /checkout/success
```

### Purchase Flow (Dev Mode — No Stripe Key)

When `STRIPE_SECRET_KEY` is not set:
- `POST /api/checkout/session` immediately creates a COMPLETED order
- No Stripe redirect
- Returns `{ checkoutUrl: '/checkout/success' }`

**Production requirement:** This must return HTTP 503 when `STRIPE_SECRET_KEY` is missing.

### Free Pack Claim

- Pack has `isFree: true`
- User clicks "Get Free Pack"
- `POST /api/checkout/session` with free pack → creates $0 order immediately
- No Stripe involved

### Coupon Codes

- Stored uppercase in DB
- Client normalises to uppercase before sending
- Server checks: exists, `isActive`, `!expiresAt || expiresAt > now()`, `usesCount < maxUses`
- Discount applied: `PERCENT` (multiply by rate) or `FIXED` (subtract cents, min 0)
- `usesCount` incremented on order creation
- One coupon per order enforced

**Seed coupons:** `WELCOME20` (20% off), `SAVE10` ($10 off), `HALF50` (50% off)

### Cart System

- Server-side cart in `cart_items` table
- Frontend also maintains local cart state
- Cart is merged on login

### Stripe Webhook Handler

Route: `POST /api/checkout/webhook`
- Uses `express.raw()` (raw body for signature verification)
- Verifies `stripe.webhooks.constructEvent()` with `STRIPE_WEBHOOK_SECRET`
- Handles: `checkout.session.completed` → updates order status

---

## 11. ADMIN & AUTOMATION SYSTEM

### Admin Access

- Hidden login at `/pvx-admin` (double-click logo reveals form)
- Requires `role: ADMIN` or `SUPER_ADMIN`
- Admin sidebar in `components/layout/admin-layout.tsx`

### Pack Generation Pipeline

```
Admin → /admin → "Generate New Pack"
  → Select category + size
  → POST /api/admin/automation { type: 'GENERATE_PACK', category, promptCount }
  → Server creates AutomationJob record (status: PENDING)
  → Returns jobId
  → Job processor calls AI API (OpenRouter/Anthropic)
  → AI generates: title, description, tags, N prompts
  → Server inserts: Pack (status: AI_GENERATED) + Prompts
  → Job status → COMPLETED
  → Pack appears in /admin/approval queue
```

### Approval Queue

- Admin reviews AI-generated pack at `/admin/approval`
- Can edit title, description, price, tags inline
- **Approve:** Pack status → `PUBLISHED`; appears in marketplace
- **Reject:** Pack status → `REJECTED` with reason; never appears in marketplace

### Admin KPI Cards

Dashboard shows: Total Users, Total Packs, Published Packs, Total Revenue, Pending Approvals,
Active Jobs — all from real DB queries.

### Feature Flags

Stored in platform settings. Toggle from `/admin/settings`. Affects behaviour across the app
(e.g., enable/disable community features, referral programme, flash sales).

---

## 12. NOTIFICATION SYSTEM

### Current State

- DB table `notifications` exists and is populated
- `GET /api/notifications` returns paginated notifications
- `GET /api/notifications/unread-count` returns badge count
- `PATCH /api/notifications/:id/read` marks as read
- Navbar bell polls every 30 seconds for unread count
- Bell dropdown shows 5 most recent notifications

### Missing

- Real-time Socket.IO delivery to `/user/:userId` namespace
- Email notifications on event creation
- `notification_preferences` table and endpoint
- Daily/weekly digest BullMQ cron job
- Quiet hours enforcement

### Notification Types (16 total)

`new_follower` | `review_posted` | `pack_appreciated` | `new_comment` | `comment_reply` |
`pack_purchase` | `new_pack_from_followed` | `collection_updated` | `milestone_reached` |
`download_ready` | `price_drop` | `admin_announcement` | `new_message` | `creator_approved` |
`creator_rejected` | `verification_approved`

---

## 13. SOCIAL & COMMUNITY FEATURES

### Follow System

- `user_follows` table exists
- `POST /api/users/:id/follow` → creates row
- `DELETE /api/users/:id/follow` → deletes row
- `GET /api/users/:username/followers` and `/following` → paginated lists
- Profile pages show follower/following counts

### Collections

- `collections` and `collection_items` tables exist
- Full CRUD endpoints in `src/routes/social.ts`
- Users can create, edit, delete collections
- Items: add packs or prompts to collections
- Follow collections to get notified of updates
- Public collections discoverable at `/collections`

### Comments

- `pack_comments` table with threaded replies (one level)
- `comment_upvotes` for upvoting
- Comments tab on pack detail page (loads when tab active)
- Markdown: bold, italic, inline code, links
- Author badges: "Pack Owner", "Verified Buyer"

### Pack Appreciation (Like System)

- `pack_appreciations` table exists
- `POST /api/packs/:id/appreciate` (in social.ts)
- Heart icon with count on pack cards/detail
- Used in trending algorithm

### Activity Feed

- `user_activity` table logs public actions
- `GET /api/activity-feed` returns feed from followed users
- Activity types: `pack_published`, `pack_updated`, `review_posted`, `milestone_reached`,
  `new_follower`, `collection_created`, `collection_updated`
- Dashboard at `/dashboard/activity`

### Community Prompts

- `/community` page shows community-submitted free prompts
- Users submit single prompts; community votes
- Top-voted highlighted on homepage weekly
- Admin can feature, remove, or convert to paid pack

### Referral System

- `referrals` table exists
- `/dashboard/referrals` page with shareable link
- Referrer earns $5 credit on first purchase by referred user
- Referred user gets 15% off first purchase
- Unique referral code per user

---

## 14. CREATOR & SELLER SYSTEM

### Current State

- `/become-a-creator` landing page exists
- `creator_applications` table in DB
- `POST /api/creator/apply` endpoint exists
- Creator routes registered but **all are empty stubs**

### Missing

- Stripe Connect Express onboarding (KYC + bank)
- Multi-step creator application form with eligibility check
- Admin approval queue for applications
- `packs.creatorId` FK on packs table
- Revenue share: 70% standard, 80% Pro subscriber
- Full creator dashboard, pack builder, analytics, payout management

---

## 15. CACHING & PERFORMANCE

### Cache Layer (`src/lib/cache.ts`)

In-memory `MemoryCache` class (no Redis dependency):
- Lazy eviction on `get()` when TTL expired
- Periodic sweep every 60 seconds
- **Not shared across server restarts or multiple instances**

| Cache Key | TTL |
|-----------|-----|
| `CATEGORIES` | 5 minutes |
| `PACKS_LIST` | 2 minutes |
| `PACK_DETAIL` | 10 minutes |
| `FEATURED` | 5 minutes |
| `TRENDING` | 5 minutes (keyed by category slug) |
| `BESTSELLERS` | 10 minutes |

Search queries bypass cache (too many key variants).

### Frontend Performance

- All routes are `React.lazy()` + `<Suspense>`
- Manual Vite chunks: `react-vendor`, `query-vendor`, `motion-vendor`, `radix-vendor`, `icons-vendor`, `router-vendor`, `form-vendor`
- Google Fonts: non-blocking load via `media="print"` onload trick
- `Cache-Control: public, max-age=31536000, immutable` on `/assets/*`
- Route chunks ≤ 10KB gzip; React vendor ~114KB gzip; Recharts ~107KB gzip

### Lighthouse Optimisations Applied

- Canonical URL, OG image, Twitter card, JSON-LD structured data in `index.html`
- `robots.txt` correctly served at root
- All icon-only links have `aria-label`
- `maximum-scale=1` → `maximum-scale=5` for accessibility
- Dark mode contrast ratios improved (WCAG AA)

---

## 16. FILE STORAGE & PDF GENERATION

### PDF Generator (`src/lib/pdf-generator.ts`)

Uses `pdfkit` to create branded A4 PDFs:
- Custom cover page (pack metadata, thumbnail)
- Table of contents
- Per-prompt pages with formatted body text
- Back cover with license terms

### Storage Strategy

| Environment | Storage |
|-------------|---------|
| Development | Local disk (`/public/files`) |
| Production | AWS S3 (falls back to local with warning if `AWS_ACCESS_KEY_ID` missing) |

### Download Gating

- `GET /api/user/purchases/:packId/download` requires auth + ownership verification
- Checks `order_items` table for a COMPLETED order containing the pack
- Increments `downloadCount` on each download
- Returns presigned S3 URL or local file URL

### File Upload Security (`src/lib/upload-security.ts`)

- Validates magic bytes (not just file extension)
- Generates UUID-based filenames
- Sanitises all file names
- Ready to be wired to Multer routes when file upload endpoints are added

---

## 17. EMAIL SYSTEM

### Email Library (`src/lib/email.ts`)

| Environment | Behaviour |
|-------------|-----------|
| Dev (no `RESEND_API_KEY`) | `console.log` the email content |
| Production | Send via Resend API |

### Email Types Implemented

- Email verification (registration)
- Password reset
- Order confirmation
- Download ready notification

### Missing Email Features

- Follow notifications
- Review notifications
- Price drop alerts
- Daily/weekly digest
- Abandoned cart reminder (24h)
- Marketing campaigns (admin-controlled)

---

## 18. OBSERVABILITY & ERROR TRACKING

### Sentry

- Initialised in `src/index.ts` (server) and `src/App.tsx` (client)
- No-ops safely when DSN env vars not set
- Server DSN: `SENTRY_DSN`
- Client DSN: `VITE_SENTRY_DSN`

### Logging

- **Library:** pino (structured JSON logging)
- **Logger:** `src/utils/logger.ts`
- **Standard levels:** `info`, `warn`, `error`, `debug`
- **Production requirement:** Replace all `console.log` in server code with pino logger

### Health Check (`GET /api/healthz`)

Returns:
```json
{
  "status": "ok",
  "timestamp": "ISO string",
  "version": "1.0.0",
  "uptime": 42,
  "services": {
    "database": { "status": "ok", "latencyMs": 12 },
    "redis": { "status": "ok", "latencyMs": 3 },
    "queue": { "status": "ok", "pending": 0, "active": 0, "failed": 0 }
  }
}
```

---

## 19. TESTING INFRASTRUCTURE

### Backend Tests (`artifacts/api-server`)

Runner: Vitest (`vitest.config.ts`)
Command: `pnpm --filter @workspace/api-server test`

| Test File | Coverage | Tests |
|-----------|----------|-------|
| `tests/auth.test.ts` | Registration, login, refresh, JWT security | ~25 |
| `tests/security.test.ts` | Role isolation, SQL injection, tampered JWT | ~20 |
| `tests/rate-limiters.test.ts` | Rate limit enforcement | ~10 |
| (packs, categories, reviews) | CRUD operations | ~15 |
| **Total** | | ~70 tests |

**Prerequisite:** DB must be migrated before running: `pnpm --filter @workspace/db run push`

### Frontend Tests (`artifacts/promptvault`)

Runner: Vitest
Command: `pnpm --filter @workspace/promptvault test`

| Test File | Coverage | Tests |
|-----------|----------|-------|
| `tests/query-keys.test.ts` | Query key structure | 13 |
| `tests/price-display.test.ts` | Price formatting | 10 |
| `tests/form-validation.test.ts` | Zod schemas, form UX | 31 |
| `tests/query-client.test.ts` | React Query config | 6 |
| **Total** | | 60 tests |

### E2E Tests (Playwright — planned)

See `docs/E2E-Testing.md` for full specifications.
4 test suites: purchase flow, admin pipeline, security, auth flows.

---

## 20. DEVELOPMENT WORKFLOWS & SCRIPTS

### Running the Application

```bash
# Install all dependencies
pnpm install

# Push DB schema (dev)
pnpm --filter @workspace/db run push

# Seed the database
pnpm --filter @workspace/scripts run seed

# Start frontend (port 19275)
pnpm --filter @workspace/promptvault run dev

# Start API server (port 8080)
pnpm --filter @workspace/api-server run dev
```

### Replit Workflows

| Workflow | Command | Port |
|----------|---------|------|
| `Start application` | Frontend dev | 19275 |
| `artifacts/api-server: API Server` | Backend dev | 8080 |
| `artifacts/promptvault: web` | Frontend (alias) | 19275 |
| `artifacts/mockup-sandbox: Component Preview Server` | Design sandbox | variable |

### Key Commands

```bash
# Typecheck entire workspace
pnpm run typecheck

# Build production bundle
BASE_PATH=/ pnpm --filter @workspace/promptvault build

# Build API server
pnpm --filter @workspace/api-server build

# Run all tests
pnpm --filter @workspace/api-server test
pnpm --filter @workspace/promptvault test

# Regenerate OpenAPI client + Zod schemas
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes
pnpm --filter @workspace/db run push
pnpm --filter @workspace/db run push-force  # force (destructive)
```

### Seed Data

After running seed (`pnpm --filter @workspace/scripts run seed`):

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Admin | `admin@promptvault.com` | `Admin123!` | ADMIN |
| Demo User | `demo@user.com` | `Demo123!` | USER |

| Coupon | Code | Type | Value |
|--------|------|------|-------|
| Welcome | `WELCOME20` | PERCENT | 20% |
| Save | `SAVE10` | FIXED | $10 |
| Half | `HALF50` | PERCENT | 50% |

---

## 21. ENVIRONMENT VARIABLES — COMPLETE REFERENCE

### Required (Always)

| Variable | Purpose | Default Dev Behaviour |
|----------|---------|----------------------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-provided by Replit |
| `NODE_ENV` | `development` or `production` | `development` |
| `PORT` | Server port | `8080` |

### Required in Production (Warning/Fallback in Dev)

| Variable | Purpose | Dev Fallback |
|----------|---------|-------------|
| `JWT_SECRET` | Access token signing | Hardcoded dev secret (warns) |
| `JWT_REFRESH_SECRET` | Refresh token signing | Hardcoded dev secret (warns) |
| `APP_URL` | Production domain | `http://localhost:PORT` |
| `CLIENT_URL` | Frontend domain for CORS | Replit dev domain |

### Payments (Stripe)

| Variable | Purpose | Dev Fallback |
|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | Server-side Stripe | Immediate mock order |
| `STRIPE_PUBLISHABLE_KEY` | Frontend Stripe | `pk_test_placeholder` |
| `STRIPE_WEBHOOK_SECRET` | Webhook sig verification | Skips verification in dev |

**Production requirement:** If `STRIPE_SECRET_KEY` missing → return HTTP 503

### AI Services

| Variable | Purpose | Dev Fallback |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | AI generation | Mock prompts (dev only) |
| `OPENAI_API_KEY` | DALL-E image generation | SVG placeholder |

**Production requirement:** If `ANTHROPIC_API_KEY` missing → fail job with error

### File Storage (AWS S3)

| Variable | Purpose | Dev Fallback |
|----------|---------|-------------|
| `AWS_ACCESS_KEY_ID` | S3 authentication | Local disk storage |
| `AWS_SECRET_ACCESS_KEY` | S3 authentication | Local disk storage |
| `AWS_BUCKET_NAME` | S3 bucket | `promptvault-files` |
| `AWS_REGION` | S3 region | `us-east-1` |
| `CDN_URL` | CDN for file delivery | Direct S3 or local URL |

### Email (Resend)

| Variable | Purpose | Dev Fallback |
|----------|---------|-------------|
| `RESEND_API_KEY` | Transactional email | `console.log` email content |
| `FROM_EMAIL` | Sender address | `noreply@promptvault.com` |

### Search (Meilisearch — Not yet implemented)

| Variable | Purpose |
|----------|---------|
| `MEILISEARCH_URL` | Meilisearch instance URL |
| `MEILISEARCH_KEY` | Meilisearch API key |

### Frontend (VITE_ prefix = public)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe frontend key |
| `VITE_SENTRY_DSN` | Frontend error tracking |
| `VITE_APP_NAME` | App display name |

### Monitoring

| Variable | Purpose |
|----------|---------|
| `SENTRY_DSN` | Server error tracking (optional) |
| `LOG_LEVEL` | Pino log level (`info`, `debug`, etc.) |
| `REDIS_URL` | Redis connection (currently unused — in-memory fallback) |

---

## 22. FEATURE STATUS — COMPLETE INVENTORY

### ✅ Fully Complete (Phase 1 MVP)

- User registration with disposable email blocking
- Email verification (token-based)
- Login / logout / silent refresh
- Forgot password + reset flow
- Pack browsing (explore, search, filter, sort)
- Infinite scroll on explore page
- Pack detail page (tabs: Overview, Prompts Preview, Reviews, FAQ)
- Prompt blurring for non-buyers (first 3 free preview)
- Wishlist (save/unsave packs)
- Single-item checkout via Stripe (test keys)
- Free pack claim
- Coupon codes at checkout
- Order history and order detail
- PDF download with ownership gating
- Review submission (requires purchase; one review per pack)
- Admin: dashboard KPIs, pack management, user management
- Admin: AI pack generation pipeline
- Admin: approval queue (approve/reject)
- Admin: category management (CRUD)
- Admin: analytics (basic)
- Admin: file management
- Admin: settings + feature flags
- Hidden admin login at `/pvx-admin`
- Cookie consent (GDPR)
- SEO: robots.txt, canonical URLs, OG tags, JSON-LD
- Legal pages: About, Privacy (GDPR), Terms, Contact
- Sentry error tracking (client + server)
- Rate limiting (login, register, forgot-password, search, global)
- Security headers (Helmet)
- Response serialization (whitelist-based)
- 130 unit tests (70 backend + 60 frontend)

### ⚠️ Partially Complete (Phase 2 — In Progress)

- Public user profiles (`/u/:username`) — UI partial, some backend missing
- Follow/unfollow system — backend exists, UI partial
- Collections — backend CRUD exists, UI partial
- Pack comments — backend exists, Comments tab added to pack detail
- Pack appreciation/likes — backend exists, UI missing
- Notifications bell + dropdown — polling works, real-time delivery missing
- Notification centre page — UI exists, full backend delivery missing
- Activity feed — backend + frontend partial
- Personal prompt library — backend + frontend partial
- Prompt viewer (copy, ChatGPT/Claude deep links) — partial
- Community prompts page — basic
- Referral programme — backend table + UI exists, credit system missing
- Cart — basic server-side cart
- Flash sales page — basic
- Gift redemption — route exists, logic incomplete
- Subscription page — UI exists, Stripe Subscriptions not implemented
- Admin: moderation, creators, analytics (advanced) — basic only

### ❌ Not Started (Phase 2 — Missing)

- Creator dashboard, pack builder, analytics, payouts
- Stripe Connect Express (creator payouts)
- Stripe Subscriptions (recurring billing)
- Stripe Customer Portal
- AI semantic search (pgvector + embeddings)
- Real-time Socket.IO notification delivery
- Email notifications per event type
- Notification preferences
- Variable injection in prompt viewer (`{variable}` → editable inputs)
- Pack appreciation button on cards
- User-to-user direct messaging
- Profile completion widget
- Enhanced share modal (OG card preview)
- Bundle packs
- Pack gifting flow
- Flash sale creation (admin)
- Teams workspace
- Affiliate programme commission tracking
- AI personalisation engine (collaborative filtering)
- Content moderation automation (OpenAI Moderation API)
- Trust score system
- Appeals system
- Accessibility settings
- i18n / translations (es, ja)
- Advanced admin: cohort analysis, email campaigns, audit log, API key manager
- Developer API platform (public REST API + webhooks)
- Mobile app (React Native + Expo)

---

## 23. KNOWN ISSUES & BUGS

For full detail, see `docs/Debug.md`. Key issues:

### Critical
- `BUG-001`: Subscription checkout returns placeholder Stripe URL
- `BUG-002`: Mock AI prompts can reach production if API key missing
- `BUG-003`: Pack cards don't update state after purchase
- `BUG-004`: Double-click Buy can create duplicate orders
- `BUG-005`: Admin approval count doesn't decrement in real-time

### High
- `BUG-006`: Coupon codes are case-sensitive (should be case-insensitive)
- `BUG-007`: Infinite scroll fires requests after last page
- `BUG-008`: Filter change mid-scroll shows stale data
- `BUG-009`: Category rename not propagated to explore sidebar
- `BUG-010`: Broken thumbnails not replaced with SVG fallback
- `BUG-011`: Review count/avg rating not updated after review submission
- `BUG-012`: Zero-review packs show malformed star display
- `BUG-013`: Multi-tab logout not detected

### Security Vulnerabilities
- `VULN-001`: Price tampering (verify server uses DB price only)
- `VULN-002`: Review without purchase (verify gate exists)
- `VULN-003`: Download without purchase (verify gate exists)
- `VULN-004`: Cross-user order access returns 404 instead of 403
- `VULN-005`: Admin can modify own account via admin panel
- `VULN-017`: CORS too broad in production (*.replit.dev allowed)

---

## 24. DESIGN SYSTEM & UI PATTERNS

### Colour System

- **Primary:** Purple gradient (`primary` Tailwind CSS 4 variable)
- **Background:** Dark-first design with light mode support
- **Dark mode primary:** Lightness `70%` (WCAG AA ~4.9:1 contrast)
- **Dark mode muted:** Lightness `65%`
- **Category colours:** Per-category hex stored in DB (`categories.color`)

### Typography

- **Body:** Inter (non-blocking Google Fonts load)
- **Headings:** Outfit
- **Code / Prompts:** Fira Code (monospace)
- **Font sizes:** Tailwind defaults + `text-5xl` for hero; `text-xl` for section headers

### Component Conventions

- All Radix UI primitives available in `src/components/ui/`
- Use `cn()` from `src/lib/utils.ts` for conditional class merging
- Pack cards always use `PackCard` component from `src/components/shared/pack-card.tsx`
- Skeleton loaders match content shape; visible ≥ 200ms minimum
- Toast notifications: 4 variants (success/error/warning/info) via `useToast` hook

### Responsive Breakpoints (Tailwind)

| Breakpoint | Min Width |
|-----------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

Mobile-first approach. All layouts must render without horizontal scroll at 375px.

---

## 25. BUSINESS RULES & LOGIC

### Pricing Rules

- Prices stored as integers in cents (`priceCents: 2999` = $29.99)
- Server **never** reads price from client request body — always from DB
- `isFree: true` packs skip Stripe entirely; $0 order created immediately
- Coupon discount applied server-side: `PERCENT` or `FIXED`; minimum order total = $0

### Purchase Rules

- Users can only purchase a pack once (duplicate purchase prevented)
- Review requires verified purchase in `order_items`
- Download requires verified purchase
- A review can only be submitted once per pack per user

### Pack Status Flow

```
DRAFT → AI_GENERATED → PENDING_REVIEW → PUBLISHED
                                      → REJECTED
PUBLISHED → ARCHIVED
```

### Refund Policy

All sales are final. No money-back guarantee. No refund window. This is explicitly stated on:
homepage, checkout page, terms of service, pack detail page.

### Content Policy

Packs must not contain: hate speech, adult content, violence, spam, or duplicate prompts.
Violation results in pack rejection and potentially user suspension.

### Creator Revenue Share

- Standard creators: 70% of pack sale price
- Pro subscribers who are creators: 80%
- Platform keeps 30%/20%
- Monthly payouts via Stripe Connect (minimum $50)

---

## 26. DEPLOYMENT & PRODUCTION

### Production Build

```bash
# Build frontend
BASE_PATH=/ pnpm --filter @workspace/promptvault build
# Output: artifacts/promptvault/dist/

# Build API server
pnpm --filter @workspace/api-server build
# Output: artifacts/api-server/dist/index.cjs
```

### Deployment Platform

Replit hosting (current). The platform auto-provisions:
- PostgreSQL database (`DATABASE_URL` env var)
- HTTP port routing

### Pre-Deployment Checklist

From `docs/Debug.md` Section 8. Key items:

```bash
# No TypeScript errors
pnpm run typecheck

# No vulnerabilities
npm audit --audit-level=moderate

# No mock data in production code
grep -r "mock\|fake\|dummy" artifacts/promptvault/src/ --include="*.tsx" --include="*.ts" | grep -v test

# Health check passes
curl /api/healthz

# Production build succeeds
NODE_ENV=production pnpm --filter @workspace/api-server build

# Lighthouse ≥ 90 on all categories
npx lighthouse http://localhost:19275
```

### Required Production Environment Variables

At minimum:
- `DATABASE_URL` (Replit provides)
- `JWT_SECRET` (≥ 32 random chars)
- `JWT_REFRESH_SECRET` (≥ 32 random chars, different from above)
- `STRIPE_SECRET_KEY` (live key)
- `STRIPE_PUBLISHABLE_KEY` (live key)
- `STRIPE_WEBHOOK_SECRET`
- `APP_URL` (production domain)
- `CLIENT_URL` (production domain)
- `ANTHROPIC_API_KEY` (for AI generation)
- `RESEND_API_KEY` (for email)

---

## 27. FUTURE ROADMAP

### P0 — Ship Immediately

1. Remove all mock data from production code paths
2. Complete user profile system (username, cover image, bio, social links)
3. Add pack appreciation (like) button
4. Complete notification delivery (Socket.IO + email per-event)
5. Add notification preferences
6. Complete prompt viewer (variable injection, mark as used)
7. Fix all security vulnerabilities (VULN-001 through VULN-005)

### P1 — Sprint 2 (Revenue Impact)

1. Stripe Subscriptions (recurring billing, Stripe Customer Portal)
2. Stripe Connect Express (creator payouts)
3. Creator dashboard, pack builder, analytics
4. AI semantic search (pgvector + embeddings)
5. Social features completion (messaging, enhanced sharing)
6. Bundle packs
7. Pack gifting
8. Affiliate commission tracking

### P2 — Sprint 3 (Competitive Differentiation)

1. AI personalisation engine (collaborative filtering)
2. Content moderation automation (OpenAI Moderation API)
3. Trust score system
4. Accessibility audit + ARIA completion
5. i18n: Spanish (es) and Japanese (ja)
6. Advanced admin: cohort analysis, email campaigns, audit log

### P3 — Future Roadmap

1. React Native mobile app (Expo)
2. Developer API platform (public REST + webhooks)
3. White-label licensing
4. Enterprise SSO

---

*This document is the permanent project memory. Update it whenever architecture changes, new features are added, or design decisions are made.*
