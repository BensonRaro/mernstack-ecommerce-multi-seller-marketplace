# Products Listing — Pagination, Search, Export

## Goal
Build a production-grade seller products page with server-side pagination, debounced search, filters, and CSV/JSON export. Extract pagination and search into reusable globals for reuse across orders/users.

## Affected Routes / Endpoints

### Backend — `backend/src/controllers/product.ts` + `backend/src/routes/product.ts`
- Update `GET /api/products` to support pagination & search:
  - Query: `?page=1&limit=10&search=term&category=fashion&status=active&mine=true`
  - Response: `{ products: Product[], total, page, limit, totalPages }`
  - `search` matches `name`, `description`, `category` (contains, mode: insensitive)
  - `category` / `status` exact filter
  - `mine=true` filters to current seller's products (requires auth, resolves sellerId from session)
  - Default: page 1, limit 10, sorted by `createdAt desc`
- Keep existing `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` unchanged.

### Frontend — `frontend/app/routes/seller/products.tsx`
- Replace placeholder Empty with full listing:
  - Header: title + count badge, Export dropdown (CSV/JSON), Add Product button
  - Toolbar: reusable SearchInput + category/status filters
  - Table card: image, name, category, price (discount), stock, status pill, actions
  - Footer: reusable DataPagination + results summary
  - States: loading skeleton rows, empty (no products / no results), error with retry
  - Export: client-side CSV/JSON of current filtered dataset via `lib/export.ts`

## Data Model Changes
- None — uses existing `Product` model. No migration.

## Reusable Components
- `frontend/app/components/globals/search-input.tsx` — debounced input (300ms), shadcn Input + lucide Search + clear X, props: value, onChange, placeholder
- `frontend/app/components/globals/data-pagination.tsx` — props: `page, totalPages, total, limit, onPageChange`, renders shadcn Pagination customized + "Showing X–Y of Z" text, mobile-friendly, elegant tomato theme
- `frontend/app/lib/export.ts` — `exportToCsv(rows, filename)` and `exportToJson(rows, filename)` with proper escaping and blob download

## TanStack Query
- Update `frontend/app/hooks/use-products.ts`:
  - `useSellerProducts(params: { page, limit, search, category, status, mine? })`
  - Query key: `["seller-products", params]`
  - Builds query string conditionally, uses `api.get`
  - Keep `useCreateProduct` invalidation of `["seller-products"]`

## Edge Cases
- Empty DB → curated empty state with CTA to create product
- Search with no results → "No results for \"term\"" + clear button
- Page out of bounds → clamp to 1..totalPages, reset to 1 on search/filter change
- Very long product name → truncate in table
- Missing image → fallback placeholder
- Stock 0 → "Out of stock" badge
- Large export → limit to filtered results (not paginated single page) — fetch with limit=1000 or use current page? Export filtered full set via separate query with large limit.
- Unauthenticated access to mine=true → 401
- Seller not approved → 404 seller not found

## Design System
- Tokens from `app.css` only, no hardcoded hex
- Typography: Playfair for headings, Noto Sans for body, 4–5 size steps
- Spacing: Tailwind 4px scale, rounded-lg/xl on cards, subtle 200ms transitions
- Icons: lucide-react (Search, Download, Chevron, More, Package)
- Reference: dribbble table — clean card, muted uppercase headers, pill statuses, thumbnail + text in first col, toolbar above table, pagination bottom-right
- Responsive: toolbar stacks on mobile, table horizontal scroll, pagination wraps

## What "Done" Looks Like
- [ ] Prompt file created and approved
- [ ] Backend `listProducts` supports page/limit/search/category/status/mine with total count
- [ ] Hook `useSellerProducts` accepts params and caches per param set
- [ ] Reusable `SearchInput` (debounced) and `DataPagination` in `components/globals/`
- [ ] Export helpers produce valid CSV/JSON and trigger download
- [ ] `/seller/products` renders table with search, filters, pagination, export, loading/empty/error states
- [ ] Uses shadcn ui (Table, Input, Select, DropdownMenu, Badge, Button, Card, Skeleton, Empty) customized to elegant theme
- [ ] `bun run typecheck` passes frontend + backend
- [ ] Verified in browser: search filters live, pagination changes data, export downloads files
