# PromptVault — Debug, Security & Issues Reference

> **Document Purpose:** Comprehensive catalogue of identified bugs, security vulnerabilities,
> required fixes, and debugging guidance for PromptVault.
>
> **Last Reviewed:** March 14, 2026
> **Scope:** Frontend (React/Vite), Backend (Express/Drizzle), Database (PostgreSQL), Infrastructure

---

## Severity Legend

| Symbol | Severity | Description |
|--------|----------|-------------|
| 🔴 CRITICAL | Production-breaking or exploitable security vulnerability |
| 🟠 HIGH | Significant UX breakage or data integrity risk |
| 🟡 MEDIUM | Noticeable bug or partial feature failure |
| 🔵 LOW | Minor UI/UX issue or code quality concern |

---

## SECTION 1 — SECURITY VULNERABILITIES

### 1.1 Business Logic Vulnerabilities 🔴

#### VULN-001: Price Tampering at Checkout
- **Risk:** A user can craft a POST to `/api/checkout/session` with a manually lowered `priceCents`
- **Test:** `curl -X POST .../api/checkout/session -d '{"packId":"...","priceCents":1}'`
- **Expected:** Server uses DB price only, ignores client-supplied price
- **Fix Status:** ⚠️ Verify the checkout route fetches price from DB and never reads it from request body
- **File:** `artifacts/api-server/src/routes/checkout.ts`

#### VULN-002: Review Without Purchase
- **Risk:** Any authenticated user can POST a review for a pack they have not purchased
- **Test:** POST `/api/reviews` with valid auth token for a pack not in the user's orders
- **Expected:** HTTP 403 "You must purchase this pack to review it"
- **Fix Status:** ⚠️ Verify purchase ownership check exists in review route handler
- **File:** `artifacts/api-server/src/routes/reviews.ts`

#### VULN-003: Download Without Purchase
- **Risk:** Any authenticated user can attempt to download files for unpurchased packs
- **Test:** GET `/api/user/purchases/:packId/download` without owning the pack
- **Expected:** HTTP 403 "You do not own this pack"
- **Fix Status:** ⚠️ Verify ownership middleware on download endpoints
- **File:** `artifacts/api-server/src/routes/orders.ts`

#### VULN-004: Cross-User Order Access
- **Risk:** User A can access User B's order by guessing the order ID
- **Test:** GET `/api/orders/:someoneElsesOrderId` with User A's token
- **Expected:** HTTP 403 (NOT 404 — 404 would confirm the order exists, leaking information)
- **Fix Status:** ⚠️ Verify `WHERE userId = req.user.userId` is in the orders query
- **File:** `artifacts/api-server/src/routes/orders.ts`

#### VULN-005: Admin Self-Privilege Escalation / Self-Deletion
- **Risk:** An admin can revoke their own admin role or delete their own account via the admin panel
- **Expected:** Prevent admin from modifying their own account through admin routes
- **Fix Status:** ❌ Add guard: `if (targetUserId === req.user.userId) return 400`
- **File:** `artifacts/api-server/src/routes/admin.ts`

#### VULN-006: Coupon Stacking
- **Risk:** User applies two or more coupons to a single order
- **Expected:** One coupon per order; second coupon rejected with clear error
- **Fix Status:** ⚠️ Verify single-coupon enforcement at checkout
- **File:** `artifacts/api-server/src/routes/checkout.ts`

#### VULN-007: Simultaneous Coupon Race Condition
- **Risk:** Two users applying a single-use coupon at the exact same moment, both succeed
- **Fix:** Use a database transaction with `SELECT FOR UPDATE` on the coupon row; check `usesCount < maxUses` before incrementing
- **Fix Status:** ❌ Not confirmed implemented
- **File:** `artifacts/api-server/src/routes/checkout.ts`

---

### 1.2 Input Validation Vulnerabilities 🔴

#### VULN-008: XSS via Pack Title / Body Fields
- **Risk:** Admin creates a pack with `<script>alert(1)</script>` in the title; rendered unsanitized in browser
- **Test:** POST to admin pack creation with script tag in `title` field
- **Expected:** Stored as escaped text; never executed in browser
- **Fix:** Ensure output escaping in React (default, but verify dangerouslySetInnerHTML is NOT used on user content); sanitize on server side for any HTML fields
- **Fix Status:** ⚠️ React escapes by default; verify no `dangerouslySetInnerHTML` on user content

