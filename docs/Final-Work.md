# PromptVault Production Readiness Audit

## 1. Executive Summary
This document serves as the master implementation gap report for PromptVault prior to production deployment. A full deep engineering audit has been conducted across `artifacts/promptvault` (frontend), `artifacts/api-server` (backend), `lib/db` (database schemas), and all PRDs. While the Phase 1 core marketplace loop (user registration, pack browsing, Stripe checkout, PDF download) is robust and operational, the platform falls significantly short of the Phase 2 PRD Advanced Professional Industry-Level Completion Spec.

Crucially, the platform lacks a true multi-seller creator ecosystem, recurring revenue subscriptions, social interaction features (comments, collections, appreciations), advanced AI semantic search, and automated content moderation. There are numerous empty or mock-driven UI screens, missing REST endpoints, database schema gaps, and several critical security vulnerabilities (e.g., admin self-escalation) that block a safe production release.

## 2. Architecture Overview
- **Frontend (`artifacts/promptvault`)**: React 19 Single Page Application using Vite, TanStack Query, Zustand, Wouter, and Tailwind CSS. The UI is generally well-structured for MVP but relies heavily on mock data (`MOCK_MEMBERS`, `MOCK_EXPERIMENTS`) for advanced administrative and dashboard screens.
- **Backend (`artifacts/api-server`)**: Express 5 REST API using TypeScript and Drizzle ORM. Features structured Zod validation and structured Pino logging. Missing several Phase 2 endpoints (especially related to Stripe Connect, Stripe Subscriptions, and WebSocket real-time notifications).
- **Database (`lib/db`)**: PostgreSQL. Phase 1 schema (users, packs, prompts, orders, reviews) is solid. Phase 2 schema (collections, comments, appreciations) is partially present. Several crucial tables (`pack_embeddings`, `subscription_credits`, `team_workspaces`, `affiliate_programs`) are completely missing.
- **Infrastructure**: Configured for Replit with PM2/Node. In-memory caching (`MemoryCache`) is currently used, which is a severe performance and consistency risk for production (Redis is required). S3 storage fallback logic is precarious.

