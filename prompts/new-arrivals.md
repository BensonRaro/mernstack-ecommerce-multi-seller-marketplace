# New Arrivals — Reusable Product Card + Home Section

## Goal
Add a `New Arrivals` section to the home page that displays the latest products added by sellers. Extract a reusable `ProductCard` component for use across shop/home. Use TanStack Query for data fetching, shadcn UI customized to the elegant tomato theme (reference: https://i.pinimg.com/736x/1e/67/e3/1e67e30664aea9284d9868dcb3aafdcf.jpg).

## Affected Routes / Endpoints

### Backend — `backend/src/controllers/product.ts`
- Reuse existing `GET /api/products` (already supports `page/limit/status/category/search/mine`, sorted `createdAt desc`).
- No schema change. For public listing filter `status=active` only; ensure `active` products are returned for home.

### Frontend — Routes
- `frontend/app/routes/home.tsx` — minimal route, compose sections: `Hero` → `Categories` → `NewArrivals` → (future footer). Keep route thin.

### Frontend — Components
- `frontend/app/components/product/ProductCard.tsx` — reusable card, props `{ product: Product, variant?: "default" | "compact" }`. Shows: image (aspect-[4/5] or square, fallback Package icon), category badge, name (2-line clamp), price with discount, color dots, stock hint, wishlist heart (UI only), hover lift + subtle ring. Uses only CSS variables from `app.css`, no hardcoded hex. Typography: Playfair for price/name, Noto Sans for meta. Rounded-2xl, ring-1 ring-foreground/5, shadow-sm on hover.

- `frontend/app/components/product/NewArrivals.tsx` — section wrapper. Header: `NEW ARRIVALS` label (primary, tracking-widest), heading Playfair, description muted, `View All` link (`ArrowRight`). Grid: `grid-cols-2 lg:grid-cols-4` gap 4-6. Data via `useNewArrivals` (TanStack Query). States: loading → 8 `Skeleton` cards (image + text), error → centered `Empty` with `AlertCircle` + Retry, empty → `Empty` with `Package` icon + "No new arrivals yet". Responsive, 150-250ms transitions.

### TanStack Query — `frontend/app/hooks/use-products.ts`
- Add `useNewArrivals(limit = 8)` or `usePublicProducts(params)` — `GET /api/products?status=active&page=1&limit=8`, key `["new-arrivals", limit]` (or `["products", {status: "active", limit}]`). Keep `useSellerProducts` for seller dashboard; share `ProductsResponse` type. Invalidate pattern not needed for public list.

## Data Model Changes
- None. Reuse `Product` interface (id, name, description, price, discount, category, images, stock, sizes, colors, gender, status, seller).

## Edge Cases
- No active products → empty state with CTA ("Browse categories").
- Missing image → dashed placeholder with `Package` icon, muted bg.
- Discount 0 → hide strike-through.
- Very long name → `line-clamp-2`.
- Stock 0 → "Out of stock" muted + disable hover add-to-cart.
- Network error → retry button refetches query.
- < 8 products → grid still renders available count, no pagination.

## Design System
- Tokens only from `app.css` (`--primary` tomato, `--muted`, `--card`). No hex.
- Typography: `font-heading` (Playfair) for section title/price, `font-sans` (Noto Sans) for meta. Max 5 sizes.
- Spacing: Tailwind 4px scale, `rounded-2xl` cards, `p-4` inside, `gap-6` grid.
- Motion: `transition-colors/transform duration-200 ease-out`, hover `scale-[1.02]` on image, `shadow-sm` on card.
- Icons: `lucide-react` (Heart, ShoppingBag, Package, ArrowRight, AlertCircle).
- Image loading: `loading="lazy"`, `object-cover`.
- Accessibility: alt from product name, focus ring via `ring-foreground/5`.

## What "Done" Looks Like
- [ ] Prompt at `prompts/new-arrivals.md`
- [ ] `ProductCard` at `components/product/ProductCard.tsx` reusable, minimal, elegant
- [ ] Hook `useNewArrivals` added, query hits `/api/products?status=active`
- [ ] `NewArrivals` section at `components/product/NewArrivals.tsx` with loading/error/empty
- [ ] `routes/home.tsx` renders `Hero`, `Categories`, `NewArrivals`
- [ ] `bun run typecheck` / `bun run build` passes
- [ ] Manual verify: home shows latest 8 active products, card responsive, no hardcoded colors