#### VULN-009: Path Traversal in File Download
- **Risk:** Crafted URL with `../` traversal could access filesystem files
- **Test:** GET `/api/user/purchases/../../../etc/passwd/download`
- **Expected:** HTTP 400 or 404; no file system access
- **Fix:** Validate and sanitize all path parameters; use `path.basename()` to strip directory components
- **Fix Status:** ⚠️ Verify in download endpoint
- **File:** `artifacts/api-server/src/routes/orders.ts`

#### VULN-010: Oversized Payload (DoS)
- **Risk:** Large payloads (>2MB) crash the server or cause memory exhaustion
- **Current State:** Body limit is set to `2mb` in `app.ts` (JSON and URL-encoded)
- **Fix Status:** ✅ Partially mitigated — verify `express.json({ limit: '1mb' })` on file upload endpoints
- **Additional:** All Multer upload endpoints must have `limits: { fileSize: 5 * 1024 * 1024 }` explicit

#### VULN-011: Integer Overflow in Pagination
- **Risk:** `?page=99999999999999999` causes incorrect offset calculation or DB errors
- **Fix:** Validate `page` parameter: `z.number().int().min(1).max(1000)`
- **Fix Status:** ⚠️ Verify Zod validation on all paginated endpoints

#### VULN-012: Negative Price / Discount Values
- **Risk:** Admin creates a coupon with `discountValue: -50`, causing negative prices
- **Fix:** Zod schema: `discountValue: z.number().positive()` on coupon creation
- **Fix Status:** ⚠️ Verify validation on coupon creation route

---

### 1.3 Authentication & Session Security 🔴

#### VULN-013: Admin Route Accessible to Buyer Tokens
- **Risk:** A buyer's JWT token accepted on `/api/admin/*` endpoints
- **Test:** GET `/api/admin/dashboard` with a buyer's Bearer token
- **Expected:** HTTP 403
- **Fix:** Verify `requireAdmin` middleware checks `user.role === 'admin'`
- **Fix Status:** ⚠️ Verify middleware chain on all admin routes
- **File:** `artifacts/api-server/src/middlewares/auth.ts`

#### VULN-014: JWT Secret Strength
- **Risk:** Weak or default JWT secret allows token forgery
- **Fix:** `JWT_SECRET` and `JWT_REFRESH_SECRET` must each be ≥ 32 random characters
- **Fix Status:** ⚠️ Verify environment variable validation at startup

#### VULN-015: Refresh Token Not Revoked on Logout
- **Risk:** User logs out but refresh token remains valid in DB/Redis; session can be re-established
- **Fix:** Logout handler must delete/invalidate the refresh token from DB/Redis
- **Fix Status:** ⚠️ Verify logout route revokes refresh token

#### VULN-016: No CSRF Protection on State-Changing Endpoints
- **Risk:** Cross-site request forgery on non-JSON endpoints or cookie-based flows
- **Current State:** All API endpoints require `Authorization: Bearer` header (CSRF-safe for XHR/fetch)
- **Fix Status:** ✅ Bearer token pattern is CSRF-safe for API calls; verify any cookie-only flows

---

### 1.4 Infrastructure & Configuration Security 🟠

#### VULN-017: CORS Wildcard Risk
- **Current State:** `app.ts` allows `.replit.dev` and `.repl.co` origins (all subdomains)
- **Risk in Production:** This is overly broad for production; an attacker could create a replit with a `.replit.dev` domain
- **Fix:** In production (`NODE_ENV=production`), lock CORS to only `process.env.CLIENT_URL` exactly
- **File:** `artifacts/api-server/src/app.ts:22`

#### VULN-018: Stripe Webhook — Raw Body Only on Webhook Route
- **Current State:** `app.ts` applies `express.raw()` only to `/api/checkout/webhook`
- **Fix Status:** ✅ Correctly configured — verify Stripe signature validation in webhook handler

#### VULN-019: Debug / Development Routes in Production
- **Risk:** Routes added for development convenience may expose data or operations without auth
- **Fix:** Audit all routes for `/test`, `/dev`, `/seed-now`, `/debug` patterns; remove before production
- **Command:** `grep -r "debug\|/test\|/dev\|/seed-now" artifacts/api-server/src/routes/ --include="*.ts"`