## 3. PRD Compliance Audit
| Feature Name | Required by PRD | Implemented? | Location in Code | Notes |
|--------------|-----------------|--------------|------------------|-------|
| **User Profile System** | Yes | Partial | `src/routes/user.ts`, `user-profile.tsx` | Basic profile editing exists. Public profile (`/u/:username`) missing backend fields (e.g., `twitterHandle`, `followerCount`). |
| **Social Follows & Activity Feed** | Yes | Partial | `src/routes/social.ts`, `activity-feed.tsx` | DB schema exists. API endpoints exist. UI is incomplete and largely non-functional. |
| **Collections (Playlists)** | Yes | Partial | `src/routes/social.ts`, `collections.tsx` | Basic CRUD exists. UI for viewing collections and adding packs is incomplete. |
| **Pack Comments & Discussion** | Yes | Partial | `src/routes/social.ts` | Backend exists. UI integration into the pack detail page is incomplete. |
| **Like / Appreciate System** | Yes | Partial | `src/routes/social.ts` | Backend exists. Missing UI toggle button on pack cards and detail pages. |
| **Advanced Semantic AI Search** | Yes | No | `src/routes/search.ts`, `search.tsx` | Falls back to basic PostgreSQL `ILIKE`. `pgvector` and OpenAI embeddings not implemented. |
| **Notification Centre** | Yes | Partial | `src/routes/notifications.ts`, `notifications.tsx` | DB polling works. Real-time Socket.IO delivery and email digests are missing. |
| **Prompt Viewer & Library** | Yes | Partial | `src/routes/prompt-library.ts`, `prompt-library.tsx` | Basic UI exists. Missing variable injection/customization logic. |
| **Creator Application & Dashboard** | Yes | No | `src/routes/creator.ts`, `creator/` pages | UI pages are empty stubs. No Stripe Connect Express onboarding. |
| **Creator Pack Builder** | Yes | No | `src/routes/creator.ts`, `new-pack.tsx` | Empty stub. Creators cannot currently build and submit their own packs. |
| **Bundle Packs** | Yes | No | N/A | Missing from database schema entirely. |
| **Pack Gifting** | Yes | Partial | `src/routes/gifts.ts`, `gift-redeem.tsx` | Route exists, but business logic for token redemption and cart flow is incomplete. |
| **Cart & Multi-Item Checkout** | Yes | Partial | `src/routes/cart.ts`, `cart.tsx` | Basic server-side cart. Stripe checkout flow currently only supports single "Buy Now" reliably. |
| **Dynamic Pricing & Flash Sales** | Yes | No | N/A | UI is basic. Backend `sale_events` tracking and chron jobs missing. |
| **Subscriptions (Pro/Teams)** | Yes | No | `src/routes/subscriptions.ts`, `subscription.tsx` | UI is a placeholder. Backend returns hardcoded mock Stripe URLs instead of creating real subscription sessions. |
| **Pack Credits System** | Yes | No | N/A | Missing `subscription_credits` table and monthly BullMQ cron job. |
| **Affiliate & Referral Program** | Yes | Partial | `src/routes/social.ts`, `referrals.tsx` | `referrals` table exists. UI exists. Credit reward system logic is missing. Affiliate program missing entirely. |
| **AI Personalization Engine** | Yes | No | N/A | Nightly collaborative filtering BullMQ job missing. `user_recommendations` table missing. |
| **Content Moderation & Trust Scores** | Yes | Partial | `src/routes/admin.ts`, `moderation.tsx` | Basic approval queue exists. Automated AI pre-screening (OpenAI Moderation API) and Trust Scores missing. |
| **Accessibility (WCAG 2.1 AA) & i18n** | Yes | Partial | Global UI | English only. Missing `aria-labels` on icon buttons, poor focus trapping in modals. |

## 4. Missing Features
### Frontend
- **Creator Expansion**: `Creator Dashboard`, `Pack Builder`, `Creator Analytics`, `Payout Management` are completely missing (empty stubs).
- **Commerce**: `Bundle Pack Pages` (and UI rendering of bundled items), robust `Try-Before-You-Buy` prompt preview limitations.
- **Social**: Fully operational `Activity Feed` for followed users, functional `Collections` UI, `Direct Messaging` inbox.
- **Admin**: `A/B Testing Dashboard`, `SEO Management`, `Customer Support Interface` (all rely on mock data or are highly basic).

### Backend
- **Creator Expansion**: Endpoints to manage Stripe Connect KYC and payouts. Endpoints to accept, process, and moderate creator-submitted packs.
- **Commerce**: Multi-item Stripe Checkout generation, proper Stripe Subscriptions API integration, Subscription credit redemption logic, Bundle pack fulfillment.
- **Search**: AI Embeddings generation job (using OpenAI/Anthropic), cosine similarity search via `pgvector`.
- **Notifications**: WebSocket connection management and real-time delivery to user namespaces. Email digest cron jobs via BullMQ.
- **Moderation**: Automated AI quality scoring and policy violation checks for user-submitted content.

## 5. Broken or Incomplete Features
- **Subscription Checkout**: `POST /api/subscriptions/upgrade` currently returns a dummy Stripe URL `https://checkout.stripe.com/pay/placeholder`.
- **Cart Session & Coupons**: `POST /api/checkout/session` fetches multiple packs, but if a coupon is applied, the discount logic does not gracefully handle `discountType` distribution accurately across multiple items.
- **Search Queries**: `GET /api/search` uses `ILIKE` on titles/descriptions without a `GIN` index, creating a massive performance bottleneck on large databases.
- **Profile Completion Widget**: UI widget logic exists, but the backend point calculation for "Profile Completion" (as defined in PRD) is missing.
- **Admin KPI Counts**: Admin approval queue count does not update via WebSocket dynamically; requires a manual page refresh.

