# Seller Orders — Pagination, Search, Status Management

## Goal
Build the seller orders page where sellers view and manage orders containing their products. Includes server-side pagination, search, status filters, and order status updates. Elegant, slick design consistent with seller products page (Card/table, reusable SearchInput/DataPagination).

## Affected Routes / Endpoints

### Backend
- `prisma/schema.prisma` — existing `Order`/`OrderItem` used. No schema change. Status fields already `status` (pending/confirmed/shipped/delivered/cancelled) and `paymentStatus` (pending/paid/failed). Ensure index on `OrderItem.sellerId` via query.

- `backend/src/controllers/order.ts` — add:
  - `listSellerOrders(req,res)` — requireAuth + requireSeller, find seller by userId, pagination `page/limit` (default 1/10, max 50), `search` (trim, case-insensitive): matches `phoneNumber` contains, `id` contains (last 8 chars), `promoCode` contains, or `items.product.name` via lookup (optional: fetch product names). Also `status` filter exact, `paymentStatus`, `deliveryStatus`. Query via `OrderItem` sellerId: first find `orderIds` from `OrderItem` where `sellerId=seller.id`, then `Order` where `id in orderIds` + search/status filters. Count total, compute totalPages. Sort `createdAt desc`. Include `items` with `product` (select id,name,images,price) and `user` (name,email). Return `{orders, total, page, limit, totalPages}`.
  - `updateOrderStatus(req,res)` — `PATCH /api/orders/:id/status` body `{status}` valid enum, check order exists, check order contains seller's items (seller owns at least one OrderItem), update `status`, return order.

- `backend/src/routes/order.ts` — keep buyer `GET /`/`GET/:id`, add `GET /seller` (requireAuth+requireSeller -> listSellerOrders) and `PATCH /:id/status` (requireSeller). Ensure seller route mounted before `/:id` to avoid conflict. Mounted at `/api/orders` in `server.ts`.

- `backend/src/routes/seller.ts` — no change.

### Frontend
- `frontend/app/hooks/use-orders.ts` (new) — `useSellerOrders(params:{page,limit,search,status,paymentStatus})` queryKey `["seller-orders", params]`, `GET /api/orders/seller?page=&limit=&search=&status=`, `keepPreviousData`. `useUpdateOrderStatus()` mutation `PATCH /api/orders/:id/status` invalidates `seller-orders`.

- `frontend/app/routes/seller/orders.tsx` — replace Empty placeholder with full page:
  - Header: `Orders` title + total badge, status filter Select (All/Pending/Confirmed/Shipped/Delivered/Cancelled)
  - Toolbar: `SearchInput` (search id/phone/promo) + status filter, clear button, `isFetching` spinner
  - Card table (shadcn Table): columns `Order` (id short + date), `Customer` (phone / deliveryStatus), `Items` (thumbnails + count + names), `Total` (subtotal, discount, total), `Payment` (cod/stripe + paid/pending badge), `Status` (badge with dot), `Actions` (Dropdown: View, status update Select)
  - Row expand? For MVP, show first product thumbnail + `+N more`. Use statusStyles similar to products.
  - States: loading Skeleton rows, error Empty with Retry, empty (no orders) with CTA, no results with clear.
  - Footer: `DataPagination` reusable, showing `Showing X-Y of Z`.

- Reuse `frontend/app/components/globals/search-input.tsx` and `data-pagination.tsx` (already used in products).

### TanStack Query
- New hook `useSellerOrders` paginated, `keepPreviousData`.

## Data Model Changes
- None. Reuse existing Order/OrderItem.

## Edge Cases
- Seller with no orders → empty state "No orders yet"
- Search no results → "No results for \"x\"" + clear
- Page out of bounds → clamp, reset to 1 on search/status change
- Order contains multiple sellers → seller sees only their items counted? For display, show all items but highlight own? Simpler: filter display to seller's items count, total remains order total (or seller portion? Show order total for context)
- Status update forbidden (order not containing seller) → 403
- Invalid status enum → 400
- Network error → retry
- Pagination limit capped 50

## Design System
- Tokens from `app.css` only, tomato primary, Playfair heading, Noto body, rounded-2xl Card, ring-1 ring-foreground/5, 200ms transitions, lucide-react (ShoppingBag, Search, AlertCircle, Package).
- Responsive: toolbar stacks on mobile, table horizontal scroll, pagination wraps.

## What "Done" Looks Like
- [ ] Prompt at `prompts/seller-orders.md`
- [ ] Backend seller orders list with pagination/search/status + status update
- [ ] Hook `useSellerOrders` + `useUpdateOrderStatus`
- [ ] `/seller/orders` page with SearchInput, status Select, Table, DataPagination, loading/error/empty states, status update
- [ ] Elegant theme, no hardcoded hex
- [ ] `bun run typecheck`/`build` passes