#### VULN-020: File Upload Endpoint Security
- **Risk:** No explicit Multer size limits allow oversized file uploads
- **Fix:** Every Multer instance must include `limits: { fileSize: 5 * 1024 * 1024 }` (avatar) or `10MB` (cover image)
- **Fix Status:** ❌ Audit all upload endpoints

#### VULN-021: In-Memory Cache (No Redis in Development)
- **Current State:** `lib/cache.ts` uses an in-memory `MemoryCache` class, not Redis
- **Risk in Production:** Cache does not survive process restarts; no cross-instance cache sharing; session data could be lost
- **Fix:** Implement Redis client; fall back to in-memory only in dev with explicit startup warning
- **File:** `artifacts/api-server/src/lib/cache.ts`

---

## SECTION 2 — APPLICATION BUGS

### 2.1 Critical Bugs 🔴

#### BUG-001: Subscription Checkout Returns Placeholder URL
- **Symptom:** Clicking upgrade to Pro returns a hardcoded `https://checkout.stripe.com/pay/placeholder?...` URL
- **Location:** `artifacts/api-server/src/routes/subscriptions.ts:39`
- **Fix:** Implement real Stripe Subscriptions API (`stripe.subscriptions.create()` or Stripe Checkout for subscriptions)
- **Impact:** No paid subscriptions can be created

#### BUG-002: Mock Data May Reach Production
- **Symptom:** AI generation job falls back to mock prompts when `ANTHROPIC_API_KEY` is missing; these fake prompts can be approved and published
- **Location:** `artifacts/api-server/src/routes/admin.ts`
- **Fix:** In `NODE_ENV=production`, if API key missing: return HTTP 503 "AI generation service unavailable"; log CRITICAL error; do not proceed with mock data
- **Impact:** Fake content published to live marketplace

#### BUG-003: Pack Purchase State Not Reflected on Cards
- **Symptom:** After purchasing a pack, the "Buy Now" button on the `/explore` pack card still shows instead of "View Pack" or "Download"
- **Fix:** On checkout success, invalidate React Query's `['user', 'purchases']` cache key; implement `usePurchasedPackIds()` hook consumed by all pack cards
- **Impact:** Confusing UX; users may try to repurchase

#### BUG-004: Duplicate Orders on Double-Click
- **Symptom:** Rapidly clicking "Buy Now" can create duplicate Stripe checkout sessions / orders
- **Fix:** Disable button immediately on first click; server-side idempotency key on checkout session creation
- **Impact:** Revenue / accounting errors; user confusion

#### BUG-005: Admin Approval Count Not Decrementing
- **Symptom:** After approving a pack, the approval queue badge count in the admin sidebar does not update without page refresh
- **Fix:** Emit WebSocket event on approval; frontend listens and decrements badge count
- **Impact:** Admin workflow confusion

---

### 2.2 High Severity Bugs 🟠

#### BUG-006: Coupon Code Case Sensitivity
- **Symptom:** Coupon "SAVE20" works but "save20" or "Save20" fails
- **Fix:** Normalize coupon code to uppercase on client input and on server comparison; store coupons in uppercase in DB
- **Location:** Checkout component + checkout route

#### BUG-007: Infinite Scroll Fires Requests After Last Page
- **Symptom:** When all packs are loaded, scrolling to the bottom continues firing API requests that return empty arrays
- **Fix:** When API returns empty array or `total` reached, set `hasNextPage = false`; stop IntersectionObserver

#### BUG-008: Filter Change Mid-Scroll Shows Stale Data
- **Symptom:** User is on page 3 of infinite scroll, changes a filter; pages 2 and 3 data from the old filter remain in results
- **Fix:** On filter change, call `refetch()` with `reset: true` (React Query `useInfiniteQuery` with `initialPageParam`)

#### BUG-009: Category Rename Not Propagated to Explore Sidebar
- **Symptom:** Admin renames a category; `/explore` filter sidebar still shows old name until page refresh
- **Fix:** `PATCH /api/admin/categories/:id` response must invalidate the `['categories']` React Query cache key

#### BUG-010: Pack Thumbnail 404 Not Handled
- **Symptom:** If a pack's `thumbnailUrl` returns 404, the broken image icon displays in the card
- **Fix:** Add `onError={handleImageError}` with state toggle to branded SVG fallback on all `<img>` elements that render pack thumbnails

#### BUG-011: Review Count / Average Rating Not Updated After Review Submission
- **Symptom:** After writing a review, the pack's star rating display does not update
- **Fix:** On review submission success, invalidate `['packs', slug]` React Query cache; backend must recalculate `avgRating` from `SELECT AVG(rating)` and update the pack record

