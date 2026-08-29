# Seller Promo Codes — Dashboard + Checkout Integration

## Goal
Enable sellers to create/manage their own promo codes via dashboard and make checkout validate/apply seller-specific codes (replacing mock SAVE10). Global admin codes remain possible. Elegant UI consistent with existing seller products table and checkout cards.

## Affected Routes / Endpoints

### Backend
- `prisma/schema.prisma` — update `Promo`:
  ```
  model Promo {
    id              String   @id @default(auto()) @map("_id") @db.ObjectId
    code            String
    discountPercent Float
    active          Boolean  @default(true)
    sellerId        String?  @db.ObjectId
    seller          Seller?  @relation(fields: [sellerId], references: [id], onDelete: Cascade)
    expiresAt       DateTime?
    createdAt       DateTime @default(now())
    updatedAt       DateTime @updatedAt
    @@unique([sellerId, code])
    @@map("promo")
  }
  ```
  Add `promos Promo[]` to `Seller`. Keep existing global promos (`sellerId null`). Generate client.

- `backend/src/controllers/promo.ts` — 
  - `listSellerPromos` (requireAuth+requireSeller, find by sellerId)
  - `createPromo` (validate code non-empty, uppercased, discount 1-90, code unique per seller, optional expiresAt)
  - `updatePromo` (toggle active, update discount/expires)
  - `deletePromo`
  - `validatePromo` (public, POST {code, cartSellerIds?} — finds active promo where code==upper and (sellerId null OR sellerId in cartSellerIds), checks expiresAt, returns {valid, discountPercent, sellerId, code})

- `backend/src/controllers/order.ts` — update `resolvePromo` to accept `sellerIds` from cart, lookup seller promos + global, apply discount per seller subtotal vs entire. For MVP: if promo sellerId matches any cart seller, apply discount to that seller's portion; if global promo, apply to whole subtotal. Remove MOCK_PROMOS fallback except for seed.

- `backend/src/routes/promo.ts` — `GET /api/promos/mine`, `POST /api/promos`, `PUT /api/promos/:id`, `DELETE /api/promos/:id`, `POST /api/promos/validate` (public). Mount at `/api/promos` in `server.ts`.

### Frontend
- `frontend/app/hooks/use-promos.ts` — TanStack Query hooks: `useSellerPromos()`, `useCreatePromo()`, `useUpdatePromo()`, `useDeletePromo()`, `useValidatePromo()` (mutation).

- `frontend/app/routes/seller/promos.tsx` — new seller route. Keeps route minimal, pushes UI to components:
  - Header with title + count + Create button (dialog)
  - Card table with search? Reuse `SearchInput` + `DataPagination` pattern. Columns: Code, Discount, Status (active badge), Expires, Seller (self), Actions (edit/toggle/delete)
  - Empty/loading/error states (Empty with Package icon)
  - Dialog `PromoDialog` for create/edit (fields: code, discount, active switch, expires date)

- `frontend/app/components/checkout/PromoField.tsx` — update to call `POST /api/promos/validate` with `code` + cart `sellerIds` (derived from cart items), handle async, show seller name if seller promo, keep mock fallback for global SAVE10 during transition. Update `OrderSummary` to reflect per-seller discount.

- `frontend/app/routes/checkout.tsx` — derive `sellerIds` from cart, pass to validate, store `appliedPromo` {code, discount, sellerId}, apply discount in summary and send `promoCode` to order create.

## Data Model Changes
- Prisma Promo seller relation + expiry. Migration via `prisma generate`.

## Edge Cases
- Duplicate code per seller → 400 "Code already exists for this seller"
- Expired promo → validate returns invalid, checkout shows error
- Inactive promo → invalid
- Cart with multiple sellers and promo from one seller → discount only that seller's subtotal (or entire if global), show note "Discount from Seller X"
- Empty promo list → empty state with CTA
- Stock/price changes between validate and order create → re-validate server-side in order controller
- Unauthorized: non-seller cannot create promos, can only validate

## Design System
- Same elegant tokens (tomato primary), Playfair headings, Noto body, rounded-2xl cards, 200ms transitions, lucide-react (Tag, Percent, Calendar, Trash2). Reuse seller products table styling.

## What "Done" Looks Like
- [ ] Prompt at `prompts/seller-promo.md`
- [ ] Prisma Promo updated + generate
- [ ] Seller promo CRUD + validate endpoints, mounted
- [ ] Checkout resolves seller promos correctly
- [ ] Seller dashboard `/seller/promos` with table, search, pagination, create/edit dialog
- [ ] Checkout `PromoField` uses seller promos (not just mock)
- [ ] `bun run typecheck` + `build` passes
