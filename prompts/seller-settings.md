# Seller Settings — Store Profile Only

## Goal
Build the seller settings page for store profile management (name, image, description + approval status) using elegant shadcn components. Keep page minimal, push logic to components, group by feature. Uses existing Seller model, Zustand not needed, TanStack Query for data fetching.

## Affected Routes / Endpoints

### Backend
- `backend/src/routes/seller.ts` — add `PATCH /api/seller/me` (requireAuth+seller check, validates name non-empty, image optional URL, description optional). Updates `Seller` where `userId`. Returns `{seller}`. Keep existing `POST /` (become seller) and `GET /me`.
- `backend/src/controllers` — inline in route file or new `seller` controller for patch logic. Ensure `.js` imports.
- No schema change — uses existing `Seller` fields: `name`, `image`, `description`, `approved`, `userId`.
- Reuse `requireAuth` middleware.

### Frontend
- `frontend/app/routes/seller/settings.tsx` — minimal route: renders `<SellerSettingsView />`, handles `clientLoader` already checks seller role. Shows loading Skeleton, error Empty, and main view.

- `frontend/app/components/seller/seller-settings-form.tsx` — form component:
  - Header card with store avatar (AvatarUpload or ProductImage style) + name + approval badge (Active `emerald` / Pending `amber` with dot)
  - Fields: Store Name (`Input`), Description (`Textarea` 4 rows), Store Image (`AvatarUpload` with fallback initial, uploadthing `avatarUploader`)
  - Validation: name required, description optional max 500 chars
  - Actions: Save button (primary, rounded-full) with `Spinner` + disabled states, Reset/Cancel
  - Uses `useSellerMe()` for prefill, `useUpdateSeller()` mutation (PUT/PATCH `/api/seller/me`)

- `frontend/app/hooks/use-auth.ts` — add `useUpdateSeller()` (`PATCH /api/seller/me`, invalidates `["seller-me"]`) alongside existing `useSellerMe`.

### TanStack Query
- `useSellerMe` already `GET /api/seller/me` (stale 5m). `useUpdateSeller` invalidates it and shows toast.

## Data Model Changes
- None. Reuse `Seller`.

## Edge Cases
- Seller not found → Empty error + back to dashboard
- Not approved → badge shows `Pending approval` amber, still allows editing (or read-only? allow edit)
- Name empty → Field error "Store name is required", block submit
- Image upload failure → toast error, keep old image
- Network error on save → toast error + field stays
- Concurrent save → disable Save while `isPending`
- Image remove → sets `image` to `null` via `useDeleteFile` (already in avatar-upload)

## Design System
- Tokens from `app.css` only (tomato primary), Playfair for header, Noto for body, 4-5 sizes, 4px spacing, `rounded-2xl` Cards, `ring-1 ring-foreground/5`, `200ms` transitions, `lucide-react` icons (`Store`, `CheckCircle`, `Clock`, `Save`), dialog not needed. Responsive: single column mobile, 2-col stats on desktop? Keep simple: centered max-w-2xl, Card sections.

## What "Done" Looks Like
- [ ] Prompt at `prompts/seller-settings.md`
- [ ] Backend `PATCH /api/seller/me` with validation
- [ ] Hook `useUpdateSeller` + `useSellerMe` prefill
- [ ] `SellerSettings` page minimal + `SellerSettingsForm` component elegant, approval badge, image upload, validation, toasts
- [ ] `bun run typecheck` / `bun run build` passes
- [ ] Manual verify: edit name/desc/image, save, badge updates, refresh persists