#### BUG-012: "No Reviews Yet" Shows as "NaN Stars" or "0.00"
- **Symptom:** Pack with zero reviews shows malformed star display
- **Fix:** Conditional rendering: `reviewCount === 0 ? 'No reviews yet' : `${avgRating.toFixed(1)} stars``

#### BUG-013: Multi-Tab Logout Not Detected
- **Symptom:** User logs out in Tab A; Tab B continues to show authenticated state and make API calls with expired tokens
- **Fix:** In logout handler, dispatch a `BroadcastChannel` event (`'promptvault-logout'`); all tabs listen and call `authStore.logout()` on receipt

---

### 2.3 Medium Severity Bugs 🟡

#### BUG-014: Back Button After Login Loops to /login
- **Symptom:** User logs in from `/login?returnUrl=/dashboard/purchases`; presses back → returns to `/login` page
- **Fix:** After successful login redirect, use `window.history.replaceState` to remove `/login` from history stack

#### BUG-015: Price Slider Boundary Exclusion
- **Symptom:** Pack priced at exactly the slider maximum (e.g., exactly $20.00) is excluded from results
- **Fix:** Ensure query uses `WHERE priceCents <= :maxPrice` (not `<`)

#### BUG-016: Whitespace-Only Review Body Accepted
- **Symptom:** Submitting "          " (spaces only) as review body passes client validation
- **Fix:** Zod schema: `body: z.string().trim().min(10, 'Review must be at least 10 characters')`

#### BUG-017: Empty First Page Still Triggers Load More
- **Symptom:** Filter produces 0 results; IntersectionObserver fires additional empty requests
- **Fix:** Check `data.total === 0` after first fetch; disable IntersectionObserver

#### BUG-018: Resend Verification Button Has No Countdown
- **Symptom:** User can click "Resend Email" repeatedly with no rate limiting in the UI
- **Fix:** 60-second countdown timer after first click; disable button until countdown complete

#### BUG-019: Avatar Upload With Unsaved Changes — No Warning
- **Symptom:** User uploads new avatar but navigates away without saving; change is lost with no warning
- **Fix:** Use `useBeforeUnload` hook to intercept navigation when `isDirty` state is true

#### BUG-020: $0.00 Displayed for Paid Packs with Data Errors
- **Symptom:** If a paid pack has a null or 0 price in DB, it displays as "$0.00" implying it is free
- **Fix:** Display "Price unavailable" when `priceCents === 0 && !isFree`

---

### 2.4 Low Severity / Code Quality 🔵

#### BUG-021: console.log Statements in Production Backend
- **Symptom:** Raw `console.log` calls exist alongside the `pino` logger
- **Fix:** Replace all `console.log` / `console.error` in server code with `logger.info()` / `logger.error()`
- **Command:** `grep -r "console\.log" artifacts/api-server/src/ --include="*.ts"`

#### BUG-022: TypeScript Errors (Verify)
- **Command:** `npx tsc --noEmit` in both `artifacts/promptvault` and `artifacts/api-server`
- **Fix Status:** ⚠️ Must return 0 errors before production deployment

#### BUG-023: ESLint Warnings
- **Command:** `npx eslint . --ext .ts,.tsx --max-warnings 0`
- **Fix Status:** ⚠️ Must return 0 warnings before production deployment

#### BUG-024: TODO / FIXME Comments in Source
- **Command:** `grep -r "TODO\|FIXME\|HACK\|lorem\|ipsum" artifacts/promptvault/src/ artifacts/api-server/src/ --include="*.ts" --include="*.tsx"`
- **Known Locations:** `admin/settings.tsx`, `admin/users.tsx`, `admin/categories.tsx`, `admin/packs.tsx`, `admin/automation.tsx`, `auth/login.tsx`, `auth/signup.tsx`, `auth/forgot-password.tsx`, `auth/reset-password.tsx`, plus `api-server/src/routes/subscriptions.ts`, `api-server/src/routes/admin.ts`
- **Fix:** Resolve each TODO or convert to a tracked issue

---

## SECTION 3 — ROUTING & NAVIGATION BUGS

### 3.1 Broken / Stub Routes

