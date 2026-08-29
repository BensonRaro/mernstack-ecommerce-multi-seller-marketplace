# Seller Public Profile (/:username) — Unique Username + Average Rating

## Goal
Add unique `username` to Seller, expose public profile at `/:username` (elegant, not default shadcn) showing seller header, average rating from product reviews, tabs for Products and Reviews. Backend and frontend updated to handle username lifecycle (creation, validation, edit). Use TanStack Query, shadcn customized.

## Affected Routes / Endpoints

### Backend
- `prisma/schema.prisma` — `Seller` add `username String @unique` (3-20 chars, lowercase alphanumeric + `_`/`-`, indexed), `@@index([username])`. Generate client. For existing sellers, backfill via script or allow null then migrate (make `String? @unique` initially then require).
- `backend/src/routes/seller.ts` — update `POST /` to require `username` (validate regex `^[a-z0-9_-]{3,20}$`, lowercased, unique check, if missing generate from name slug + suffix), `PATCH /me` allow `username` update with same validation + uniqueness check (exclude self).
- `backend/src/controllers/seller.ts` (or inline) — add `GET /api/sellers/:username` public: find seller by `username`, include `user` (name,email,image), compute `avgRating` via `prisma.review.aggregate` where `product.sellerId = seller.id`, count reviews, count products (`status=active`), return `{seller, avgRating, totalReviews, productCount}`.
- `backend/src/controllers/product.ts` / `review.ts` — ensure seller products endpoint can filter by `sellerId` or username, reviews aggregation already via Review.
- Add `GET /api/sellers/:username/products` and `GET /api/sellers/:username/reviews` or reuse via `GET /api/products?sellerId=xxx` and `GET /api/reviews/product` grouped.

### Frontend
- `frontend/app/components/seller/become-seller-dialog.tsx` — add Username field (`Input` with `Field`, regex, live check via `GET /api/sellers/check/:username` or debounced, show availability, required).
- `frontend/app/components/seller/seller-settings-form.tsx` — add username field editable (same validation), show profile link `/{username}`.
- `frontend/app/hooks/use-seller.ts` (or `use-auth.ts`) — add `useSellerByUsername(username)`, `useCheckUsername`.
- `frontend/app/routes.ts` — add `route(":username", "routes/seller-profile.tsx")` under public layout, after static routes (static priority > dynamic, so `/seller`, `/checkout` still work).
- `frontend/app/routes/seller-profile.tsx` — minimal route, uses `useParams` `username`, `useSellerByUsername`. Header: avatar `image` fallback initial, name, `@username`, approved badge (`CheckCircle/Clock`), avg rating `Star` + `avg.toFixed(1)` + total reviews, product count, description, createdAt. Tabs `Tabs` (Products / Reviews) with `TabsList` `rounded-full`. Products tab: `ProductCard` grid (`grid-cols-2 lg:grid-cols-3`) with `usePublicProducts` filtered by `sellerId`. Reviews tab: list aggregated reviews across seller's products (avatar, product thumb, rating, comment, date), with pagination if many. Empty states with `Empty`.
- `frontend/app/components/product/ProductCard.tsx` — seller name now links to `/${seller.username}`? Need seller username in product.seller relation (include username in product query).

### Data Model Changes
- `Seller.username` unique, indexed. Migration via `prisma generate`.

### Edge Cases
- Username taken → 409, show FieldError
- Invalid format → 400
- Existing sellers without username → fallback to `name` slug + id suffix, or allow null then prompt to set in settings
- Reserved usernames (`seller`, `checkout`, `product`, `login`, `admin`) → 400
- Average rating no reviews → show `—` or `0.0` + `No reviews yet`
- Seller not found → `Empty` 404 with back to home
- Username change → invalidates old link, redirect? For MVP, old link 404
- Private/banned sellers → still show but with `Banned` badge? Hide products if banned

## Design System
- Tokens from `app.css` only, tomato primary, Playfair heading, Noto body, `rounded-2xl`, `ring-1`, `150ms`, `lucide-react` (`Star`, `Store`, `CheckCircle`, `Package`). Elegant header with `Card`, tabs `rounded-full bg-muted`.

## What "Done" Looks Like
- [ ] Prompt at `prompts/seller-profile.md`
- [ ] Seller `username` unique, backend validates, public GET by username returns avgRating/products/reviews
- [ ] Become-seller dialog + settings allow edit username with validation
- [ ] Public `/:username` page shows header, avg rating, tabs Products/Reviews, TanStack Query, shadcn customized
- [ ] `ProductCard` seller link goes to `/:username`
- [ ] `bun run typecheck`/`build` passes