## 6. Security Issues
### Critical (🔴)
- **VULN-005**: `artifacts/api-server/src/routes/admin.ts` (`PATCH /users/:id` and `DELETE /users/:id`) does not adequately prevent an admin from modifying or removing their own role. There is a guard in the `DELETE` route (`if (id === req.user!.userId)`), but it is missing in the `PATCH` route, allowing self-escalation or accidental lockout.
- **VULN-006**: Coupon redemption in `checkout.ts` increments `usesCount` *after* the Stripe session is created, creating a race condition where multiple users can exploit a single-use coupon simultaneously before the webhook finalizes the order.

### High (🟠)
- **VULN-009**: File download (`GET /api/user/downloads/:packId`) accepts `fileType` from the query string (`PDF` or `ZIP`). Path construction in `generatePackPDF` must be strictly sanitized to prevent path traversal, even though `packId` is type-coerced to an integer.
- **VULN-020**: Missing Multer file size limits across the entire application. Avatar, cover image, and file upload endpoints must explicitly cap sizes (e.g., 5MB/10MB) to prevent denial of service (DoS).

### Medium (🟡)
- **VULN-017**: CORS configuration (`artifacts/api-server/src/app.ts`) allows `origin.includes(".replit.dev")` if `isDev` logic evaluates incorrectly in production. This wildcard approach is extremely dangerous and must be locked to exactly `process.env.CLIENT_URL`.

## 7. Database Problems
- **Missing Tables**:
  - `pack_embeddings` (Requires `pgvector` extension)
  - `subscription_credits`
  - `team_workspaces`
  - `team_members`
  - `affiliate_programs`
  - `affiliate_conversions`
  - `user_recommendations`
  - `community_prompts`
  - `support_tickets`
  - `ticket_messages`
  - `api_keys`
- **Missing Fields**:
  - `users` table is missing: `username`, `coverImageUrl`, `location`, `websiteUrl`, `twitterHandle`, `linkedinUrl`, `githubHandle`, `youtubeUrl`, `specialties`, `isCreator`, `totalDownloadsAllPacks`, `publicPackCount`, `followerCount`, `followingCount`, `profileVisibility`, `creditBalanceCents`, `trustScore`, `subscriptionPlan`, `subscriptionStatus`.
  - `prompt_packs` table is missing: `creatorId` (FK to users), `packType` (single/bundle).
- **Indexing**: Missing `CREATE INDEX CONCURRENTLY ON packs USING gin(to_tsvector('english', title || ' ' || description))` to support the current `ILIKE` search queries.
- **Foreign Keys**: Proper `ON DELETE CASCADE` or `SET NULL` behaviors are not fully verified for `creatorId` references once creators can be deleted.

## 8. UI / UX Issues
- **Empty Stubs**: Routes like `/creator/dashboard`, `/creator/packs/new`, `/creator/analytics`, `/creator/payouts`, `/dashboard/verification`, `/developer` are rendering completely empty or blank pages.
- **Mock Data**:
  - `/dashboard/team` uses `MOCK_MEMBERS`.
  - `/admin/experiments` uses `MOCK_EXPERIMENTS`.
  - `/admin/finance` renders charts based on partial or mocked analytical structures if the API is returning limited MVP data.
  - Form placeholders throughout the app (e.g., `write-review.tsx`, `contact.tsx`) are often generic and lack functional error validation states in edge cases.
- **Accessibility**: Missing `aria-labels` on social links, missing `width`/`height` attributes on dynamic thumbnails causing Cumulative Layout Shifts (CLS).

## 9. Performance Risks
- **In-Memory Cache**: The application uses a custom `MemoryCache` class (`lib/cache.ts`). In a multi-instance production environment, this causes massive data inconsistencies and memory bloat. A full Redis integration is mandatory.
- **N+1 Queries**: Several admin endpoints (e.g., fetching user lists with associated order counts) rely on iterative `.map()` database calls instead of optimized SQL `JOIN`s or CTEs.
- **Client Bundle Size**: `Recharts` and extensive form validation libraries are loaded eagerly. They should be dynamically imported using `React.lazy()` for administrative routes to keep the main bundle < 200KB gzipped.
- **Pagination Overhead**: `GET /api/packs` returns `count(*)` on every infinite scroll request. On large tables, this count query becomes extremely slow and should be cached or estimated.

