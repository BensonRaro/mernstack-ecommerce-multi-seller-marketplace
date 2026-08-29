# Product Edit & Delete — Alert Dialog + Reused Form

## Goal
Add production-grade delete confirmation via customized shadcn AlertDialog and enable editing products by reusing the create-product page with prefilled data via TanStack Query.

## Affected Routes / Endpoints

### Backend — `backend/src/controllers/product.ts` + `backend/src/routes/product.ts`
- No new endpoints. Reuse existing:
  - `GET /api/products/:id` — fetch single product (public)
  - `PUT /api/products/:id` — update own product (requireAuth + requireSeller, checks sellerId ownership, validates name/price/category/status as in create)
  - `DELETE /api/products/:id` — delete own product (requireAuth + requireSeller)
- Ensure `GET /:id` and `PUT /:id` return 404/403 appropriately. No schema change.

### Frontend — Routes
- `frontend/app/routes.ts`
  - Keep `seller/products/create` → `routes/seller/create-product.tsx`
  - Add `seller/products/:id/edit` → `routes/seller/create-product.tsx` (same file handles create + edit via param)

- `frontend/app/routes/seller/create-product.tsx`
  - Detect `id` param via `useParams()`. If present → edit mode.
  - In edit mode: `useProduct(id)` to fetch, show loading skeleton + error state, prefill all fields (name, description, price, discount, category, images, stock, sizes, colors, gender, status) via `useEffect` when data loads.
  - Submit: if edit mode → `useUpdateProduct().mutate({ id, data })`, else `useCreateProduct()`. Show pending states on both buttons, toast success/error, navigate to `/seller/products` on success.
  - Keep minimal route file: push form UI into `components/product/product-form.tsx` if needed for minimalism, but allow logic in route for simplicity. Customize title/buttons ("Edit Product" vs "Add New Product", "Update Product" vs "Add Product").
  - Handle not-found: show Empty with back CTA. Handle forbidden.

- `frontend/app/routes/seller/products.tsx`
  - Replace `confirm()` with custom `DeleteProductDialog` (`components/product/delete-product-dialog.tsx`) built on shadcn `AlertDialog` but customized: rounded-2xl card, soft muted icon circle, heading Playfair, description Noto Sans, two buttons (Cancel outline, Delete destructive), 200ms transitions.
  - State: `productToDelete: Product | null`, `isDialogOpen`. Dropdown Delete item sets productToDelete and opens dialog. Dialog confirms → `useDeleteProduct().mutate(id)` → toast, close, invalidate.
  - Edit action: `Link` to `/seller/products/${id}/edit` (no longer toast placeholder).

## TanStack Query — `frontend/app/hooks/use-products.ts`
- `useProduct(id: string)` — `GET /api/products/${id}`, key `["product", id]`, enabled when id truthy
- `useUpdateProduct()` — `PUT /api/products/${id}`, invalidates `["seller-products"]` and `["product", id]` on success
- Keep `useCreateProduct`, `useSellerProducts` (paginated), `useDeleteProduct` (already present but ensure invalidation)

## Reusable Components
- `frontend/app/components/product/delete-product-dialog.tsx` — props `{ open, onOpenChange, product, onConfirm, isPending }`. Uses `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction`. Customize: `AlertDialogContent` rounded-2xl, `AlertDialogMedia` with `Trash2` icon in destructive/10 circle, title "Delete product?", description includes product name truncated, footer buttons with proper variants. No hardcoded hex — use `text-destructive`, `bg-destructive/10`.

## Design System
- Theme tokens from `app.css` only. Primary tomato `oklch(0.646 0.222 16.439)`.
- Typography: Playfair for dialog title + page heading, Noto Sans for body. 4 size steps.
- Spacing: 4px scale, Card rounded-xl, Dialog rounded-2xl, subtle 150-250ms ease-out.
- Icons: lucide-react (Trash2, Pencil, AlertTriangle).
- Responsive + a11y: focus ring, keyboard close, ARIA.

## Edge Cases
- Delete: product already deleted → 404 toast, refetch list; concurrent deletes → disable confirm button while pending; cancel closes without side effect.
- Edit: invalid id format → 404; product not owned by seller → 403 error state; network error on fetch → error Empty + retry; unsaved changes → no guard (out of scope); empty images allowed; price validation same as create.
- Pagination/search preserved after delete/update (invalidate keeps current page).

## What "Done" Looks Like
- [ ] Prompt file at `prompts/product-edit-delete.md`
- [ ] Hook `useProduct` + `useUpdateProduct` added and used
- [ ] `/seller/products` delete uses custom AlertDialog (no `confirm()`), elegant styling, toast feedback
- [ ] `/seller/products/:id/edit` reuses create-product page with prefilled data, updates via PUT, shares validation/UI
- [ ] `routes.ts` maps both create and edit to same component
- [ ] `bun run typecheck` passes frontend + backend
- [ ] Manual verify: edit loads data, saves, deletes with dialog, pagination/search intact
