# Seller Dashboard — Home Page for Sellers

## Goal

Make `/seller` the seller's home dashboard (not a redirect). It shows at a glance the health of the seller's store: total products, total orders, total revenue, and average rating, plus a sales-over-time chart. Use TanStack Query for data fetching and shadcn UI components customized to match the app's elegant, modern theme (CSS-variable tokens, no hardcoded hex).

## Affected Routes / Endpoints

### Backend

**New endpoint — `GET /api/seller/stats`** (mounted in `backend/src/routes/seller.ts`)

- **Auth**: `requireAuth` + `requireSeller` (session must exist and `user.role === "seller"`). Returns 401/403 otherwise.
- **Response shape**:
  ```ts
  {
    totalProducts: number;      // count of Product where sellerId = seller.id
    totalOrders: number;        // distinct Order count where OrderItem.sellerId = seller.id
    totalRevenue: number;       // sum(price * quantity) over OrderItem where sellerId = seller.id, only orders where status !== "cancelled" (or only paid? — see Open Questions)
    avgRating: number;          // 0-5, 1 decimal, avg over Review where product.sellerId = seller.id (0 if none)
    totalReviews: number;
    salesOverTime: Array<{ date: string; revenue: number; orders: number }>; // last 30 days, daily granularity, zero-filled
  }
  ```
- **Logic**:
  - Lookup `seller` by `userId = session.user.id`; if not found 404.
  - `totalProducts`: `prisma.product.count({ where: { sellerId: seller.id } })` (include all statuses; alternatively only `active` — document choice).
  - `totalOrders`: find distinct `orderId` from `orderItem` where `sellerId = seller.id`, then count those orders (filter cancelled if decided).
  - `totalRevenue`: `prisma.orderItem.findMany` or `aggregate` sum of `price * quantity` for seller's items. Use aggregation in JS loop for Mongo (Prisma aggregate over computed field not trivial). Filter by order status as above.
  - `avgRating` + `totalReviews`: `prisma.review.aggregate` where `product: { sellerId: seller.id }`.
  - `salesOverTime`: query `orderItem` with `include: { order: { select: { createdAt, status } } }` where sellerId and createdAt >= 30 days ago, group by day (YYYY-MM-DD) in JS, sum revenue and count orders per day, zero-fill missing days, sort asc.
- **File**: new controller `backend/src/controllers/seller-stats.ts` or inline in `routes/seller.ts`. Keep `import ... from "...js"` for Vercel.
- **Mount**: `router.get("/stats", requireAuth, requireSeller, getSellerStats)` in `backend/src/routes/seller.ts`.

No Prisma schema change required.

### Frontend

**Route changes**
- `frontend/app/routes.ts`: keep `layout("routes/seller/layout.tsx", [ route("seller", "routes/seller/index.tsx") ... ])` but `routes/seller/index.tsx` becomes dashboard page, not redirect.
- `frontend/app/routes/seller/index.tsx`: new dashboard page component. No loader, purely client query via TanStack Query. Keep auth guard in `layout.tsx` (already checks seller role).
- `frontend/app/components/seller/seller-sidebar.tsx`: add Dashboard nav item `{ to: "/seller", label: "Dashboard", icon: LayoutDashboard }` at top; ensure `end` prop for active state.

**Hooks**
- `frontend/app/hooks/use-seller-stats.ts` (new):
  ```ts
  export interface SellerStats { totalProducts: number; totalOrders: number; totalRevenue: number; avgRating: number; totalReviews: number; salesOverTime: Array<{ date: string; revenue: number; orders: number }> }
  export function useSellerStats() { return useQuery({ queryKey: ["seller-stats"], queryFn: () => api.get<SellerStats>("/api/seller/stats") }) }
  ```

