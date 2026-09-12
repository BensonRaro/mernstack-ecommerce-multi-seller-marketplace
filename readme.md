# Ecommerce — Multi-Seller Marketplace

Production-grade multi-seller ecommerce platform: **Buyers**, **Sellers**, and **Admins** on a single codebase. Each seller owns their storefront, products, promos, and orders — with admin-gated approval. Built with React Router (Framework Mode) + Express + Prisma (MongoDB), Better-Auth, Stripe, UploadThing, Resend, Inngest + Gemini AI.

> Monorepo: `backend/` (Express API) + `frontend/` (React Router SSR app)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database (Prisma + MongoDB)](#database-prisma--mongodb)
- [Running Locally](#running-locally)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Roles & Authorization](#roles--authorization)
- [Key Features Deep Dive](#key-features-deep-dive)
- [Scripts](#scripts)
- [Deployment (Vercel)](#deployment-vercel)
- [Conventions & Gotchas](#conventions--gotchas)
- [License](#license)

---

## Features

| Area | Details |
|---|---|
| **Auth** | Better-Auth (email + Google OAuth), session cookies, protected routes |
| **Roles** | Buyer / Seller / Admin (better-auth `admin` plugin, RBAC middlewares) |
| **Seller Onboarding** | Become-a-seller dialog → Admin approval / revocation with reason |
| **Products** | CRUD, categories, multi-image upload (UploadThing), stock/sizes/colors/gender, status (`draft`/`approved`/`rejected`), pagination + search, CSV/JSON export |
| **Shop & Discovery** | Shop page with category/price/rating filters + sorting, New Arrivals, Best Sellers, product cards with real review ratings |
| **Product Details** | Gallery, info, threaded reviews (rating + comment threads) |
| **Cart & Wishlist** | Zustand stores, drawer UI (right drawer desktop / bottom drawer mobile) |
| **Checkout** | Delivery toggle (pickup/delivery), saved addresses & phones, promo code, COD / Stripe Checkout, webhook-verified payment status |
| **Orders** | Buyer + seller order views, collapsible order items, status updates, pagination & search |
| **Promos** | Per-seller promo codes (code, discount %, expiry, active flag) |
| **Reviews** | Only verified purchasers can review; one rating per product + comment threads; edit/delete own reviews |
| **User Profile** | Addresses & phones CRUD, orders, reviews; default address/phone surfaced at checkout |
| **Seller Dashboard** | Stats (products/orders/revenue/avg rating), sales chart (Recharts), Best Sellers, AI Insights |
| **Admin Dashboard** | Overview metrics, Sellers (approve/revoke), Users (ban + filter by role), Products (approve/reject) |
| **AI Insights** | Gemini-powered: product suggestions + review summarization; Inngest background jobs + SSE streaming |
| **Emails** | Resend transactional emails (seller/product/order status changes) with custom template |
| **Activity UX** | Designed empty/loading/error states, toasts, subtle motion (150–250ms), fully responsive + a11y |

---

## Tech Stack

| Layer | Tech |
|---|---|
| **Language** | TypeScript |
| **Package Manager** | Bun (`bun.lock` in both workspaces) |
| **Frontend** | React 19, React Router 8 (framework mode, SSR), Vite 8 |
| **Styling** | Tailwind CSS 4, shadcn/ui, `tw-animate-css`, `class-variance-authority` |
| **State / Data** | Zustand, TanStack Query 5 + Axios, React Query Devtools |
| **Backend** | Node.js, Express 5, Helmet, CORS, Morgan, Cookie-Parser |
| **Auth** | Better-Auth 1.7 + `@better-auth/prisma-adapter` + `admin` & `stripe` plugins |
| **DB / ORM** | MongoDB, Prisma 6 (`generated/prisma` custom output) |
| **Uploads** | UploadThing 7 (Express adapter + React helpers) |
| **Payments** | Stripe 22 (`@better-auth/stripe`) + webhook |
| **Email** | Resend 6 |
| **AI / Jobs** | Inngest 4, Google Gemini (`GEMINI_API_KEY`) |
| **Charts / UI** | Recharts, Embla Carousel, `react-icons`, `date-fns` |
| **Deploy** | Vercel (`@vercel/react-router`, `@vercel/node`), Docker (frontend) |

---

## Architecture

```
ecommerce/
├── backend/               # Express REST API (port 5000)
│   └── src/
│       ├── server.ts      # Entry + route mounting + CORS/Helmet/Better-Auth
│       ├── controllers/   # Business logic (product, order, promo, review, user)
│       ├── routes/        # Routers (seller, product, order, promo, review, user, admin, ai-insights, files)
│       ├── middlewares/   # requireAuth, requireSeller, requireAdmin
│       ├── lib/           # prisma, auth, stripe, uploadthing, resend, gemini, permissions, emails
│       ├── inngest/       # client + functions (AI insights background jobs)
│       └── db/            # (if present) connection helpers
│   ├── prisma/
│   │   └── schema.prisma  # MongoDB models (User, Seller, Product, Order, Review, etc.)
│   ├── generated/prisma/  # Prisma client (gitignored)
│   └── vercel.json        # @vercel/node → src/server.ts
│
├── frontend/              # React Router app (port 5173)
│   └── app/
│       ├── routes.ts      # Framework route config (public / auth / seller / admin / user layouts)
│       ├── routes/        # Route modules (home, shop, product-details, checkout, seller/*, admin/*, profile)
│       ├── components/    # ui/ (shadcn), globals/ (header, hero, categories), feature folders (product, seller, admin, cart, checkout)
│       ├── hooks/         # TanStack Query hooks
│       ├── stores/        # Zustand (cart, wishlist)
│       ├── lib/           # API client, utils
│       └── constants/     # categories.ts etc.
│   ├── vite.config.ts     # tailwind + reactRouter plugins
│   ├── react-router.config.ts # ssr:true + vercelPreset()
│   └── vercel.json        # rewrites /api/* → backend vercel URL
│
├── prompts/               # Feature implementation prompts
├── prompts.md             # Build log (48 steps from Express setup → Vercel deploy)
└── AGENTS.md              # Workflow, conventions, design system
```

**Data flow:** `React Router loaders/actions` → thin client → `VITE_API_URL` → Express `/api/*` → Prisma/MongoDB. Auth cookies shared via `credentials: true` CORS. Frontend rewrites `/api/:path*` to deployed backend on Vercel.

---

## Prerequisites

- **Bun** ≥ 1.3 (`bun --version`) — required; fallback to npm/yarn only if Bun fails
- **Node** ≥ 20 (Bun bundles Node)
- **MongoDB** Atlas (or local) — `DATABASE_URL` must be a MongoDB connection string
- Accounts/keys for: **Google OAuth**, **UploadThing**, **Stripe**, **Resend**, **Gemini** (optional for AI insights), **Inngest** (dev server)

---

## Quick Start

```bash
# 1. Clone
git clone <repo-url>
cd ecommerce

# 2. Install (both workspaces)
bun install              # root (if present)
cd backend && bun install
cd ../frontend && bun install
cd ..

# 3. Env — copy and fill (see tables below)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 4. Prisma
cd backend
bunx prisma generate
bunx prisma db push      # or prisma migrate (MongoDB uses db push)
cd ..

# 5. Run (two terminals)
cd backend  && bun run dev   # http://localhost:5000  (nodemon + bun --env-file=.env)
cd frontend && bun run dev   # http://localhost:5173  (react-router dev + HMR)
```

> **Windows note:** Use `bun run --env-file=.env src/server.ts` (as in `backend/nodemon.json:5`) if env isn't loading.

---

## Environment Variables

### `backend/.env`

| Key | Required | Description |
|---|---|---|
| `PORT` | No | API port (default `5000`) |
| `NODE_ENV` | No | `development` / `production` |
| `FRONTEND_URL` | Yes | Allowed CORS origin — e.g. `http://localhost:5173` (prod: vercel frontend URL) |
| `DATABASE_URL` | Yes | MongoDB connection string |
| `BETTER_AUTH_SECRET` | Yes | Random 32+ char secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Yes | **Must be the frontend URL** on Vercel (rewrites handle `/api/auth/*`) — not the backend URL |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth |
| `UPLOADTHING_TOKEN` | Yes | UploadThing token |
| `STRIPE_SECRET_KEY` | Yes | `sk_...` |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_...` (Stripe CLI: `stripe listen --forward-to localhost:5000/api/webhooks/stripe`) |
| `RESEND_API_KEY` | Yes | Resend API key (from is `onboarding@resend.dev` in code) |
| `GEMINI_API_KEY` | For AI | Google AI Studio key |
| `INNGEST_DEV` | Dev | `1` to run Inngest dev server |

### `frontend/.env`

| Key | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend base URL — `http://localhost:5000` locally; `https://<backend>.vercel.app` in prod (or leave empty if using `vercel.json` rewrite `/api/*`) |
| `VITE_FRONTEND_URL` | No | Public frontend URL (canonical links, OG) |

**Never commit `.env`.** `.gitignore` already excludes it.

---

## Database (Prisma + MongoDB)

Models in `backend/prisma/schema.prisma:1` — `User`, `Seller`, `Session`, `Account`, `Verification`, `Product`, `Address`, `Phone`, `Promo`, `Order`, `OrderItem`, `Review`, `ReviewComment`, `AiInsight`, `AiInsightStream` (see file for full fields).

```bash
cd backend

# Regenerate client (custom output: generated/prisma)
bunx prisma generate

# Push schema to MongoDB (no migrations for MongoDB)
bunx prisma db push

# Prisma Studio
bunx prisma studio

# Emit contract (if configured)
bun run contract:emit
```

Prisma output is at `backend/generated/prisma` and `backend/node_modules/.prisma` (both ignored by git).

---

## Running Locally

| Command | Workspace | What it does |
|---|---|---|
| `bun run dev` | `backend` | Nodemon watching `src/` → `bun run --env-file=.env src/server.ts` |
| `bun run dev` | `frontend` | `react-router dev` with HMR at `5173` |
| `bun run build` | `frontend` | `react-router build` → `build/client` + `build/server` |
| `bun run typecheck` | `frontend` | `react-router typegen && tsc` |
| `bun run start` | `backend` | `bun run src/server.ts` (prod) |
| `bun run start` | `frontend` | `react-router-serve ./build/server/index.js` |
| Inngest dev | `backend` | `npx inngest-cli@latest dev` (exposes `http://localhost:8288`, backend serves at `/api/inngest`) |

Health checks: `GET /` and `GET /health` on backend; `GET /api/me` returns Better-Auth session.

---

## Project Structure

<details>
<summary>Backend routes</summary>

- `src/server.ts` — Helmet, CORS (`FRONTEND_URL`, `credentials:true`), Morgan, `toNodeHandler(auth)` at `/api/auth/*splat`, JSON/body parsers, `/api/inngest` (Inngest serve), `/api/uploadthing`, health, `/api/me`, then feature routers.
- `routes/seller.ts`, `product.ts`, `order.ts`, `promo.ts`, `review.ts`, `user.ts`, `admin.ts`, `ai-insights.ts`, `files.ts`
- `controllers/` mirrors routes (thin routes, logic in controllers)
- `middlewares/require-auth.ts`, `require-seller.ts`, `require-admin.ts`

</details>

<details>
<summary>Frontend routes</summary>

`app/routes.ts` layouts:

- `public` → `/` (home), `/shop`, `/product/:id`, `/checkout`, `/order-confirmation/:id`, `/:username` (seller profile)
- `auth` → `/signup`, `/login` (redirects if already authenticated)
- `seller` → `/seller`, `/seller/products`, `/seller/products/create`, `/seller/products/:id/edit`, `/seller/promos`, `/seller/orders`, `/seller/settings`, `/seller/ai-insights`
- `admin` → `/admin`, `/admin/sellers`, `/admin/users`, `/admin/products`
- `user` → `/profile`, `/settings`

</details>

---

## API Overview

Base: `http://localhost:5000` (prod via `VITE_API_URL` or Vercel rewrite)

| Prefix | Auth | Description |
|---|---|---|
| `GET /`, `GET /health`, `GET /api/me` | — / session | Health + session |
| `/api/auth/*` | — | Better-Auth handler (Google OAuth, email) |
| `/api/seller` | `requireAuth` | Become seller, get/update seller profile |
| `/api/products` | `requireSeller` for write | CRUD, list with pagination/search/category, seller-scoped |
| `/api/orders` | `requireAuth` | Create (COD/Stripe), list, update status; seller sees own orders |
| `/api/promos` | `requireSeller` | Seller promo CRUD; validated at checkout |
| `/api/reviews` | `requireAuth` | Create/edit/delete (purchaser-only, one rating per product), comments |
| `/api/user` | `requireAuth` | Profile, addresses & phones CRUD, orders, reviews |
| `/api/admin/*` | `requireAdmin` | Dashboard stats, sellers (approve/revoke), users (ban), products (approve/reject) |
| `/api/seller/ai-insights` | `requireSeller` | Trigger + SSE stream for Gemini insights |
| `/api/uploadthing` | — | UploadThing Express handler |
| `/api/inngest` | — | Inngest serve endpoint |
| `/api/files` | — | File helpers |

All feature routes support **pagination** (`page`, `limit`) and **search** (`q`/`search`) where listed. Product/shop admin lists add filters (`category`, `status`, `role`, `approvalStatus`).

---

## Roles & Authorization

- **Buyer** — default role. Browse, cart/wishlist, checkout, orders, reviews, profile.
- **Seller** — `POST /api/seller` to create. Requires `approved: true` (admin) before products are visible and before product/promo CRUD is allowed. `revokedAt` + `revokedReason` blocks all seller mutations; revoked products are hidden globally.
- **Admin** — `role === "admin"` (set via Better-Auth admin plugin). Access to `/admin/*` layout + `/api/admin/*`. Can approve/revoke sellers (with reason), ban users (cascades to seller products), approve/reject products.

Middlewares: `requireAuth` → `requireSeller` (checks seller exists + approved + not revoked) → `requireAdmin`.

Seller revocation hides products app-wide; banning a seller-user has the same effect.

---

## Key Features Deep Dive

- **Uploads:** UploadThing token auth; images stored as `Product.images[]` + `Seller.image`. Custom file picker UI + shadcn dialog.
- **Payments:** Stripe Checkout session created on order; `STRIPE_WEBHOOK_SECRET` verifies webhook to set `paymentStatus` (`pending`/`paid`/`failed`). COD skips Stripe.
- **Emails:** `Resend` via `lib/resend.ts` / `lib/emails.ts`; custom HTML template; events: product approved/rejected, order status change, seller approved/revoked. `from` is fixed to `Resend <onboarding@resend.dev>`; `to` override noted in `prompts.md:167`.
- **AI Insights:** `Inngest` functions in `src/inngest/functions.ts` call Gemini; results streamed to frontend via SSE and persisted in `AiInsight`/`AiInsightStream`.
- **Cart/Wishlist:** Zustand stores in `frontend/app/stores/`; persisted locally; drawers use shadcn `Drawer` (undocked, responsive).
- **Design system:** CSS-variable theme (tomato primary from prompts image) in `app/app.css`; single type scale (Noto Sans + Playfair Display), 4px spacing, 150–250ms transitions, intentional empty/loading/error states.

---

## Scripts

**Backend (`backend/package.json`)**

```bash
bun run dev              # nodemon
bun run start            # bun src/server.ts
bunx prisma generate     # regenerate client
bunx prisma db push
```

**Frontend (`frontend/package.json`)**

```bash
bun run dev              # react-router dev (5173)
bun run build            # react-router build
bun run start            # react-router-serve
bun run typecheck        # react-router typegen && tsc
```

---

## Deployment (Vercel)

Both apps are Vercel-ready:

- **Backend `vercel.json:1`** — `version:2`, `builds: [{ src: "src/server.ts", use: "@vercel/node" }]`, rewrite `/(.*)` → `/src/server.ts`. **All backend local imports must end with `.js`** (ESM + Vercel).
- **Frontend `vercel.json:1`** / `react-router.config.ts:4` — `vercelPreset()`, `ssr:true`; rewrites `/api/:path*` → `https://ecommerce-backend-nine-beta.vercel.app/api/:path*`.
- Set all env vars in Vercel dashboard for each project. Critical: `BETTER_AUTH_URL` must be the **frontend** Vercel URL, not the backend URL (Vercel rewrites proxy auth).
- Prisma: `postinstall: prisma generate` runs on Vercel; ensure `DATABASE_URL` is set.

Docker alternative for frontend: `docker build -t app . && docker run -p 3000:3000 app` (see `frontend/Dockerfile`).

---

## Conventions & Gotchas

- **Always use Bun** (`bun install`, `bun run`) — both workspaces have `bun.lock`.
- **Backend imports need `.js` extension** — e.g. `import { auth } from "./lib/auth.js"` — required for Vercel ESM.
- **Vercel `BETTER_AUTH_URL` trap** — must point to frontend URL (see Deployment).
- **No scrollbar globally** — `app.css` hides scrollbars; don't reintroduce.
- **Components:** minimal route files → logic in `components/` grouped by feature (`product/`, `seller/`, `admin/`), globals in `components/globals/`, shadcn primitives in `components/ui/`.
- **TanStack Query** for all API calls; Zustand for cart/wishlist only.
- **Prompts workflow** (AGENTS.md): clarify ambiguity → write `prompts/<name>.md` → get approval → implement → typecheck → share edited files.
- **Skills:** `.agents/skills/{react-router,shadcn,resend,better-auth-best-practices}/SKILL.md` — load only when relevant.

---

## License

ISC — see `backend/package.json`.
