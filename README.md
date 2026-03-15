# PromptVault

A full-stack AI prompt pack marketplace built with TypeScript.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TanStack Query, Wouter, Tailwind CSS + shadcn/ui |
| Backend | Express 5, TypeScript, Drizzle ORM |
| Database | PostgreSQL |
| Auth | JWT (access + refresh token rotation) |
| Payments | Stripe Checkout |
| PDF | pdfkit |
| Logging | Pino (structured JSON logs) |
| Monorepo | pnpm workspaces |

## Repository Structure

```
artifacts/
  api-server/           Express API server
  promptvault/          React frontend (Vite)
  mockup-sandbox/       Component preview server (canvas prototyping)
lib/
  db/                   Drizzle schema, client, migrations
  api-zod/              Shared Zod validation schemas
scripts/
  pre-deploy-check.ts   Production readiness checks
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Auth (must be >= 32 chars)
JWT_SECRET=your-very-long-secret-key
JWT_REFRESH_SECRET=your-very-long-refresh-secret-key

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI (optional)
ANTHROPIC_API_KEY=sk-ant-...

# App URL
APP_URL=http://localhost:19275
```

### Install & run

```bash
pnpm install
pnpm --filter @workspace/db run db:push
PORT=5000 pnpm --filter @workspace/api-server run dev
PORT=19275 BASE_PATH=/ pnpm --filter @workspace/promptvault run dev
```

## Security

- JWT secret entropy validated at startup (>=32 chars required)
- All monetary calculations use integer math (cents only)
- Server always recalculates totals from DB — never trusts client prices
- Passwords excluded from all API responses
- SQL ILIKE queries sanitized against wildcard injection
- Rate limiting on all auth endpoints
- Stripe webhook signature verification + idempotency guard
- Helmet.js security headers + strict CSP

## API Endpoints

### Auth
- `POST /api/auth/register` | `POST /api/auth/login` | `POST /api/auth/logout`
- `POST /api/auth/refresh` | `GET /api/auth/me`
- `POST /api/auth/forgot-password` | `POST /api/auth/reset-password`

### Packs (public)
- `GET /api/packs` | `GET /api/packs/featured` | `GET /api/packs/trending`
- `GET /api/packs/:slug` | `GET /api/packs/:slug/related`
- `GET /api/packs/:slug/download` *(auth required)*

### Checkout
- `POST /api/checkout/session` | `POST /api/checkout/free` *(auth required)*
- `POST /api/checkout/webhook` *(Stripe only)*
- `POST /api/coupons/validate`

### Admin *(ADMIN role required)*
- `GET /api/admin/dashboard`
- `/api/admin/packs` | `/api/admin/users` | `/api/admin/categories`
- `/api/admin/coupons` | `/api/admin/automation` | `/api/admin/moderation`

## Production Deploy

```bash
pnpm tsx scripts/pre-deploy-check.ts
pnpm --filter @workspace/promptvault run build
```

## Database Indexes

| Table | Index Columns |
|---|---|
| `packs` | `(status, published_at)`, `(category_id, status)`, `is_featured`, `slug`, `total_downloads` |
| `orders` | `(user_id, created_at)`, `status`, `stripe_session_id` |
| `order_items` | `order_id`, `pack_id` |
| `prompts` | `(pack_id, sort_order)` |
| `reviews` | `(pack_id, created_at)`, `user_id` |
