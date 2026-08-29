# Product Details Page

## Goal
Build a public product details page (`/product/:id`) faithful to https://cdn.dribbble.com/userupload/48002505/file/9c1c547ccb2f2381e3b874d8da368227.png and https://cdn.dribbble.com/userupload/48671419/file/69942c6296b7d4c72d312e0844ca53d6.png — elegant, editorial, image-led. Reuse existing `Product` model and TanStack Query; integrate cart/wishlist (Zustand) and prepare review section placeholder without building it.

## Affected Routes / Endpoints
- `frontend/app/routes.ts` — add `route("product/:id", "routes/product-details.tsx")` under public layout.
- `frontend/app/routes/product-details.tsx` — minimal page (loader via `useProduct`); pushes UI to `components/product/*`.
- `frontend/app/components/product/ProductGallery.tsx` — left gallery: main image `aspect-[4/5]` with `object-cover`, vertical thumb rail on desktop / horizontal on mobile, lightbox-style `ring-1 ring-foreground/5`, `rounded-2xl`, thumbnail active `ring-primary`.
- `frontend/app/components/product/ProductInfo.tsx` — right info: breadcrumb, category badge, title (Playfair), seller row (avatar/name), price (discounted + strike), rating placeholder `★★★★★ (0 reviews)` muted, stock dot, description, sizes `rounded-lg border` selectable, colors `rounded-full ring`, gender pill, quantity stepper, primary `Add to cart` + `Wishlist` Heart, delivery/returns accordion.
- Reviews placeholder: `components/product/ReviewsPlaceholder.tsx` — `Card` with `Tabs` (Details / Reviews) where Reviews tab shows "Reviews coming soon — leave the first review" + `Star` icons, reserved `id="reviews"` anchor for future.

## Data Model Changes
- None. Uses `Product` (`name, description, price, discount, category, images, stock, sizes, colors, gender, status, seller`). Backend `GET /api/products/:id` already returns `seller {id,name,image}`.

## Edge Cases
- Invalid id → `Empty` with `Package` icon + `Product not found` + back to shop.
- Loading → `Skeleton` gallery + info (image `aspect-[4/5]`, lines).
- No images → dashed placeholder with `Package`.
- Out of stock → `Out of stock` badge, disable quantity/add to cart, show `Notify me` disabled.
- Discount 0 → hide badge/strike.
- Sizes/colors empty → hide section.
- Long name/description → `line-clamp` + `prose` with `text-sm leading-relaxed`.
- Share of many thumbnails → `ScrollArea` horizontal/vertical.
- Direct deep-link → no clientLoader, fetch via `useProduct`.

## Design System
- Tokens only from `app.css` (tomato `primary`), no hex. Typography: Playfair `font-heading` for title/price, Noto for body, 4–5 sizes. Spacing 4px scale, `rounded-2xl` cards/images, `shadow-sm` on gallery, `150-250ms` transitions, `lucide-react` icons (`Heart, ShoppingBag, Share2, Truck, ShieldCheck, Star`). Responsive: `lg:grid-cols-[1.15fr_0.85fr]` gallery left, stacks on mobile. Gallery and info use `ring-1 ring-foreground/5`.

## TanStack Query & State
- `useProduct(id)` (`GET /api/products/:id`, key `["product", id]`). Cart `useCartStore.addItem` with stock cap, wishlist `toggle`. Quantity local state 1..stock.

## What "Done" Looks Like
- [ ] Prompt at `prompts/product-details.md`
- [ ] Route `product/:id` renders gallery left + info right, faithful to dribbble (category pill, price with discount, sizes/colors selectable, quantity stepper, add to cart/wishlist, seller, stock, accordion)
- [ ] Placeholder Reviews section anchored, not fully built
- [ ] Loading/error/empty states, responsive, accessible
- [ ] `ProductCard` links point to `/product/:id`
- [ ] `bun run typecheck` / `build` passes

