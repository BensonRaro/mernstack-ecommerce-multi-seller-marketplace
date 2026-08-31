# Admin Dashboard — Stats, Sales Chart, Recent Activity

## Goal
Build the admin dashboard page at `/admin`. Shows platform-wide statistics (total users, sellers, products, revenue), a sales over time chart, and recent pending seller approvals. Follows the exact patterns established in the seller dashboard (stat cards, sales chart, recharts). Tanstack Query for data fetching, shadcn UI components.

## Affected Routes / Endpoints

### Backend

- **`backend/src/routes/admin.ts`** — add:
  1. **`GET /api/admin/stats`** — Platform-wide statistics.
     - Auth: `requireAuth` + `requireAdmin`
     - Returns: `{ totalUsers, totalSellers, pendingSellers, totalProducts, totalOrders, totalRevenue, salesOverTime: SalesPoint[], recentPendingSellers: PendingSeller[] }`
     - `totalUsers`: count of all users
     - `totalSellers`: count of all sellers
     - `pendingSellers`: count of sellers where `approved=false && revokedAt=null`
     - `totalProducts`: count of all products
     - `totalOrders`: count of all orders (excluding cancelled)
     - `totalRevenue`: sum of `total` from orders where `status !== "cancelled"`
     - `salesOverTime`: last 30 days revenue/orders per day (same logic as seller stats)
     - `recentPendingSellers`: top 5 sellers pending approval `{ id, name, username, createdAt, user: { name, email } }`, ordered by `createdAt desc`

### Frontend

- **`frontend/app/hooks/use-admin-stats.ts`** (new) — `useAdminStats()` query hook
  - `queryKey: ["admin-stats"]`
  - `queryFn: api.get<AdminStats>("/api/admin/stats")`
  - Export `AdminStats` interface

- **`frontend/app/routes/admin/index.tsx`** — replace placeholder with dashboard:
  - **Header**: "Admin Dashboard" title with `LayoutDashboard` icon
  - **Stat cards row** (4 cards): Total Users, Total Sellers, Total Products, Total Revenue — reuse `StatCard` pattern from seller dashboard
  - **Sales chart**: Reuse `SellerSalesChart` component (or identical recharts AreaChart) for platform-wide sales over time
  - **Pending sellers card**: Small card showing count of pending sellers with link to `/admin/sellers`
  - **States**: Loading skeletons for each section, empty states where applicable

## Design System
- Tokens from `app.css` only — no hardcoded hex.
- Stat cards: `gap-0 py-5 shadow-sm transition-colors hover:bg-muted/20` with icon in `bg-primary/10 text-primary` circle.
- Chart: recharts AreaChart with `var(--chart-1)` color, same config as seller sales chart.
- Pending sellers card: simple card with count and CTA link.

## Files to Create/Modify
1. `backend/src/routes/admin.ts` — add `GET /stats`
2. `frontend/app/hooks/use-admin-stats.ts` — new hook
3. `frontend/app/routes/admin/index.tsx` — replace placeholder

## What "Done" Looks Like
- [ ] Backend `GET /api/admin/stats` returns all platform stats
- [ ] Frontend `useAdminStats` hook
- [ ] `/admin` page with stat cards, sales chart, pending sellers card
- [ ] Loading skeletons, responsive layout
- [ ] `bun run typecheck` and `bun run build` pass