**Components (grouped by feature, minimal routes)**
- `frontend/app/components/seller/seller-stat-cards.tsx`: 4 cards in grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`). Each card uses `Card`, `CardHeader`, `CardContent`, `CardTitle`. Icons: `Package` (Products), `ShoppingBag` (Orders), `DollarSign` (Revenue), `Star` (Rating). Show skeleton while loading, error state with retry.
- `frontend/app/components/seller/seller-sales-chart.tsx`: Card wrapping `ChartContainer` + `recharts` `AreaChart` (or `LineChart`) with `XAxis: date`, `YAxis: revenue`, `Tooltip`, `CartesianGrid`. Use `chart-1` token for stroke/fill. Handle empty (all zeros) with `Empty` state. Responsive. Props: `data: SellerStats["salesOverTime"]`.
- Optional helper: format currency `$${value.toLocaleString()}` and date label `MMM d`.

**Page layout (`routes/seller/index.tsx`)**
- Header: `h1` font-heading tracking-tight "Dashboard", subtitle "Welcome back — here's what's happening with your store."
- Stats grid (4 cards)
- Chart card: title "Sales over time" + subtitle "Revenue last 30 days" + chart (height ~280px)
- States: loading -> 4 skeletons + chart skeleton; error -> card with AlertCircle + Retry button calling `refetch`; empty -> stat cards show 0, chart shows empty message.
- Use `useSellerStats` hook.

## Data Model Changes

None. Reuses existing models: `Seller`, `Product`, `OrderItem`, `Order`, `Review`. If `totalProducts` should filter by status, note in implementation; default is count all products.

## Edge Cases

- Seller not found: backend 404, frontend shows error with "Seller profile not found".
- No products/orders/reviews: stats are 0, chart is zero-filled 30 days, avgRating 0, show empty helper text "No sales yet" inside chart card.
- Cancelled orders: exclude from `totalOrders` and `totalRevenue` and `salesOverTime` (document and implement).
- Timezone: group by UTC date string to avoid drift; last 30 days inclusive of today.
- Auth: `layout.tsx` already gates non-sellers; stats endpoint also checks `requireSeller`.
- Large data: `salesOverTime` aggregation does JS grouping, acceptable for <10k orderItems; add `createdAt` index implicitly via Mongo.
- Hardcoded `API_BASE = http://localhost:5000` matches existing `lib/api.ts`; keep credentials include.
- Loading/error/empty states must be intentional, not bare "No data."

## Design System

- Tokens only: `bg-card`, `text-card-foreground`, `border-border`, `text-muted-foreground`, `text-primary`, `chart-1` etc. No hex.
- Typography: `font-heading` for card titles/page title, `font-sans` for body. Keep ~5 size steps.
- Spacing: Tailwind 4px scale, `gap-4/5/6`, `p-4/5/6`.
- Motion: 150-250ms ease-out for card hover if any.
- Shadcn: `Card`, `Skeleton`, `Empty`, `ChartContainer`/`ChartTooltip`, `Spinner` for loading.
- Icons: `lucide-react` only.
- Responsive: 1 col mobile, 2 cols tablet, 4 cols desktop for stats; chart full-width.
- Accessibility: semantic headings, aria labels for chart.

## What "Done" Looks Like

- [ ] `GET /api/seller/stats` returns correct shape, gated by seller auth, handles empty seller data.
- [ ] `useSellerStats` hook uses TanStack Query and `api.get`.
- [ ] `/seller` renders dashboard, not redirect; sidebar has Dashboard link highlighted when active.
- [ ] 4 stat cards show totalProducts, totalOrders, totalRevenue (formatted currency), avgRating (with Star and totalReviews count).
- [ ] Sales chart shows last 30 days daily revenue (AreaChart with gradient, tooltip), zero-filled, responsive.
- [ ] Loading shows skeletons, error shows retry, empty shows intentional empty state.
- [ ] Custom shadcn styling matches app tokens (no hardcoded colors).
- [ ] `bun run typecheck` passes frontend & backend; `bun run build` succeeds.
- [ ] Vertically verify via dev server and network tab that stats endpoint is called with credentials.

## Open Question

Total revenue definition: should it sum all seller OrderItems regardless of payment/status, or only orders where `paymentStatus = "paid"` or `status !== "cancelled"`? Proposed: exclude `cancelled` only, include pending/confirmed/shipped/delivered.