| Route | Issue | Fix Required |
|-------|-------|-------------|
| `/creator/dashboard` | Empty component stub — blank white screen | Render placeholder or implement |
| `/creator/packs/new` | Empty stub | Render placeholder or implement |
| `/creator/packs/:id/edit` | Empty stub | Render placeholder or implement |
| `/creator/analytics` | Empty stub | Render placeholder or implement |
| `/creator/payouts` | Empty stub | Render placeholder or implement |
| `/developer` | Empty stub | Render placeholder or implement |
| `/dashboard/verification` | Empty stub | Render placeholder or implement |

### 3.2 Route Protection Gaps

| Issue | Expected Behaviour |
|-------|--------------------|
| `/dashboard/*` accessible when logged out | Must redirect to `/login?returnUrl=<path>` |
| `/admin/*` accessible to buyer tokens | Must redirect to `/dashboard` with "Access denied" toast |
| `/login` visited when already logged in | Must redirect to `/dashboard` immediately (no flash of login form) |
| Unknown route (e.g., `/banana`) | Must render 404 page |

### 3.3 Deep Link Integrity

All generated links must point to real content:

- [ ] Email verification link: `/verify-email?token=REAL_TOKEN`
- [ ] Password reset link: `/reset-password?token=REAL_TOKEN`
- [ ] Order confirmation email link: `/dashboard/orders/:real-id`
- [ ] Download link: goes to `/dashboard/downloads` (not direct S3 URL)
- [ ] All category links: `/categories/:slug` (slug must exist in DB)
- [ ] All pack links: `/packs/:slug` (slug must exist in DB)
- [ ] "View all featured" → `/explore?featured=true`
- [ ] Footer links: all go to real routes, no `href="#"` dead links

---

## SECTION 4 — DATABASE ISSUES

### 4.1 Schema Gaps

Refer to `Final-Work.md` Section 3 for full table inventory. Key critical gaps:

- **`users` table missing** `username`, `coverImageUrl`, `profileVisibility`, and social link fields — blocks public profile pages
- **`user_follows` table missing** — blocks follow/unfollow social system
- **`prompt_bookmarks` table missing** — blocks personal prompt library
- **`pack_appreciations` table missing** — blocks like/appreciate feature
- **`notification_preferences` table missing** — blocks per-user notification settings

### 4.2 Migration State

- **Action Required:** Run `npx prisma migrate status` (or equivalent Drizzle migration check) to confirm all migrations are applied
- **Action Required:** Test a fresh database: `prisma migrate reset --force` must apply all migrations without errors
- **Action Required:** Confirm no hardcoded UUIDs or IDs in source code

### 4.3 Query Performance Issues

| Query | Concern | Fix |
|-------|---------|-----|
| Pack listing with filters | Full table scan possible | Verify indexes on `status`, `categoryId`, `priceCents`, `publishedAt` |
| Search ILIKE query | Full text scan (no index) | Add `CREATE INDEX CONCURRENTLY ON packs USING gin(to_tsvector('english', title || ' ' || description))` |
| Admin dashboard KPIs | Multiple unoptimised COUNT queries | Combine into single CTE query or add materialised view |
| User notifications list | ORDER BY DESC without index | Verify composite index on `(userId, isRead, createdAt DESC)` |

---

## SECTION 5 — PERFORMANCE ISSUES

### 5.1 Bundle Size

- **Target:** No chunk > 200KB gzipped
- **Risk Areas:**
  - Admin panel loaded eagerly (should be lazy-loaded)
  - Recharts loaded at top level (should be dynamic import)
  - Date libraries (ensure `date-fns` tree-shaken: `import { format }` not `import *`)
  - Lodash (ensure tree-shaken: `import { debounce }` not `import _ from 'lodash'`)
- **Check Command:** `npx vite-bundle-visualizer` in `artifacts/promptvault`

### 5.2 API Response Times

| Endpoint | Target | Concern |
|----------|--------|---------|
| `GET /api/packs` | < 200ms (cache warm) | In-memory cache not shared across restarts |
| `GET /api/packs/:slug` | < 150ms | Verify caching |
| `GET /api/admin/dashboard` | < 500ms | Multiple aggregation queries |
| `GET /api/search` | < 300ms | ILIKE is slow on large datasets |

### 5.3 Frontend Rendering

- [ ] Skeleton loaders must be visible for ≥ 200ms (add artificial minimum delay if data loads faster)
- [ ] All `<img>` elements must have explicit `width` and `height` to prevent CLS (Cumulative Layout Shift)
- [ ] Skeleton shimmer animation must use `transform: translateX()` (GPU-composited, 60fps)
- [ ] No white flash on dark mode initialisation

