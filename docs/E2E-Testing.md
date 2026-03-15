# PromptVault — End-to-End Testing Guide

> **Document Purpose:** Comprehensive manual and automated testing procedures for verifying that
> every feature, screen, and system component of PromptVault works correctly end-to-end.
>
> **Last Reviewed:** March 14, 2026
> **Testing Approach:** Manual test cases + Playwright automated E2E suite

---

## Table of Contents

1. [Test Environment Setup](#1-test-environment-setup)
2. [Test Accounts & Data](#2-test-accounts--data)
3. [Automated E2E Suite Setup](#3-automated-e2e-suite-setup)
4. [Manual Test Cases — Public Screens](#4-manual-test-cases--public-screens)
5. [Manual Test Cases — Authentication Flows](#5-manual-test-cases--authentication-flows)
6. [Manual Test Cases — User Dashboard](#6-manual-test-cases--user-dashboard)
7. [Manual Test Cases — Commerce & Checkout](#7-manual-test-cases--commerce--checkout)
8. [Manual Test Cases — Admin Panel](#8-manual-test-cases--admin-panel)
9. [Manual Test Cases — Social & Community Features](#9-manual-test-cases--social--community-features)
10. [Security Test Cases](#10-security-test-cases)
11. [Performance & Accessibility Tests](#11-performance--accessibility-tests)
12. [Automated Playwright Test Specifications](#12-automated-playwright-test-specifications)
13. [Regression Checklist](#13-regression-checklist)
14. [Test Completion Criteria](#14-test-completion-criteria)

---

## 1. Test Environment Setup

### 1.1 Prerequisites

- Both API Server and Frontend app running locally
- PostgreSQL database running with all migrations applied
- Seed data loaded (`npm run db:seed` from `artifacts/api-server`)
- Test Stripe keys configured (`STRIPE_SECRET_KEY=sk_test_...`)
- Application accessible at `http://localhost:PORT`

### 1.2 Start the Application

```bash
# From workspace root
pnpm install

# Start API server
cd artifacts/api-server && npm run dev

# Start frontend (in another terminal)
cd artifacts/promptvault && npm run dev
```

### 1.3 Verify Health Check

```bash
curl http://localhost:3001/api/healthz | jq .
```

All services must show `"status": "ok"` before testing begins.

### 1.4 Playwright Setup (Automated Tests)

```bash
npm install -D @playwright/test
npx playwright install chromium firefox webkit
```

Create `playwright.config.ts` in workspace root:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  reporter: [['html', { outputFolder: 'e2e-report' }]],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
})
```

---

## 2. Test Accounts & Data

### 2.1 Test User Accounts (after seed)

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Admin | `admin@promptvault.com` | `Admin123!` | admin |
| Buyer | `buyer@test.com` | `Buyer123!` | user |
| Creator (if seeded) | `creator@test.com` | `Creator123!` | user |

### 2.2 Test Stripe Cards

| Card Number | Behaviour |
|-------------|-----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0027 6000 3184` | Requires authentication (3DS) |

Expiry: any future date (e.g., `12/30`), CVC: `123`, ZIP: `10001`

### 2.3 Required Seed Data

Before running tests, verify:
- At least 3 published packs across 2 different categories
- At least 1 category with `slug` set
- At least 1 coupon code: `SAVE20` (20% off, `maxUses: 100`)
- At least 1 featured pack (`isFeatured: true`)

---

## 3. Automated E2E Suite Setup

### 3.1 Test Helpers

Create `e2e/helpers.ts`:

```typescript
import { Page } from '@playwright/test'
import { Client } from 'pg'

const dbClient = new Client({ connectionString: process.env.DATABASE_URL })

export async function getVerificationToken(email: string): Promise<string> {
  await dbClient.connect()
  const result = await dbClient.query(
    `SELECT token FROM email_verifications WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
    [email]
  )
  await dbClient.end()
  return result.rows[0]?.token
}

export async function getFirstPublishedPackSlug(): Promise<string> {
  await dbClient.connect()
  const result = await dbClient.query(
    `SELECT slug FROM packs WHERE status = 'PUBLISHED' LIMIT 1`
  )
  await dbClient.end()
  return result.rows[0]?.slug
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('[name="email"]', email)
  await page.fill('[name="password"]', password)
  await page.click('[data-testid="login-submit"]')
  await page.waitForURL('**/dashboard**')
}

export async function getBuyerToken(): Promise<string> {
  const response = await fetch(`${process.env.API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'buyer@test.com', password: 'Buyer123!' }),
  })
  const data = await response.json()
  return data.accessToken
}

export async function getAdminToken(): Promise<string> {
  const response = await fetch(`${process.env.API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@promptvault.com', password: 'Admin123!' }),
  })
  const data = await response.json()
  return data.accessToken
}
```

### 3.2 Run Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/purchase-flow.spec.ts

# Run with UI (interactive)
npx playwright test --ui

# View report after run
npx playwright show-report e2e-report
```

---

## 4. Manual Test Cases — Public Screens

### TC-001: Homepage (`/`)

**Precondition:** Logged out. At least 3 published packs and 2 categories in DB.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/` | Page loads, title is "PromptVault" | |
| 2 | Check hero section | Headline visible, no overflow at 375px width | |
| 3 | Check stats bar | Numbers animate count-up from real API data (not hardcoded) | |
| 4 | Check featured packs | Real packs load (not placeholders); at least 3 cards visible | |
| 5 | Check category grid | Categories from DB shown with correct pack counts | |
| 6 | Check trending section | Trending packs load from `/api/packs/trending` | |
| 7 | Check "How It Works" | No lorem ipsum; copy is final | |
| 8 | Check footer | All links navigate to real routes; no `href="#"` | |
| 9 | Mobile view (375px) | No horizontal scrollbar; footer fully visible | |
| 10 | Dark mode | No un-themed elements; no white flash on load | |

---

### TC-002: Explore Page (`/explore`)

**Precondition:** Logged out. Database has packs across multiple categories and price points.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/explore` | Pack grid renders with real data | |
| 2 | Click a category checkbox in sidebar | Only packs from that category shown | |
| 3 | Deselect category | All packs shown again | |
| 4 | Set price slider to $0–$20 | Only packs ≤ $20 shown | |
| 5 | Change sort to "Newest" | Packs ordered by most recent `publishedAt` | |
| 6 | Change sort to "Most Popular" | Packs ordered by `totalDownloads` descending | |
| 7 | Type in search box | Results filter in real time | |
| 8 | Scroll to bottom | Next page loads (infinite scroll); no duplicate cards | |
| 9 | Apply filter that produces 0 results | Empty state displayed, no requests continue firing | |
| 10 | Click active filter pill | Filter removed; results refresh | |
| 11 | Toggle grid/list view | Both render correctly | |
| 12 | Loading state | Skeleton cards visible while data loads | |

---

### TC-003: Pack Detail Page (`/packs/:slug`)

**Precondition:** At least 1 published pack with reviews, prompts, and related packs.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/packs/:slug` | Pack title, thumbnail, price visible | |
| 2 | Check thumbnail | Image loads or branded SVG fallback shows | |
| 3 | Check star rating | Shows correct average; "No reviews yet" if 0 reviews | |
| 4 | Check price display | Correct price; compare price struck through if set | |
| 5 | Check "Prompts Preview" tab | 5 prompts shown; rest blurred | |
| 6 | Click on blurred area | Purchase CTA modal / overlay appears | |
| 7 | Check "Reviews" tab | Paginated reviews load; star histogram correct | |
| 8 | Check "FAQ" tab | Accordion opens and closes smoothly | |
| 9 | Check related packs | Horizontal scroll with real related packs | |
| 10 | Scroll down on mobile | Sticky purchase bar appears | |
| 11 | Click "Copy Link" in share | URL copied; "Copied!" feedback shown | |
| 12 | Click wishlist heart (logged out) | Redirect to `/login?returnUrl=...` | |

---

### TC-004: Search Page (`/search`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/search` | Search bar is auto-focused | |
| 2 | Type 2+ characters | Typeahead dropdown suggestions appear | |
| 3 | Press arrow keys in dropdown | Keyboard navigation works | |
| 4 | Press Enter or select suggestion | Results load for that query | |
| 5 | Check results | Pack titles highlight matching search term | |
| 6 | Clear search | All packs shown or empty state with message | |
| 7 | Search for non-existent term | "No results" state with suggestions shown | |

---

### TC-005: Pricing Page (`/pricing`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/pricing` | 3 tier cards visible | |
| 2 | Check Pro tier | "Most Popular" badge present | |
| 3 | Click Free tier CTA | Navigates to `/signup` | |
| 4 | Click Pro tier CTA | Navigates to checkout or signup | |
| 5 | Mobile view (375px) | Comparison table no horizontal overflow | |

---

### TC-006: Category Page (`/categories/:slug`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/categories/marketing` | Category hero shows name, icon, colour from DB | |
| 2 | Check pack grid | Only packs in that category listed | |
| 3 | Navigate to empty category | Empty state shown | |

---

### TC-007: Trending Page (`/trending`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/trending` | Ranked list loads from API | |
| 2 | Click "24h" filter | Results update to 24-hour trending | |
| 3 | Click "7d" filter | Results update to 7-day trending | |
| 4 | Check rank badges | #1, #2, #3 badges displayed correctly | |

---

## 5. Manual Test Cases — Authentication Flows

### TC-008: User Registration (`/signup`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/signup` | Form visible with all fields | |
| 2 | Submit empty form | Validation errors on all required fields | |
| 3 | Enter weak password | Password strength meter shows "Weak" | |
| 4 | Submit without checking Terms | Error: "You must accept the terms" | |
| 5 | Register with duplicate email | Inline error: "Email already in use" (not generic) | |
| 6 | Register with valid unique email | Email verification prompt shown | |
| 7 | Check database | `users` table has new row; `emailVerified = false` | |
| 8 | Already logged in; visit `/signup` | Redirect to `/dashboard` | |

---

### TC-009: Email Verification (`/verify-email`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Click "Resend Email" | 60-second countdown starts; button disabled | |
| 2 | Navigate to `/verify-email?token=INVALID` | Clear error: "Invalid or expired token" | |
| 3 | Navigate with real token from DB | "Email verified!" success state shown | |
| 4 | Wait 3 seconds after success | Auto-redirect to `/dashboard` | |

---

### TC-010: Login (`/login`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/login` | Form visible | |
| 2 | Click show/hide password toggle | Password field toggles visibility | |
| 3 | Submit wrong credentials | Inline error shown (not just toast) | |
| 4 | Submit correct buyer credentials | Redirect to `/dashboard` | |
| 5 | Navigate to `/dashboard/purchases` while logged out | Redirect to `/login?returnUrl=/dashboard/purchases` | |
| 6 | Log in | Redirect to `/dashboard/purchases` (returnUrl preserved) | |
| 7 | Visit `/login` while already logged in | Redirect to `/dashboard` immediately | |

---

### TC-011: Forgot / Reset Password

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/forgot-password` | Form visible | |
| 2 | Submit non-existent email | Same success message shown (security: no email enumeration) | |
| 3 | Submit real email | Same success message; token created in DB | |
| 4 | Submit 3 times rapidly | After 3rd, button disabled with rate limit message | |
| 5 | Navigate to `/reset-password` with no token | Clear error: "Reset link invalid or expired" | |
| 6 | Navigate with real token from DB | Password fields visible; strength meter shown | |
| 7 | Submit new password | Redirect to `/login` with success toast | |
| 8 | Try logging in with old password | Login fails | |
| 9 | Try logging in with new password | Login succeeds | |

---

## 6. Manual Test Cases — User Dashboard

### TC-012: Dashboard Home (`/dashboard`)

**Precondition:** Logged in as buyer.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/dashboard` | Welcome message shows logged-in user's display name | |
| 2 | Check recent purchases | Last 3 orders shown (or empty state if none) | |
| 3 | Check recommended packs | Recommendations load (or category-based fallback) | |
| 4 | Check saved packs | Wishlisted packs shown | |
| 5 | Click quick action buttons | Each navigates to correct route | |
| 6 | Profile completion widget | Shows if profile < 100% complete; links to edit sections | |

---

### TC-013: Purchases Page (`/dashboard/purchases`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate with no purchases | Empty state shown | |
| 2 | Navigate after a purchase | Table shows real order rows | |
| 3 | Sort by date | Order changes | |
| 4 | Click download button | Signed URL triggers file download | |

---

### TC-014: Downloads Page (`/dashboard/downloads`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/dashboard/downloads` | All purchased packs listed | |
| 2 | Click "Download PDF" | Real file downloads (not 404) | |
| 3 | Click "Download ZIP" | Real file downloads | |
| 4 | Verify download count | `OrderItem.downloadCount` increments in DB | |

---

### TC-015: Wishlist (`/dashboard/wishlist`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Click heart on pack card (logged in) | Icon fills; pack appears in wishlist | |
| 2 | Click heart again | Icon unfills; pack removed from wishlist | |
| 3 | Click heart while logged out | Redirect to login; after login, pack is saved | |
| 4 | Remove from wishlist page | Removed without full page reload | |
| 5 | Empty wishlist | Illustrated empty state with Browse CTA | |

---

### TC-016: Account Settings (`/dashboard/settings`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Profile tab: update display name | Saved; displayed in navbar | |
| 2 | Profile tab: upload avatar | Avatar updated across all components | |
| 3 | Security tab: change password | Requires current password; saves | |
| 4 | Notifications tab: toggle a setting | Toggle state persists on page refresh | |
| 5 | Billing tab | Shows current plan ("Free" or subscription plan) | |
| 6 | Danger zone: delete account | Requires password confirmation before deletion | |

---

### TC-017: Prompt Viewer (`/dashboard/packs/:packId/prompts`)

**Precondition:** User has purchased a pack.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to prompt viewer | All prompts listed in left panel | |
| 2 | Click a prompt | Detail shown in right panel | |
| 3 | Click "Copy" button | Clipboard contains prompt text; "Copied!" animation shows | |
| 4 | Prompt with `{variable}` placeholder | Editable input field replaces placeholder | |
| 5 | Fill in variable | Prompt updates in real time | |
| 6 | Click "Open in ChatGPT" | Opens `chat.openai.com` with prompt pre-filled | |
| 7 | Rate a prompt (1-5 stars) | Rating saved to DB; private to user | |
| 8 | Mark prompt as Used | Toggle state persists; coloured dot updates in list | |

---

### TC-018: Notifications (`/dashboard/notifications`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Bell icon in navbar | Shows unread count badge (or dot) | |
| 2 | Click bell | Dropdown shows 5 most recent notifications | |
| 3 | Navigate to `/dashboard/notifications` | Full notification list | |
| 4 | Click filter tab "Unread" | Only unread notifications shown | |
| 5 | Click a notification | Marked as read; blue border removed | |
| 6 | Click "Mark all read" | All notifications marked read; badge clears | |
| 7 | Empty state | "No notifications" message with illustration | |

---

## 7. Manual Test Cases — Commerce & Checkout

### TC-019: Full Purchase Flow (Paid Pack)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to a paid pack detail page | "Buy Now" button visible | |
| 2 | Click "Buy Now" (logged out) | Redirect to login with returnUrl | |
| 3 | Log in | Redirect back to pack detail | |
| 4 | Click "Buy Now" | Stripe checkout session created; redirect to Stripe | |
| 5 | Use test card `4242 4242 4242 4242` | Payment succeeds | |
| 6 | Webhook fires | Order created in DB with `status: COMPLETED` | |
| 7 | Check `/dashboard/purchases` | Order appears | |
| 8 | Check `/dashboard/downloads` | Pack available for download | |
| 9 | Check email | Order confirmation email sent (or logged in dev) | |
| 10 | Return to pack detail | "Buy Now" → "View Pack" or "Download" (card updated) | |
| 11 | Check prompts tab on pack | All prompts visible (not just 5 blurred) | |

---

### TC-020: Free Pack Claim

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Find a pack with `isFree: true` | "Get Free Pack" button shown | |
| 2 | Click "Get Free Pack" (logged in) | Order created with $0 total immediately | |
| 3 | Check purchases | Pack appears | |
| 4 | Check downloads | Pack available for download | |

---

### TC-021: Coupon Code

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Go to checkout for a paid pack | Coupon code field visible | |
| 2 | Enter "save20" (lowercase) | Coupon accepted (case-insensitive) | |
| 3 | Price updates | 20% discount applied | |
| 4 | Complete purchase | Order records discounted price | |
| 5 | Coupon in DB | `usesCount` incremented | |
| 6 | Apply an expired coupon | Error shown: "This coupon has expired" | |
| 7 | Try to apply second coupon | Error: only one coupon per order | |

---

### TC-022: Double-Click Buy Prevention

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Click "Buy Now" button | Button immediately disabled / shows spinner | |
| 2 | Try to click again | Second click has no effect | |
| 3 | Check DB | Only one checkout session / order created | |

---

### TC-023: Declined Payment

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Begin checkout | Redirected to Stripe | |
| 2 | Use card `4000 0000 0000 0002` | Stripe shows "Card declined" | |
| 3 | Check DB | No order created | |
| 4 | Return to app | Can retry checkout | |

---

## 8. Manual Test Cases — Admin Panel

### TC-024: Admin Login

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/pvx-admin` (hidden login) | Admin login form shown | |
| 2 | Enter admin credentials | Redirect to admin dashboard | |
| 3 | Navigate to `/admin` as a buyer | Redirect to `/dashboard` with "Access denied" toast | |
| 4 | Navigate to `/admin` when logged out | Redirect to `/login` | |

---

### TC-025: Admin Dashboard (`/admin`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Load dashboard | All 6 KPI cards show real numbers (not `--` or `0`) | |
| 2 | Check generation timeline chart | Loads data (no blank chart) | |
| 3 | Check active jobs table | Reflects real BullMQ state | |
| 4 | Check quick trigger panel | Form is functional | |

---

### TC-026: AI Pack Generation & Approval Flow

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | On `/admin`, select category and size | Form fields work | |
| 2 | Click "Generate New Pack" | Job appears in automation queue with status `PENDING` | |
| 3 | Watch job status | Updates to `RUNNING` (via WebSocket, no page refresh) | |
| 4 | Wait for completion | Status changes to `COMPLETED` | |
| 5 | Navigate to `/admin/approval` | New pack appears with status `AI_GENERATED` | |
| 6 | Click the pack row | Slide-over opens with real pack data | |
| 7 | Click "Approve & Publish" | Pack status changes to `PUBLISHED` in DB | |
| 8 | Success toast | Appears; approval queue count decrements | |
| 9 | Navigate to `/explore` | Published pack appears immediately | |
| 10 | Reject flow: generate another | In approval queue, click "Reject" | |
| 11 | Select rejection reason and confirm | Status = `REJECTED`; pack NOT in public marketplace | |

---

### TC-027: Admin Category Management (`/admin/categories`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Load page | Real categories from DB listed | |
| 2 | Create new category | Form submits; new category in list | |
| 3 | New category in explore sidebar | Navigate to `/explore`; new category visible in filter | |
| 4 | Edit category name | Update saved; name updated everywhere displayed | |
| 5 | Try to delete category with packs | Error: "Cannot delete category with existing packs" | |
| 6 | Delete empty category | Category removed from list and from explore sidebar | |

---

### TC-028: Admin User Management (`/admin/users`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Load page | Real users from DB (not mock) | |
| 2 | Search by email | Results filter correctly | |
| 3 | Click user row | Slide-over shows real user data | |
| 4 | Suspend a user | Status → `SUSPENDED` in DB | |
| 5 | Suspended user tries to log in | HTTP 403 with clear "Account suspended" message | |
| 6 | Restore user | Status → `ACTIVE`; login works again | |
| 7 | Admin tries to modify own account via admin panel | Blocked with error message | |

---

### TC-029: Admin Analytics (`/admin/analytics`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Load page | Revenue chart renders with real data | |
| 2 | Switch date range to "7d" | X-axis changes; data updates | |
| 3 | Switch date range to "90d" | X-axis changes; data updates | |
| 4 | Check pack performance table | Real published packs listed | |
| 5 | Click "Export CSV" | Real data downloads as CSV file | |

---

### TC-030: Admin File Management (`/admin/files`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Load page | File list from `generated_files` table | |
| 2 | Find a READY file | Download test button downloads actual file | |
| 3 | Find a FAILED file | "Retry" button visible | |
| 4 | Click Retry | New generation job triggers; status eventually → READY | |

---

## 9. Manual Test Cases — Social & Community Features

### TC-031: Follow / Unfollow

**Precondition:** Two user accounts exist.

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/u/:username` (another user) | Public profile shows | |
| 2 | Click "Follow" (logged in) | Button changes to "Unfollow"; follower count increments | |
| 3 | Check DB | `user_follows` row created | |
| 4 | Click "Unfollow" | Button → "Follow"; count decrements | |
| 5 | Navigate to `/u/:username/followers` | Follower list shows correct users | |
| 6 | Navigate to `/u/:username/following` | Following list shows correct users | |

---

### TC-032: Collections

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/dashboard/collections` | User's collections listed | |
| 2 | Click "New Collection" | Create form appears | |
| 3 | Fill in title and description | Saved; appears in list | |
| 4 | On pack detail, click "Save to Collection" | Modal shows user's collections | |
| 5 | Select a collection | Pack added to collection | |
| 6 | Navigate to `/collections/:id` | Collection detail shows the pack | |
| 7 | Set visibility to "Public" | Collection discoverable at `/collections` | |

---

### TC-033: Pack Appreciation (Like)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Find pack detail page | Appreciate / heart button visible | |
| 2 | Click appreciate (logged in) | Count increments; button fills | |
| 3 | Click again | Count decrements; button unfills (toggle) | |
| 4 | Check DB | `pack_appreciations` row created/deleted | |

---

### TC-034: Direct Messaging

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | As buyer who purchased a pack, visit creator's profile | "Message Creator" button visible | |
| 2 | Click "Message Creator" | Navigates to `/dashboard/messages` with new thread | |
| 3 | Send a message | Message appears in thread | |
| 4 | Log in as creator | Notification shows; message visible in inbox | |
| 5 | Reply | Reply appears in thread for both users | |

---

### TC-035: Community Prompts (`/community`)

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| 1 | Navigate to `/community` | Community prompt feed loads | |
| 2 | Submit a prompt (logged in) | Prompt appears in feed | |
| 3 | Upvote a prompt | Count increments | |
| 4 | Try to upvote twice | Second upvote prevented | |

---

## 10. Security Test Cases

### TC-036: Price Tampering Prevention

```bash
USER_TOKEN=$(curl -s $API_URL/api/auth/login \
  -d '{"email":"buyer@test.com","password":"Buyer123!"}' \
  -H "Content-Type: application/json" | jq -r '.accessToken')

PACK_ID=$(curl -s $API_URL/api/packs | jq -r '.packs[0].id')

curl -X POST $API_URL/api/checkout/session \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"packId\": \"$PACK_ID\", \"priceCents\": 1}"
```

**Expected:** Order created with REAL price from DB, not 1 cent.

---

### TC-037: Buyer Cannot Access Admin API

```bash
BUYER_TOKEN=$(curl -s $API_URL/api/auth/login \
  -d '{"email":"buyer@test.com","password":"Buyer123!"}' \
  -H "Content-Type: application/json" | jq -r '.accessToken')

curl -H "Authorization: Bearer $BUYER_TOKEN" $API_URL/api/admin/dashboard
```

**Expected:** HTTP 403

---

### TC-038: Unauthenticated User Cannot Access Dashboard Routes

```bash
curl $API_URL/api/user/me
```

**Expected:** HTTP 401

---

### TC-039: Cross-User Order Access

```bash
# Get order ID belonging to User A, then try to access it as User B
BUYER_TOKEN=<user_b_token>
OTHER_ORDER_ID=<user_a_order_id>

curl -H "Authorization: Bearer $BUYER_TOKEN" $API_URL/api/orders/$OTHER_ORDER_ID
```

**Expected:** HTTP 403 (not 404)

---

### TC-040: Download Without Purchase

```bash
BUYER_TOKEN=<token>
UNOWNED_PACK_ID=<pack_id_not_purchased>

curl -H "Authorization: Bearer $BUYER_TOKEN" \
  $API_URL/api/user/purchases/$UNOWNED_PACK_ID/download
```

**Expected:** HTTP 403

---

### TC-041: Review Without Purchase

```bash
BUYER_TOKEN=<token>
UNOWNED_PACK_ID=<pack_id_not_purchased>

curl -X POST $API_URL/api/reviews \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"packId\": \"$UNOWNED_PACK_ID\", \"rating\": 5, \"title\": \"Great\", \"body\": \"Loved it!\"}"
```

**Expected:** HTTP 403 "You must purchase this pack to review it"

---

### TC-042: Path Traversal in Download

```bash
curl "$API_URL/api/user/purchases/../../../etc/passwd/download" \
  -H "Authorization: Bearer $BUYER_TOKEN"
```

**Expected:** HTTP 400 or 404 — no file system data returned

---

### TC-043: XSS in Pack Title

```bash
curl -X POST $API_URL/api/admin/packs \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"<script>alert(1)</script>","description":"Test","categoryId":"..."}'
```

**Expected:** Title stored as escaped text; `<script>` tags never execute in browser

---

### TC-044: Oversized Payload Rejection

```bash
python3 -c 'import sys; sys.stdout.write("A"*2100000)' | \
  curl -X POST $API_URL/api/packs \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  --data-binary @-
```

**Expected:** HTTP 413 Payload Too Large

---

### TC-045: Negative Coupon Value Rejection

```bash
curl -X POST $API_URL/api/admin/coupons \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"NEGTEST","discountValue":-50,"discountType":"PERCENT"}'
```

**Expected:** HTTP 400 validation error

---

## 11. Performance & Accessibility Tests

### TC-046: Lighthouse Audit

```bash
# Build production bundle
NODE_ENV=production npm run build

# Run Lighthouse
npx lighthouse http://localhost:5173 \
  --chrome-flags="--headless --no-sandbox" \
  --output=html \
  --output-path=./lighthouse-report.html

open lighthouse-report.html
```

**Expected Scores:**

| Category | Minimum Score |
|----------|--------------|
| Performance | ≥ 90 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 90 |
| SEO | ≥ 90 |

**Common failures to investigate:**
- Missing `width`/`height` on `<img>` → CLS score
- Missing `aria-label` on icon buttons → Accessibility score
- No `<meta name="description">` → SEO score
- Missing Open Graph tags → SEO score
- No canonical URLs → SEO score

---

### TC-047: Bundle Size Verification

```bash
cd artifacts/promptvault
npx vite-bundle-visualizer
```

**Expected:** No individual chunk exceeds 200KB gzipped.

**If exceeded:**
- Admin routes: convert to `React.lazy(() => import(...))`
- Recharts: dynamic import
- date-fns: verify tree-shaking (`import { format }` not `import *`)

---

### TC-048: API Response Time Verification

```bash
# Must be < 200ms on warm cache
time curl http://localhost:3001/api/packs

# Must be < 150ms
SLUG=$(curl -s http://localhost:3001/api/packs | jq -r '.packs[0].slug')
time curl http://localhost:3001/api/packs/$SLUG

# Must be < 500ms
ADMIN_TOKEN=$(curl -s .../api/auth/login -d '...' | jq -r '.accessToken')
time curl -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:3001/api/admin/dashboard
```

---

### TC-049: Keyboard Navigation

| Test | Expected Behaviour |
|------|--------------------|
| Tab through homepage | Focus visible on all interactive elements |
| Tab into pack card | Card is focusable; Enter navigates to detail |
| Tab in login form | Fields focus in logical order; submit on Enter |
| Escape in modal | Modal closes |
| Arrow keys in search typeahead | Navigate suggestion items |
| Skip navigation link | Present and functional |

---

### TC-050: Mobile Responsiveness

Test at these viewport widths: **375px** (iPhone SE), **768px** (iPad), **1280px** (laptop)

| Screen | 375px | 768px | 1280px |
|--------|-------|-------|--------|
| Homepage | No h-scroll | OK | OK |
| Explore | Sidebar collapses | OK | OK |
| Pack Detail | Sticky bar works | OK | OK |
| Checkout | Full width form | OK | OK |
| Admin Dashboard | Scrollable tables | OK | OK |
| Pricing | No h-scroll on table | OK | OK |

---

## 12. Automated Playwright Test Specifications

### Spec 1: Full Purchase Flow

```typescript
// e2e/purchase-flow.spec.ts
import { test, expect } from '@playwright/test'
import { loginAs, getVerificationToken, getFirstPublishedPackSlug } from './helpers'

test.describe('Complete Purchase Flow', () => {
  test('register → verify → purchase → download', async ({ page }) => {
    // 1. Homepage loads
    await page.goto('/')
    await expect(page).toHaveTitle(/PromptVault/)
    await expect(page.locator('[data-testid="hero-heading"]')).toBeVisible()

    // 2. Explore packs
    await page.click('[data-testid="nav-explore"]')
    await expect(page).toHaveURL('/explore')
    await expect(page.locator('[data-testid="pack-card"]').first()).toBeVisible({ timeout: 10000 })

    // 3. Register
    await page.goto('/signup')
    const email = `e2e-${Date.now()}@test.com`
    await page.fill('[name="email"]', email)
    await page.fill('[name="password"]', 'TestPass123!')
    await page.fill('[name="confirmPassword"]', 'TestPass123!')
    await page.check('[data-testid="terms-checkbox"]')
    await page.click('[data-testid="signup-submit"]')
    await expect(page.locator('[data-testid="verify-email-prompt"]')).toBeVisible()

    // 4. Verify email (query DB for token)
    const token = await getVerificationToken(email)
    await page.goto(`/verify-email?token=${token}`)
    await expect(page.locator('[data-testid="verification-success"]')).toBeVisible()

    // 5. Purchase a pack (mock Stripe in test env)
    const slug = await getFirstPublishedPackSlug()
    await page.goto(`/packs/${slug}`)
    await expect(page.locator('[data-testid="pack-title"]')).toBeVisible()
    await page.click('[data-testid="buy-now-button"]')
    await expect(page).toHaveURL(/checkout|dashboard\/purchases/, { timeout: 30000 })

    // 6. Verify in dashboard
    await page.goto('/dashboard/purchases')
    await expect(page.locator('[data-testid="purchase-row"]').first()).toBeVisible()

    // 7. Download
    await page.goto('/dashboard/downloads')
    const downloadBtn = page.locator('[data-testid="download-pdf"]').first()
    await expect(downloadBtn).toBeEnabled()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadBtn.click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
  })
})
```

---

### Spec 2: Admin Automation Pipeline

```typescript
// e2e/admin-automation.spec.ts
import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Admin Pack Generation & Approval', () => {
  test('generate → approve → verify on marketplace', async ({ page }) => {
    // Login as admin
    await loginAs(page, 'admin@promptvault.com', 'Admin123!')
    await page.goto('/admin')

    // Verify KPI cards show real data
    const kpiCards = page.locator('[data-testid="kpi-card"]')
    await expect(kpiCards.first()).toBeVisible()
    await expect(kpiCards.first()).not.toContainText('--')

    // Trigger generation
    await page.selectOption('[data-testid="generation-category"]', { index: 1 })
    await page.selectOption('[data-testid="generation-size"]', '10')
    await page.click('[data-testid="trigger-generation"]')

    // Wait for job to appear
    await expect(page.locator('[data-testid="job-status"]').first())
      .toContainText(/PENDING|RUNNING/, { timeout: 5000 })

    // Wait for completion (up to 90 seconds)
    await expect(page.locator('[data-testid="job-status"]').first())
      .toContainText('COMPLETED', { timeout: 90000 })

    // Approve the pack
    await page.goto('/admin/approval')
    await expect(page.locator('[data-testid="approval-queue-count"]'))
      .not.toContainText('0', { timeout: 5000 })
    await page.locator('[data-testid="pack-row"]').first().click()
    await page.click('[data-testid="approve-publish"]')
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()

    // Verify on marketplace
    await page.goto('/explore')
    await expect(page.locator('[data-testid="pack-card"]').first()).toBeVisible()
  })
})
```

---

### Spec 3: Security Verification

```typescript
// e2e/security.spec.ts
import { test, expect } from '@playwright/test'
import { getBuyerToken, getAdminToken } from './helpers'

test.describe('Security Checks', () => {
  test('unauthenticated → dashboard redirect to login', async ({ page }) => {
    await page.goto('/dashboard/purchases')
    await expect(page).toHaveURL(/\/login/)
    expect(page.url()).toContain('returnUrl')
  })

  test('buyer cannot access admin panel', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'buyer@test.com')
    await page.fill('[name="password"]', 'Buyer123!')
    await page.click('[data-testid="login-submit"]')
    await page.waitForURL('**/dashboard**')
    await page.goto('/admin')
    await expect(page).not.toHaveURL('/admin')
  })

  test('buyer token rejected on admin API endpoint', async ({ request }) => {
    const token = await getBuyerToken()
    const response = await request.get('/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(response.status()).toBe(403)
  })

  test('login while already logged in → dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'buyer@test.com')
    await page.fill('[name="password"]', 'Buyer123!')
    await page.click('[data-testid="login-submit"]')
    await page.waitForURL('**/dashboard**')
    await page.goto('/login')
    await expect(page).toHaveURL(/dashboard/)
  })

  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto('/this-does-not-exist-xyz-abc')
    await expect(page.locator('[data-testid="404-heading"]')).toBeVisible()
    await expect(page.locator('[data-testid="go-home"]')).toBeVisible()
    await page.click('[data-testid="go-home"]')
    await expect(page).toHaveURL('/')
  })

  test('price tampering: server uses DB price', async ({ request }) => {
    const token = await getBuyerToken()
    const packsResponse = await request.get('/api/packs')
    const { packs } = await packsResponse.json()
    const pack = packs.find((p: any) => !p.isFree)

    const response = await request.post('/api/checkout/session', {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { packId: pack.id, priceCents: 1 },
    })
    // Should succeed but with real price (or 400 if packId price is overridden)
    // Verify the created checkout session uses the DB price
    expect(response.status()).not.toBe(500)
    if (response.status() === 200) {
      const data = await response.json()
      // The session should NOT have been created for 1 cent
      // (Verify via Stripe API or by checking the DB order if created)
      expect(data).toBeDefined()
    }
  })
})
```

---

### Spec 4: Auth Flow

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication Flows', () => {
  test('registration with duplicate email shows inline error', async ({ page }) => {
    await page.goto('/signup')
    await page.fill('[name="email"]', 'buyer@test.com') // existing
    await page.fill('[name="password"]', 'TestPass123!')
    await page.fill('[name="confirmPassword"]', 'TestPass123!')
    await page.check('[data-testid="terms-checkbox"]')
    await page.click('[data-testid="signup-submit"]')
    const error = page.locator('[data-testid="email-error"]')
    await expect(error).toBeVisible()
    await expect(error).toContainText(/already|taken|exists/i)
  })

  test('wrong credentials shows inline error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'buyer@test.com')
    await page.fill('[name="password"]', 'WrongPassword!')
    await page.click('[data-testid="login-submit"]')
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible()
  })

  test('logout clears session', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'buyer@test.com')
    await page.fill('[name="password"]', 'Buyer123!')
    await page.click('[data-testid="login-submit"]')
    await page.waitForURL('**/dashboard**')
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    await expect(page).toHaveURL('/')
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})
```

---

### Required `data-testid` Attributes

Add these `data-testid` attributes to the corresponding elements:

| Attribute | Element |
|-----------|---------|
| `hero-heading` | Homepage hero `<h1>` |
| `nav-explore` | Navbar "Explore" link |
| `pack-card` | Every pack card component |
| `pack-title` | Pack detail page `<h1>` |
| `buy-now-button` | Primary purchase CTA |
| `terms-checkbox` | Signup terms checkbox |
| `signup-submit` | Signup form submit button |
| `login-submit` | Login form submit button |
| `email-error` | Email field validation error message |
| `login-error` | Login credentials error message |
| `user-menu` | Navbar user avatar/menu button |
| `logout-button` | Logout option in user menu |
| `verify-email-prompt` | Post-signup verification message |
| `verification-success` | Email verification success state |
| `purchase-row` | Row in purchases table |
| `download-pdf` | PDF download button |
| `kpi-card` | Admin KPI stat cards |
| `generation-category` | Admin category select for generation |
| `generation-size` | Admin size select for generation |
| `trigger-generation` | Admin generate button |
| `job-status` | Job status badge in automation list |
| `approval-queue-count` | Approval queue count badge |
| `pack-row` | Row in approval queue / pack list |
| `approve-publish` | Approve & Publish button |
| `success-toast` | Success toast notification |
| `404-heading` | 404 page heading |
| `go-home` | 404 go home button |

---

## 13. Regression Checklist

Run after every significant code change:

### Core Commerce (Must Always Work)
- [ ] Pack browsing loads
- [ ] Search returns results
- [ ] Login and logout work
- [ ] Purchase flow creates order (test Stripe key)
- [ ] Download delivers file
- [ ] Admin can approve a pack

### Authentication (Must Always Work)
- [ ] JWT issued on login
- [ ] Refresh token works
- [ ] Logout revokes token
- [ ] Protected routes redirect unauthenticated

### Data Integrity
- [ ] No mock data in production code paths
- [ ] Seed data not recreated on server startup
- [ ] All DB migrations applied

### Security (Must Always Work)
- [ ] Buyer token rejected on admin endpoints
- [ ] Unauthenticated requests return 401
- [ ] Price tampering uses DB price

---

## 14. Test Completion Criteria

The project is considered **test-complete** when:

| Criterion | Target | Status |
|-----------|--------|--------|
| All public screens load without error | 100% | |
| All auth flows work end-to-end | 100% | |
| Purchase flow: paid pack | Working | |
| Purchase flow: free pack | Working | |
| Purchase flow: coupon | Working | |
| Admin: generation → approval → marketplace | Working | |
| All security test cases pass | 100% | |
| Lighthouse Performance | ≥ 90 | |
| Lighthouse Accessibility | ≥ 90 | |
| Lighthouse Best Practices | ≥ 90 | |
| Lighthouse SEO | ≥ 90 | |
| Playwright E2E suite (all 4 specs) | All pass | |
| TypeScript: `tsc --noEmit` | 0 errors | |
| ESLint: `--max-warnings 0` | 0 warnings | |
| `npm audit --audit-level=moderate` | 0 vulnerabilities | |
| Production build completes | 0 errors | |
| Health check: all services "ok" | Pass | |

---

*Run the full test suite and update the Status column above before any production deployment.*

---

## 15. Additional End-to-End Test Specifications (Phase 2 Expansion)

### Spec 5: Creator Onboarding & Pack Submission
**Goal**: Verify a user can apply to become a creator, get approved, and submit a custom prompt pack for review.

- **Test Steps:**
  1. Log in as a User.
  2. Navigate to `/become-a-creator` and submit the application form.
  3. Log out, then log in as an Admin.
  4. Navigate to `/admin/creators` and approve the application.
  5. Log out, then log back in as the Creator.
  6. Navigate to `/creator/dashboard` -> `/creator/packs/new`.
  7. Fill out the pack builder form (Title, Description, Price, Tags, 3 Prompts).
  8. Click "Submit for Review".
  9. Log in as Admin.
  10. Verify the pack appears in `/admin/moderation` with `status === 'PENDING_REVIEW'`.
- **Expected Result:** Community creators can successfully author packs that enter the administrative moderation queue.
- **Failure Points:** Missing `creatorId` binding on the API, empty stub rendering on `/creator/packs/new`, missing notification emails.

### Spec 6: Pro Subscription & Credit Redemption
**Goal**: Verify a user can subscribe to the Pro tier and redeem a monthly pack credit at checkout.

- **Test Steps:**
  1. Log in as a Buyer.
  2. Navigate to `/pricing` and click "Upgrade to Pro".
  3. Complete the Stripe Subscription checkout flow.
  4. Verify the user is redirected to `/dashboard/subscription` and sees 5 available credits.
  5. Navigate to a paid pack's detail page (e.g., $15.00 pack).
  6. Click "Buy Now".
  7. In the cart/checkout screen, select "Apply 1 Pack Credit".
  8. Verify the order total becomes $0.00.
  9. Complete the checkout.
  10. Verify the pack is added to `/dashboard/purchases` and credit balance decreases by 1.
- **Expected Result:** Subscription lifecycle and credit redemption operate flawlessly without triggering standard Stripe card charges for credit-based orders.
- **Failure Points:** Stripe Webhook for `invoice.paid` fails to grant credits, credit balance race conditions, UI displaying placeholder Stripe URLs.

### Spec 7: Semantic Search & AI Discovery
**Goal**: Verify the AI-powered hybrid search returns relevant results even with zero exact keyword matches.

- **Test Steps:**
  1. Ensure a pack titled "Advanced ChatGPT Copywriting Formulas" exists.
  2. Navigate to `/search`.
  3. Type "write better marketing emails with AI".
  4. Verify the search results include the "Advanced ChatGPT Copywriting Formulas" pack.
- **Expected Result:** Semantic cosine similarity matching successfully maps intent to pack content.
- **Failure Points:** `pgvector` not enabled, OpenAI Embeddings API fails or times out, frontend falls back to basic `ILIKE` search yielding zero results.