## 10. Mock Data / Placeholder Logic
**Files requiring cleanup before deployment:**
- `artifacts/promptvault/src/pages/dashboard/team.tsx` (Lines 10-60)
- `artifacts/promptvault/src/pages/admin/experiments.tsx` (Lines 13-60)
- `artifacts/api-server/src/routes/subscriptions.ts` (Line 39) - Hardcoded Stripe URL.
- `artifacts/promptvault/src/tests/components/price-display.test.tsx` (Mock usage is fine for tests, but check for leaked mock objects in UI).
- Missing AI fallback in `artifacts/api-server/src/routes/admin.ts` (Line 535) correctly throws an error, but ensure other AI features (like automated SEO generation) don't silently fallback to mock strings.

## 11. Deployment Readiness Issues
- **Missing Environment Variable Guards**: While `DATABASE_URL` and JWT secrets are validated on startup in `index.ts`, payment and storage keys (`STRIPE_SECRET_KEY`, `AWS_ACCESS_KEY_ID`) do not fail hard. They fallback to local disk or mock orders, which is catastrophic if pushed to production silently.
- **Email Delivery**: Uses `console.log` fallback in dev without `RESEND_API_KEY`. In production, if Resend fails, the application does not queue emails robustly.
- **CORS Production Lock**: Must lock `cors` to strictly match the exact `CLIENT_URL` string without `.includes()` wildcards.

## 12. End-to-End Flow Failures
- **Creator Onboarding to Publish**: Flow is fundamentally broken. A user cannot apply, get approved, link Stripe Connect, create a pack via the UI, and have it appear on the marketplace.
- **Subscription Purchase**: Flow is fundamentally broken. Users cannot purchase a recurring Pro/Teams subscription, manage their billing portal, or redeem pack credits.
- **Semantic Search**: Fails. Users searching by conceptual intent rather than exact keywords will receive zero results until `pgvector` embeddings are implemented.

## 13. Required Screens Not Implemented (Or Stubs)
- `SCR-033` Public User Profile (Needs extended backend data)
- `SCR-038` User Activity Feed
- `SCR-040` Account Verification Flow
- `SCR-046` Community Prompts
- `SCR-054` Prompt Template Editor
- `SCR-056` Creator Dashboard
- `SCR-057` Creator Pack Builder
- `SCR-058` Creator Analytics
- `SCR-059` Creator Payout Management
- `SCR-060` Bundle Pack Pages
- `SCR-067` Teams Workspace (Currently Mocked)
- `SCR-069` Affiliate Dashboard
- `SCR-070` Personalised Homepage
- `SCR-074` Creator Management Panel (Admin)
- `SCR-077` A/B Testing Dashboard (Admin - Currently Mocked)
- `SCR-080` Developer API Platform & Docs

## 14. Final Implementation Checklist
1. **Remove Mock Data**: Eradicate `MOCK_MEMBERS`, `MOCK_EXPERIMENTS`, and hardcoded Stripe URLs.
2. **Schema Upgrade**: Write and run Drizzle migrations for all missing Phase 2 tables (Embeddings, Subscriptions, Affiliates, Teams).
3. **Security Fixes**: Patch Admin privilege escalation (`PATCH /users/:id`), enforce exact CORS matching, and implement Multer upload limits.
4. **Stripe Integration**: Implement Stripe Connect Express (Creator Payouts) and Stripe Subscriptions API.
5. **AI Search**: Enable `pgvector`, write the BullMQ embedding generation job, and update the search endpoint.
6. **Real-time Engine**: Connect Socket.IO for live notification delivery.
7. **Infrastructure**: Provision and connect a production Redis instance (replace `MemoryCache`).