### 5.4 Lighthouse Targets

| Category | Target Score |
|----------|-------------|
| Performance | ≥ 90 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |

**Common failing points to fix:**
- Missing `<meta name="description">` on homepage
- Missing Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`)
- Icon-only links without `aria-label`
- Buttons without accessible names
- Images without `width`/`height` attributes
- No `<link rel="preload">` for critical fonts

---

## SECTION 6 — ENVIRONMENT & CONFIGURATION ISSUES

### 6.1 Missing / Unvalidated Environment Variables

| Variable | Usage | Status |
|----------|-------|--------|
| `DATABASE_URL` | PostgreSQL connection | ✅ Required |
| `REDIS_URL` | Cache / queue | ⚠️ Not used (in-memory fallback) |
| `JWT_SECRET` | Access token signing | ✅ Required — verify ≥ 32 chars |
| `JWT_REFRESH_SECRET` | Refresh token signing | ✅ Required — verify ≥ 32 chars |
| `NODE_ENV` | Environment mode | ✅ Required |
| `PORT` | Server port | ✅ Required |
| `CLIENT_URL` | CORS allowed origin | ✅ Required |
| `ANTHROPIC_API_KEY` | AI generation | ⚠️ Falls back to mock in dev; must fail in prod |
| `OPENAI_API_KEY` | DALL-E image generation | ⚠️ Status unknown |
| `STRIPE_SECRET_KEY` | Payments | ⚠️ Falls back to mock in dev; must 503 in prod |
| `STRIPE_PUBLISHABLE_KEY` | Frontend Stripe | ⚠️ Verify |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verification | ⚠️ Verify |
| `AWS_ACCESS_KEY_ID` | S3 file storage | ⚠️ Falls back to local disk |
| `AWS_SECRET_ACCESS_KEY` | S3 file storage | ⚠️ Falls back to local disk |
| `AWS_BUCKET_NAME` | S3 file storage | ⚠️ Falls back to local disk |
| `AWS_REGION` | S3 file storage | ⚠️ Falls back to local disk |
| `RESEND_API_KEY` | Transactional email | ⚠️ Falls back to console.log in dev |
| `FROM_EMAIL` | Email sender address | ⚠️ Verify |
| `MEILISEARCH_URL` | Search service | ❌ Not implemented |
| `MEILISEARCH_KEY` | Search service | ❌ Not implemented |
| `SENTRY_DSN` | Error monitoring | ❌ Not confirmed active |

### 6.2 Startup Sequence Verification

The server startup must produce these log lines in order:

```
[INFO] Checking required environment variables... ✓
[INFO] Connecting to PostgreSQL... ✓ (Xms)
[INFO] Running pending migrations... ✓ (N applied)
[INFO] Connecting to Redis... ✓ (Xms)       ← or WARN if using in-memory fallback
[INFO] Starting BullMQ workers... ✓ (automation worker ready)
[INFO] Starting Socket.IO server... ✓
[INFO] PromptVault API running on port 3000
[INFO] Health check: http://localhost:3000/api/healthz
```

Any startup step that fails must prevent server start (not silently continue).

### 6.3 Health Check

The `/api/healthz` endpoint must return:

```json
{
  "status": "ok",
  "timestamp": "2026-03-14T...",
  "version": "1.0.0",
  "uptime": 42,
  "services": {
    "database": { "status": "ok", "latencyMs": <50 },
    "redis":    { "status": "ok", "latencyMs": <10 },
    "queue":    { "status": "ok", "pending": 0, "active": 0, "failed": 0 }
  }
}
```

All latencies must be within range before the endpoint returns "ok".

---

## SECTION 7 — DEBUGGING PLAYBOOK

### 7.1 How to Run the Mock Data Audit

```bash
# Frontend mock data
grep -r "mock\|fake\|dummy\|placeholder\|lorem\|ipsum\|TODO\|FIXME\|hardcoded\|test@\|example\.com\|12345\|9999" \
  artifacts/promptvault/src/ --include="*.ts" --include="*.tsx" -l

# Backend mock data
grep -r "mock\|fake\|dummy\|hardcoded\|TODO\|FIXME\|lorem\|placeholder" \
  artifacts/api-server/src/ --include="*.ts" -l

# console.log in production server code
grep -r "console\.log" artifacts/api-server/src/ --include="*.ts"

