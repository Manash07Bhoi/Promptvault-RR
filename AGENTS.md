# PromptVault Implementation Working Plan (Agents Guide)

> **Purpose:** This file contains the complete, step-by-step master execution plan for AI agents (and human engineers) to finalize the PromptVault platform for a production deployment. It is based on the comprehensive Phase 2 PRD Gap Analysis (`docs/Final-Work.md`).

---

## General Instructions for Agents
1. **Scope:** You are building Phase 2 of an advanced SaaS marketplace.
2. **Tech Stack:** React 19, Vite, TanStack Query, Zustand, Wouter, Tailwind CSS (Frontend: `artifacts/promptvault`). Express 5, TypeScript, Drizzle ORM, PostgreSQL (Backend: `artifacts/api-server`).
3. **Execution Rules:**
   - **Never use mock data** (`MOCK_MEMBERS`, `MOCK_EXPERIMENTS`) in production UI routes.
   - **Database First:** Always update the Drizzle schema (`lib/db/src/schema/`) and run migrations (`drizzle-kit generate`/`push`) before building backend routes.
   - **Security:** Ensure every endpoint has strict Zod validation, Multer file size limits (5MB/10MB), exact CORS matching, and proper privilege checks (e.g., preventing admin self-escalation).
   - **Testing:** After implementing a feature, run the `artifacts/api-server` tests and verify frontend changes using the provided Playwright UI verification scripts.
   - **Read the PRD:** Always reference `docs/Final-Work.md`, `docs/Debug.md`, and `docs/E2E-Testing.md` for specific business logic rules.

---

## Phase 1: Security & Infrastructure Hardening (P0)
**Goal:** Patch all critical vulnerabilities preventing a safe baseline deployment.

- [ ] **Task 1.1: Fix Admin Privilege Escalation (VULN-005/VULN-022)**
  - File: `artifacts/api-server/src/routes/admin.ts`
  - Action: Add `if (id === req.user!.userId) { res.status(400).json({ error: "Cannot modify own account" }); return; }` to the `PATCH /users/:id` route.
- [ ] **Task 1.2: Lock CORS Configuration (VULN-017/VULN-023)**
  - File: `artifacts/api-server/src/app.ts`
  - Action: In production (`isDev === false`), strictly match `origin` against `process.env.CLIENT_URL` and `process.env.APP_URL` exactly. Remove `.includes()` wildcard logic for production.
- [ ] **Task 1.3: Enforce File Upload Limits (VULN-020)**
  - File: Across `artifacts/api-server/src/routes/`
  - Action: Ensure any Multer middleware explicitly sets `limits: { fileSize: 5 * 1024 * 1024 }` (or 10MB for covers).
- [ ] **Task 1.4: Fix Stripe Subscription Dummy URL (BUG-026)**
  - File: `artifacts/api-server/src/routes/subscriptions.ts`
  - Action: Replace the hardcoded `https://checkout.stripe.com/pay/placeholder` URL with a real Stripe Checkout Session creation for `mode: 'subscription'`.

## Phase 2: Database Schema Completion (P0)
**Goal:** Build the missing foundation for Phase 2 features.

- [ ] **Task 2.1: Add Missing Core Tables**
  - File: `lib/db/src/schema/`
  - Action: Define Drizzle schemas for:
    - `pack_embeddings` (Requires `VECTOR(1536)` for semantic search).
    - `subscription_credits` (Tracks unused monthly pack credits).
    - `team_workspaces` and `team_members` (Teams subscription tier).
    - `affiliate_programs` and `affiliate_conversions`.
    - `user_recommendations` (Cache for collaborative filtering).
    - `community_prompts` (Free public prompt submissions).
    - `api_keys` (Developer platform).
- [ ] **Task 2.2: Add Missing Fields to Existing Tables**
  - File: `lib/db/src/schema/users.ts` & `packs.ts`
  - Action:
    - `users`: Add `username`, `coverImageUrl`, `social links` (Twitter, LinkedIn, etc.), `specialties`, `isCreator`, `subscriptionPlan`, `trustScore`, `creditBalanceCents`, `profileVisibility`.
    - `packs`: Add `creatorId` (FK to users) and `packType` (single/bundle).
- [ ] **Task 2.3: Run Migrations**
  - Action: Run Drizzle kit to generate and push these schema changes.

## Phase 3: Creator Ecosystem & Multi-Seller Marketplace (P1)
**Goal:** Transform the platform from single-seller to multi-seller.

- [ ] **Task 3.1: Creator Application & Admin Approval**
  - Frontend: Build `/become-a-creator` and `/admin/creators` (replace empty stubs).
  - Backend: Implement endpoints to submit, approve, and reject applications, granting `isCreator` status.
