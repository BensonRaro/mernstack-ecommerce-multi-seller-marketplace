# Admin Products — List, Filter, Search, Pagination, Approve/Reject

## Goal
Build the admin products management page at `/admin/products`. Admins can view all products across the platform, filter by category and status, search by name/description, paginate results, and approve (activate) or reject (archive) products. Follows the exact patterns established in the admin sellers/users pages. Tanstack Query for data fetching, shadcn UI components styled to match the existing design system.

## Affected Routes / Endpoints

### Backend

- **`backend/src/controllers/product.ts`** — add:
  - `listAdminProducts(req, res)` — requireAuth + requireAdmin, lists ALL products (ignoring seller approval filter). Same search/category/status filters as `listProducts`. Include seller info (name, username, image, approved). Enrich with avgRating, totalReviews, unitsSold. Return `{products, total, page, limit, totalPages}`.

- **`backend/src/routes/admin.ts`** — add two new endpoints:

  1. **`GET /api/admin/products`** — List all products with pagination, search, category, and status filter.
     - Auth: `requireAuth` + `requireAdmin`
     - Query params: `page` (default 1), `limit` (default 10, max 50), `search` (string), `category` (string from VALID_CATEGORIES), `status` (string: "draft" | "active" | "archived" or empty for all)
     - Search matches: `name` contains, `description` contains (case-insensitive)
     - Include: `seller: { select: { id, name, username, approved } }`
     - Enrich with avgRating, totalReviews (from Review aggregation)
     - Sort: `createdAt desc`
     - Return `{ products, total, page, limit, totalPages }`

  2. **`PATCH /api/admin/products/:id/status`** — Update product status (approve/reject).
     - Auth: `requireAuth` + `requireAdmin`
     - Body: `{ status: "active" | "archived" }`
     - Validate status is one of the allowed values
     - Validate product exists
     - Update `prisma.product.update({ where: { id }, data: { status } })`
     - Return `{ product }` with updated status
     - Note: "approve" = set to "active", "reject" = set to "archived"

### Frontend

- **`frontend/app/hooks/use-admin-products.ts`** (new) — Tanstack Query hooks:
  - `useAdminProducts(params: { page, limit, search, category, status })` — `queryKey: ["admin-products", params]`, `queryFn: api.get<AdminProductsResponse>("/api/admin/products?...")`, `placeholderData: keepPreviousData`
  - `useUpdateProductStatus()` — mutation `PATCH /api/admin/products/:id/status` with `{ status }` body, invalidates `["admin-products"]`
  - Export interfaces: `AdminProduct`, `AdminProductsResponse`, `AdminProductsParams`
  - `AdminProduct` shape: same as existing `Product` type + `seller: { id, name, username, approved }` + `avgRating`, `totalReviews`

- **`frontend/app/routes/admin/products.tsx`** — replace placeholder with full page:
  - **Header**: "Products" title with `Package` icon, product count on the right
  - **Card table container**: `gap-0 overflow-hidden p-0 shadow-sm` (same as sellers/users)
  - **Toolbar**: `SearchInput` (search by name/description) + `Select` for category filter (All + 6 categories from constants) + `Select` for status filter (All / Active / Draft / Archived)
  - **Table columns**: Product (thumbnail + name), Category (badge), Price (formatted), Stock, Status (badge), Seller, Actions (Approve/Reject button)
  - **Product thumbnail**: first image from `images[]` array, fallback to a placeholder icon
  - **Status badges**: active = emerald, draft = amber, archived = destructive
  - **Approve/Reject**: 
    - If status is "active" → show "Reject" button (destructive outline)
    - If status is "archived" → show "Approve" button (emerald)
    - If status is "draft" → show both "Approve" and "Reject" buttons
    - Click opens confirmation dialog (same overlay pattern)
  - **States**: Loading skeleton, error with retry, empty state
  - **Footer**: `DataPagination` reusable component

## Edge Cases
- Product with no images → show Package icon placeholder
- Search with no results → "No products found" + clear search CTA
- Category filter + status filter + search combined → reset page to 1 on any filter change
- Page out of bounds → clamp, reset to 1 on filter/search change
- Network error → retry button
- Pagination limit capped at 50
- Approving a product sets status to "active" (visible on storefront)
- Rejecting a product sets status to "archived" (hidden from storefront)

## Design System
- Tokens from `app.css` only — no hardcoded hex. Tomato primary, Playfair heading, Noto body.
- Rounded-2xl Card, `ring-1 ring-foreground/5`, 200ms transitions.
- lucide-react icons: `Package`, `Search`, `AlertCircle`, `CheckCircle2`, `XCircle`, `Store`, `Tag`, `DollarSign`.
- Status badges: `inline-flex items-center gap-1.5 rounded-full` with `bg-{color}/10 text-{color}` and `ring-1 ring-{color}/20` (11px, uppercase, tracking-widest).
- Responsive: toolbar stacks on mobile, table horizontal scroll, pagination wraps.
- Reuse `SearchInput`, `DataPagination`, `Avatar` components.
- Confirmation dialog: manual overlay `div` with backdrop blur (same as sellers/users page).
- Product thumbnail: 40x40 rounded-lg, object-cover, with fallback icon.

## Files to Create/Modify
1. `backend/src/controllers/product.ts` — add `listAdminProducts` function
2. `backend/src/routes/admin.ts` — add `GET /products` and `PATCH /products/:id/status`
3. `frontend/app/hooks/use-admin-products.ts` — new hook file
4. `frontend/app/routes/admin/products.tsx` — replace placeholder

## What "Done" Looks Like
- [ ] Prompt at `prompts/admin-products.md`
- [ ] Backend: `GET /api/admin/products` with pagination, search, category, status filter
- [ ] Backend: `PATCH /api/admin/products/:id/status` for approve/reject
- [ ] Frontend: `useAdminProducts` hook with `keepPreviousData` + `useUpdateProductStatus` mutation
- [ ] `/admin/products` page: SearchInput, category Select, status Select, Table with thumbnails, DataPagination, loading/error/empty states, approve/reject with confirmation dialog
- [ ] Status badges color-coded, product thumbnails with fallbacks
- [ ] `bun run typecheck` and `bun run build` pass