# Hardcoded UUIDs (36-char UUID pattern)
grep -r "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" \
  artifacts/promptvault/src/ artifacts/api-server/src/ --include="*.ts" --include="*.tsx"

# Debug routes
grep -r "debug\|/test\|/dev\|/seed-now" artifacts/api-server/src/routes/ --include="*.ts"
```

### 7.2 How to Run the Security Verification Checks

```bash
# Price tampering test (replace TOKEN and PACK_ID)
curl -X POST $API_URL/api/checkout/session \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"packId": "PACK_ID", "priceCents": 1}'
# Expected: 200 with REAL price in response, not 1

# Buyer cannot access admin
curl -H "Authorization: Bearer $BUYER_TOKEN" $API_URL/api/admin/dashboard
# Expected: 403

# XSS in pack title
curl -X POST $API_URL/api/admin/packs \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "<script>alert(1)</script>", "description": "test", "categoryId": "..."}'
# Expected: stored as escaped text

# Path traversal
curl "$API_URL/api/user/purchases/../../../etc/passwd/download" \
  -H "Authorization: Bearer $USER_TOKEN"
# Expected: 400 or 404

# Oversized payload
curl -X POST $API_URL/api/packs \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$(python3 -c 'print("A"*2000001)')"
# Expected: 413 Payload Too Large

# Negative coupon value
curl -X POST $API_URL/api/admin/coupons \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"NEGTEST","discountValue":-50,"discountType":"PERCENT"}'
# Expected: 400 validation error

# Integer overflow pagination
curl "$API_URL/api/packs?page=99999999999999999"
# Expected: 400 or capped response
```

### 7.3 How to Debug API Response Times

```bash
# Pack list (should be < 200ms cache-warm)
time curl $API_URL/api/packs

# Pack detail
SLUG=$(curl -s $API_URL/api/packs | jq -r '.packs[0].slug')
time curl $API_URL/api/packs/$SLUG

# Admin dashboard
time curl -H "Authorization: Bearer $ADMIN_TOKEN" $API_URL/api/admin/dashboard

# If slow: check cache hit rate and add EXPLAIN ANALYZE to the underlying query
```

### 7.4 How to Verify Environment Variables at Runtime

```bash
# In server code at startup:
grep -r "process\.env\." artifacts/api-server/src/ --include="*.ts" | \
  grep -oP 'process\.env\.\K[A-Z_]+' | sort | uniq

# Compare output against .env.production.example to find missing declarations
```

### 7.5 Common Error Patterns

| Error | Likely Cause | Debug Step |
|-------|-------------|-----------|
| 500 on `/api/packs` | DB connection failure | Check `DATABASE_URL` and DB service |
| 401 on authenticated endpoints | JWT expired or malformed | Check `JWT_SECRET` matches between issue and verify |
| 403 on admin endpoint with admin token | `requireAdmin` middleware bug | Log `req.user.role` in middleware |
| Stripe webhook 400 | Signature mismatch | Check `STRIPE_WEBHOOK_SECRET` and that `express.raw()` is on the webhook route |
| Blank white screen on route | Empty stub component | Check `App.tsx` — route has no component assigned |
| Pack card shows "Buy Now" after purchase | Query cache not invalidated | Invalidate `['user', 'purchases']` on checkout success |
| Broken image icon on pack card | thumbnailUrl returns 404 | Implement `onError` fallback to SVG |

---

## SECTION 8 — PRODUCTION READINESS CHECKLIST

Use this checklist to verify production readiness. All items must be ✅ before deployment.

### Security
- [ ] Price tampering: server ignores client-supplied price
- [ ] Review gate: purchase ownership verified before review allowed
- [ ] Download gate: purchase ownership verified before download
- [ ] Cross-user order: 403 (not 404) returned for another user's order
- [ ] Admin self-protection: admin cannot modify own account via admin panel
- [ ] Coupon stacking: one coupon per order enforced
- [ ] CORS: locked to `CLIENT_URL` only in production
- [ ] JWT secrets: ≥ 32 random characters each
- [ ] Debug routes: none exist in production
- [ ] File upload limits: Multer size limits on all upload endpoints
- [ ] Body size limit: `1mb` or `2mb` enforced globally

### Data Integrity
- [ ] Mock data: none in production code paths
- [ ] Seed script: production guard present (`NODE_ENV !== 'production'`)
- [ ] Server startup: no data creation on startup
- [ ] Hardcoded IDs: none in source code
- [ ] All migrations applied on fresh database

### Performance
- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 90
- [ ] Lighthouse Best Practices ≥ 90
- [ ] Lighthouse SEO ≥ 90
- [ ] No bundle chunk > 200KB gzipped
- [ ] Pack list API < 200ms (warm)
- [ ] Pack detail API < 150ms

### Code Quality
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npx eslint . --max-warnings 0` → 0 warnings
- [ ] `npm audit --audit-level=moderate` → 0 vulnerabilities
- [ ] No `console.log` in server code
- [ ] No TODO/FIXME in source
- [ ] No hardcoded mock data in non-test files