- [ ] **Task 3.2: Creator Dashboard & Analytics**
  - Frontend: Build `/creator/dashboard`, `/creator/analytics` (replace stubs).
  - Backend: Implement aggregations for a creator's specific `creatorId` revenue, downloads, and views.
- [ ] **Task 3.3: Creator Pack Builder**
  - Frontend: Build `/creator/packs/new` allowing creators to author Title, Description, Tags, Pricing, and Prompts.
  - Backend: Implement `POST /api/creator/packs` that sets status to `PENDING_REVIEW` and links to their `creatorId`.
- [ ] **Task 3.4: Stripe Connect Payouts**
  - Frontend: Build `/creator/payouts`.
  - Backend: Integrate Stripe Connect Express onboarding flow and automated monthly payout logic honoring the platform/creator revenue split (70/30 or 80/20 for Pro).

## Phase 4: Advanced Commerce & Subscriptions (P1)
**Goal:** Increase Average Order Value (AOV) and establish recurring revenue.

- [ ] **Task 4.1: Pro/Teams Subscriptions**
  - Frontend: Build `/dashboard/subscription` and `/dashboard/team` (remove `MOCK_MEMBERS`).
  - Backend: Implement Stripe Billing webhook handlers for `invoice.paid` to provision `subscription_credits` and update the `users` table plan status.
- [ ] **Task 4.2: Credit Redemption & Cart Upgrade**
  - Frontend: Build the Cart Drawer/Checkout capable of holding multiple items and selecting "Apply 1 Pack Credit".
  - Backend: Update `POST /api/checkout/session` to support multi-item line items and $0 orders when credits are consumed.
- [ ] **Task 4.3: Bundle Packs & Gifting**
  - Frontend: Build UI for Bundle Packs and the Pack Gifting modal/redemption page (`/gift/:token`).
  - Backend: Implement logic to process a bundle purchase (granting access to multiple underlying packs) and generate/redeem gift tokens.

## Phase 5: Semantic AI Search & Discovery (P1)
**Goal:** Replace basic `ILIKE` keyword matching with intent-based AI search.

- [ ] **Task 5.1: Vector Embeddings Generation Job**
  - Backend: Create a BullMQ job that calls the OpenAI `text-embedding-3-small` API for a pack's Title + Description + Tags and stores the `VECTOR(1536)` in `pack_embeddings`. Trigger this on pack publish/update.
- [ ] **Task 5.2: Hybrid Search Endpoint**
  - Backend: Rewrite `GET /api/search` to perform a cosine similarity match against `pack_embeddings` blended with BM25 keyword matching.
- [ ] **Task 5.3: AI Personalization Engine**
  - Backend: Create a nightly BullMQ job to populate `user_recommendations` based on collaborative filtering (users who bought X also bought Y).
  - Frontend: Implement "Because you bought X" widgets on the homepage and post-purchase screens.

## Phase 6: Social, Community & Prompt Interactions (P2)
**Goal:** Drive organic retention and community engagement.

- [ ] **Task 6.1: Public User Profiles**
  - Frontend: Complete `/u/:username` showing the creator's published packs, social links, followers, and stats.
- [ ] **Task 6.2: Collections & Playlists**
  - Frontend: Build `/collections` and `/collections/:id` allowing users to curate and share lists of packs.
- [ ] **Task 6.3: Prompt Viewer & Customization**
  - Frontend: Build `/dashboard/packs/:packId/prompts`. Implement the variable injection UI (e.g., turning `{audience}` into an input field that updates the prompt text live).
  - Backend: Implement prompt bookmarking/favoriting endpoints (`/api/prompts/:id/bookmark`).
- [ ] **Task 6.4: Real-time Notifications & Messaging**
  - Backend: Connect `Socket.IO` to emit real-time events (new follower, pack purchase) to user namespaces.
  - Frontend: Connect the Navbar bell icon to the WebSocket stream. Build `/dashboard/messages` for creator-buyer DM threads.

## Phase 7: Content Moderation & Admin Tooling (P2)
**Goal:** Automate trust and safety at scale.

- [ ] **Task 7.1: Automated AI Pre-Screening**
  - Backend: Hook user-submitted packs into the OpenAI Moderation API to flag hate/violence/sexual content before it reaches the human admin queue.
- [ ] **Task 7.2: Replace Mock Admin Data**
  - Frontend: Refactor `/admin/experiments` and `/admin/finance` to remove `MOCK_EXPERIMENTS` and fetch real A/B testing or analytical data.
- [ ] **Task 7.3: Developer API Platform**
  - Backend: Implement read-only public API routes protected by long-lived API keys (`/api/v1/packs`, `/api/v1/search`).
  - Frontend: Build `/developer` and `/docs/api` for API key generation and Swagger/OpenAPI documentation.

---
*Execute these phases sequentially. Always run tests and UI verification before marking a phase complete.*
