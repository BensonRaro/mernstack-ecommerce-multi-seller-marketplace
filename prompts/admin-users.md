# Admin Users — List, Filter, Search, Pagination, Ban

## Goal
Build the admin users management page at `/admin/users`. Admins can view all platform users (buyers, sellers, admins), filter by role, search by name/email, paginate results, and ban/unban users. Follows the exact patterns established in the admin sellers page (`/admin/sellers`). Tanstack Query for data fetching, shadcn UI components styled to match the existing design system.

## Affected Routes / Endpoints

### Backend

- **`backend/src/routes/admin.ts`** — add two new endpoints:

  1. **`GET /api/admin/users`** — List all users with pagination, search, and role filter.
     - Auth: `requireAuth` + `requireAdmin`
     - Query params: `page` (default 1), `limit` (default 10, max 50), `search` (string, case-insensitive), `role` (string: "buyer" | "seller" | "admin" or empty for all)
     - Search matches: `name` contains, `email` contains (case-insensitive via Prisma `contains` + `mode: "insensitive"`)
     - Query `prisma.user.findMany()` with `include: { seller: { select: { id: true, name: true, username: true, approved: true } } }` to show seller info if user is a seller
     - Count total, compute totalPages. Sort `createdAt desc`.
     - Return `{ users: UserWithSeller[], total, page, limit, totalPages }`
     - User shape: `{ id, name, email, image, role, banned, createdAt, seller: { id, name, username, approved } | null }`

  2. **`PATCH /api/admin/users/:id/ban`** — Ban or unban a user.
     - Auth: `requireAuth` + `requireAdmin`
     - Body: `{ banned: boolean }`
     - Validate user exists, prevent admin from banning themselves
     - Update `prisma.user.update({ where: { id }, data: { banned } })`
     - If the user is a seller and banned=true, also archive their active products: `prisma.product.updateMany({ where: { sellerId: user.seller.id, status: { not: "archived" } }, data: { status: "archived" } })`
     - If unbanning, restore products to "active" status: `prisma.product.updateMany({ where: { sellerId: user.seller.id, status: "archived" }, data: { status: "active" } })`
     - Return `{ success: true }`

### Frontend

- **`frontend/app/hooks/use-admin-users.ts`** (new) — Tanstack Query hooks:
  - `useAdminUsers(params: { page, limit, search, role })` — `queryKey: ["admin-users", params]`, `queryFn: api.get<UsersResponse>("/api/admin/users?...")`, `placeholderData: keepPreviousData`
  - `useBanUser()` — mutation `PATCH /api/admin/users/:id/ban` with `{ banned }` body, invalidates `["admin-users"]`
  - Export interfaces: `AdminUser`, `UsersResponse`, `UsersParams`
  - `AdminUser` shape: `{ id, name, email, image, role, banned, createdAt, seller: { id, name, username, approved } | null }`

- **`frontend/app/routes/admin/users.tsx`** — replace placeholder with full page:
  - **Header**: "Users" title with `Users` icon, user count on the right
  - **Card table container**: `gap-0 overflow-hidden p-0 shadow-sm` (same as sellers)
  - **Toolbar**: `SearchInput` (search by name or email) + `Select` for role filter (All / Buyers / Sellers / Admins)
  - **Table columns**: User (avatar + name + email), Role (badge), Status (banned badge), Joined (date), Actions (Ban/Unban button)
  - **Role badge**: buyer = blue/indigo, seller = emerald (if approved) or amber (if pending), admin = purple
  - **Status badge**: banned = destructive badge, active = emerald badge
  - **Ban action**: confirmation dialog (same overlay pattern as sellers page) — show warning about archiving products if seller
  - **States**: Loading skeleton, error with retry, empty state ("No users found" / "No users have signed up yet")
  - **Footer**: `DataPagination` reusable component for pagination

## Edge Cases
- Admin cannot ban themselves → disable ban button for own account, or show error toast
- User with no seller record → show `—` or just role badge, no seller info
- Banning a seller archives their products; unbanning restores them
- Search with no results → "No users found" + clear search CTA
- Role filter + search combined → reset page to 1 on any filter change
- Page out of bounds → clamp, reset to 1 on filter/search change
- Network error → retry button
- Pagination limit capped at 50

## Design System
- Tokens from `app.css` only — no hardcoded hex. Tomato primary, Playfair heading, Noto body.
- Rounded-2xl Card, `ring-1 ring-foreground/5`, 200ms transitions.
- lucide-react icons: `Users`, `Shield`, `Search`, `AlertCircle`, `Ban`, `UserCheck`.
- Status badges: `inline-flex items-center gap-1.5 rounded-full` with `bg-{color}/10 text-{color}` and `ring-1 ring-{color}/20` (11px, uppercase, tracking-widest).
- Responsive: toolbar stacks on mobile, table horizontal scroll, pagination wraps.
- Reuse `SearchInput`, `DataPagination`, `Avatar` components.
- Confirmation dialog: manual overlay `div` with backdrop blur (same as sellers page).

## Files to Create/Modify
1. `backend/src/routes/admin.ts` — add `GET /users` and `PATCH /users/:id/ban`
2. `frontend/app/hooks/use-admin-users.ts` — new hook file
3. `frontend/app/routes/admin/users.tsx` — replace placeholder

## What "Done" Looks Like
- [ ] Prompt at `prompts/admin-users.md`
- [ ] Backend: `GET /api/admin/users` with pagination, search, role filter
- [ ] Backend: `PATCH /api/admin/users/:id/ban` with product archival for sellers
- [ ] Frontend: `useAdminUsers` hook with `keepPreviousData` + `useBanUser` mutation
- [ ] `/admin/users` page: SearchInput, role Select, Table, DataPagination, loading/error/empty states, ban/unban with confirmation dialog
- [ ] Role badges color-coded, status badges, avatar fallbacks
- [ ] Admin cannot ban themselves
- [ ] `bun run typecheck` and `bun run build` pass