### Health
- [ ] `/api/healthz` → all services "ok", latencies in range
- [ ] All environment variables documented in `.env.production.example`
- [ ] Production build completes with 0 errors

---

*This document is a living reference. Update issue status as fixes are applied.*

### 1.5 Additional Identified Security Vulnerabilities (Audit Update) 🔴

#### VULN-022: Incomplete Admin Self-Modification Guard
- **Risk:** An admin can modify their own role via `PATCH /users/:id`, causing privilege escalation or system lockout.
- **Test:** Submit `PATCH /api/admin/users/:adminId` changing the role to `USER` or `SUPER_ADMIN` using the admin's own token.
- **Location:** `artifacts/api-server/src/routes/admin.ts`
- **Fix Required:** Add `if (id === req.user!.userId) { res.status(400).json({ error: "You cannot modify your own account via the admin panel" }); return; }` to the `PATCH` route. The `DELETE` route has this guard, but `PATCH` currently misses it.

#### VULN-023: Loose CORS Configuration in Production
- **Risk:** The CORS configuration in `app.ts` uses `.includes(".replit.dev")` and `.includes("localhost")` for origin checking when `isDev` is true. If `NODE_ENV` is misconfigured or a bypass occurs, attackers could easily spoof origins using crafted subdomains.
- **Location:** `artifacts/api-server/src/app.ts`
- **Fix Required:** Enforce exact string matching for `process.env.CLIENT_URL` and `process.env.APP_URL` exclusively in production. Remove all `.includes` wildcard logic outside of local development.

---

### 2.5 Additional Application Bugs (Audit Update) 🟠

#### BUG-025: Mock Data Rendering in Production UI
- **Symptom:** Several critical dashboard screens render hardcoded placeholder data instead of fetching from the API.
- **Location:**
  - `artifacts/promptvault/src/pages/dashboard/team.tsx` (Uses `MOCK_MEMBERS`)
  - `artifacts/promptvault/src/pages/admin/experiments.tsx` (Uses `MOCK_EXPERIMENTS`)
- **Fix Required:** Replace static arrays with TanStack Query hooks fetching from the appropriate REST endpoints.

#### BUG-026: Subscription Checkout Uses Dummy URL
- **Symptom:** Clicking "Upgrade to Pro" redirects the user to a hardcoded URL (`https://checkout.stripe.com/pay/placeholder`).
- **Location:** `artifacts/api-server/src/routes/subscriptions.ts` (Line 39)
- **Fix Required:** Implement standard Stripe Checkout Session creation for subscriptions (`mode: 'subscription'`) using the `stripe` SDK.

---

### 4.4 Missing Phase 2 Database Schema Requirements
The PRD mandates a significant expansion of the database schema for Phase 2 that has not been implemented in `lib/db/src/schema/`.

**Critical Missing Tables:**
1. `pack_embeddings` (Requires `VECTOR(1536)` for semantic search).
2. `subscription_credits` (Tracks unused monthly pack credits for Pro users).
3. `team_workspaces` and `team_members` (Required for the Teams subscription tier).
4. `affiliate_programs` and `affiliate_conversions` (Required for creator and user affiliate tracking).
5. `user_recommendations` (Cache table for the nightly collaborative filtering job).
6. `community_prompts` (Free public prompt submissions).

**Missing Fields on Existing Tables:**
1. `users`: Missing `username`, `social links`, `specialties`, `isCreator`, `subscriptionPlan`, `trustScore`, etc.
2. `prompt_packs`: Missing `creatorId` (FK) and `packType` (single/bundle).

*Action Required:* Create Drizzle schema definitions for all above entities, generate migrations (`drizzle-kit generate`), and apply them before commencing Phase 2 feature development.
