# Cart & Wishlist — Zustand + Shadcn Drawer

## Goal
Implement cart and wishlist state with Zustand (persisted) and present both in a shadcn `Drawer` that is bottom-sheet on mobile and right-side on desktop. Products are added from `ProductCard`; users can remove items and update cart quantity. Drawer styling is customized to the elegant, slick, modern theme (tomato primary, Playfair + Noto Sans) — not default shadcn.

## Affected Routes / Endpoints
- No backend changes for v1 (local-only cart/wishlist). Future: sync to API/Stripe.
- Frontend routes affected: `app/routes/home.tsx` (via `ProductCard` inside `NewArrivals`), any future shop page — all product surfaces use same `ProductCard`.

## Data Model Changes
- No Prisma changes. Client models in stores:
  - `CartItem: { product: Product, quantity: number }`
  - `WishlistItem: Product`

## Edge Cases
- Add duplicate product to cart → increments quantity (cap at `product.stock`, handle `stock === 0` → toast error, no add).
- Quantity decrement to 0 → remove item.
- Increment beyond stock → toast `Only X left` and clamp.
- Wishlist duplicate → toggle (remove if exists), toast feedback.
- Empty cart/wishlist → designed empty state (icon + message + CTA to shop), not bare "No data".
- Hydration mismatch → Zustand `persist` with `skipHydration` + `onRehydrateStorage`, render counts only after mount.
- Mobile vs desktop drawer: `swipeDirection` = `down` (mobile, `useIsMobile`) / `right` (desktop); height vs width sizing via `data-[swipe-axis]` variants.

## TanStack Query
- Not used for cart/wishlist (local Zustand). Product fetching stays in `useNewArrivals` / `usePublicProducts`.

## Reusable Components & Stores
- `app/stores/cart.ts` — Zustand `create` + `persist` (key `cart-storage`), state `{ items: CartItem[], addItem, removeItem, updateQuantity, clearCart, count, total }` — derived `count` = sum quantities, `total` = sum `discountedPrice * qty`.
- `app/stores/wishlist.ts` — Zustand `create` + `persist` (key `wishlist-storage`), state `{ items: Product[], toggle, remove, clear, isWishlisted }`.
- `app/components/cart/CartDrawer.tsx` — Drawer wrapper using `Drawer`/`DrawerContent`/`DrawerHeader`/`DrawerTitle`/`DrawerFooter`. Responsive `swipeDirection` via `useIsMobile()`, `w-full max-w-md` on desktop (`right`), `h-[85vh] max-h-[85vh]` on mobile (`down`) via `data-[swipe-axis]` classes. Scrollable `div.flex-1.overflow-y-auto`. Footer shows subtotal + checkout CTA.
- `app/components/wishlist/WishlistDrawer.tsx` — same pattern, heart-themed header, move-to-cart action.
- `app/components/product/ProductCard.tsx` — update existing: import both stores + `toast`, wire wishlist heart (filled when `isWishlisted`) and `Quick add` / cart button (show `In cart` state). Keep minimal, push logic into card.
- `app/components/globals/header.tsx` — replace static cart/wishlist buttons with drawer triggers showing live counts (`useCartStore`/`useWishlistStore`).

## Design System — elegant
- Tokens only from `app.css` (tomato `--primary`). No hardcoded hex.
- Typography: Playfair heading for drawer title / item name, Noto Sans for meta.
- Spacing: Tailwind 4px scale, `rounded-2xl` card/drawer (`rounded-none` override), `p-4` sections.
- Motion: 200ms ease-out, drawer `duration-450` cubic-bezier from base, toast in/out 150ms.
- Icons: `lucide-react` (Heart, ShoppingBag, Trash2, Plus/Minus, X).
- Drawer customization: overlay `bg-black/20 backdrop-blur-sm`, content `bg-card`, header border-b, footer border-t, swipe handle visible only on mobile.

## What "Done" Looks Like
- [ ] Prompt at `prompts/cart-wishlist.md` and approved
- [ ] Zustand stores persisted, no hydration warning
- [ ] `ProductCard` can add to cart (with quantity) and toggle wishlist, toasts, respects stock
- [ ] Header shows live counts, opens drawers
- [ ] `CartDrawer`: list with image/name/price/qty controls (+/-), remove, subtotal, checkout; empty state
- [ ] `WishlistDrawer`: list with image/name/price, remove, move to cart, empty state
- [ ] Drawer is bottom on `<768px` (`down`) and right on `>=768px` (`right`), via `useIsMobile`
- [ ] Customized shadcn Drawer (rounded, border, shadow, not default)
- [ ] `bun run typecheck` / `bun run build` passes
