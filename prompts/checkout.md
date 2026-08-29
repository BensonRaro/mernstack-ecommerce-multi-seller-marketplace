# Checkout — Delivery, Address/Phone, Promo, Stripe (Better-Auth Webhook)

## Goal
Build an elegant checkout page matching https://cdn.dribbble.com/userupload/46733962/file/817662a4a4cc40dc563db7d5d1b45198.png, integrating cart (Zustand), delivery status (pickup/delivery), selectable saved addresses/phones, promo code (UI + discount calc, model stubbed for later), and payment method (cash on delivery vs Stripe). Stripe flow redirects to Checkout Session and returns to order confirmation; better-auth stripe webhook updates paymentStatus (pending/paid/failed).

## Affected Routes / Endpoints

### Backend
- `backend/prisma/schema.prisma` — add `Address` (id, userId, label, street, city, zip, country, isDefault), `Phone` (id, userId, number, label), `Promo` stub (code, discountPercent, active — for future, not required for validation now), `Order` (id, userId, status, deliveryStatus: pickup|delivery, addressId?, phoneId?, addressSnapshot, phoneNumber, paymentMethod: cod|stripe, paymentStatus: pending|paid|failed, stripeSessionId?, subtotal, discount, deliveryFee, total, createdAt), `OrderItem` (orderId, productId, quantity, price, sellerId). Run `prisma generate`.
- `backend/src/lib/auth.ts` — add `stripe` plugin from `@better-auth/stripe` with `stripeClient` (`new Stripe(process.env.STRIPE_SECRET_KEY!, apiVersion: 2026-06-24.dahlia)`), `stripeWebhookSecret`, `createCustomerOnSignUp: true`, `onEvent` hook to update Order paymentStatus on `checkout.session.completed` / `payment_intent.payment_failed` (lookup order by stripeSessionId or metadata orderId). Keep existing `admin` plugin.
- `backend/src/lib/stripe.ts` (new) — exported `stripe` instance.
- `backend/src/controllers/order.ts` — `createOrder` (COD, validates cart, creates order+items, stock check, total calc with promo mock SAVE10=10%), `createStripeCheckout` (creates Stripe Checkout Session line_items from cart, metadata {orderId, userId}, returns {url, sessionId, order}), `getOrder` / `orderConfirmation`.
- `backend/src/routes/order.ts` — `POST /api/orders` (requireAuth), `POST /api/orders/stripe/checkout` (requireAuth), `GET /api/orders/:id` (requireAuth owner), mounted at `/api/orders` in `server.ts`. Webhook remains at `/api/auth/stripe/webhook` via better-auth `toNodeHandler`.

### Frontend
- `frontend/app/routes/checkout.tsx` — route at `/checkout`, requires cart non-empty (redirect if empty). Layout 2-col: left form (delivery toggle, address cards, phone cards, promo, payment cards), right sticky summary.
- `frontend/app/components/checkout/AddressSelector.tsx` — card list, radio `pickup` hides it, `delivery` shows; each address card rounded-2xl, ring-primary when selected, edit icon; plus "Add new" dashed card. Prepared for multiple addresses.
- `frontend/app/components/checkout/PhoneSelector.tsx` — similar, pill cards.
- `frontend/app/components/checkout/PromoField.tsx` — input + Apply, validates `SAVE10` mock 10% or `WELCOME20` 20% (or future API), shows discount.
- `frontend/app/components/checkout/PaymentMethod.tsx` — `ToggleGroup` / radio cards for `cod` vs `stripe` with icons, descriptions.
- `frontend/app/components/checkout/OrderSummary.tsx` — line items from `useCartStore`, subtotal, delivery fee (0 pickup / 5 delivery), discount, total, Place Order button. Uses shadcn `Card`, `Separator`, `Button`.
- `frontend/app/stores/address.ts` + `phone.ts` (or combined `checkout.ts`) — Zustand persist for saved addresses/phones (mock seed 2 each), to demonstrate selection.
- `frontend/app/routes/order-confirmation.tsx` — `/order-confirmation/:id` shows success, pending, or failed via query param, clears cart on success.

## Data Model Changes
- Prisma: add Address, Phone, Order, OrderItem, Promo stub. No breaking changes. Ensure `product` stock decrement on order creation (optional).

## Edge Cases
- Empty cart → redirect to `/shop` with toast.
- Delivery selected but no address → block submit, show Field error.
- Phone required for delivery, optional for pickup (still collect).
- Promo invalid/expired → error toast, no discount.
- Stripe cancel → back to checkout with query `?canceled=1`.
- Webhook race: successUrl param modified by plugin intermediate redirect — store orderId in Stripe session metadata.
- Auth required for checkout; unauthenticated → redirect login, preserve cart via persist.
- Stock insufficient → 400 with details.
- Multiple addresses: default selected, radio updates.

## Design System
- Theme tokens only from `app.css` (tomato primary, muted, card). Playfair for headings/price, Noto Sans for body, 4-5 sizes, 4px spacing, rounded-2xl cards, subtle 200ms transitions, lucide-react icons.
- Reference image: address/phone cards with rounded checkboxes, promo input with inside button, payment cards with radio dot + icon, summary sticky.

## TanStack Query / Zustand
- Cart via Zustand (persist) not Query. Checkout uses `useMutation` for `POST /api/orders` and `POST /api/orders/stripe/checkout` (api.ts). Promo validation local (or `useMutation` stub).

## What "Done" Looks Like
- [ ] Prompt at `prompts/checkout.md`
- [ ] Prisma Order/Address/Phone/Promo models + generate
- [ ] `auth.ts` stripe plugin + `stripe.ts` + webhook updates paymentStatus
- [ ] Order routes + controllers (COD + Stripe session)
- [ ] Checkout UI: delivery toggle, address/phone selectors (multiple ready), promo field, payment method, summary, image-faithful
- [ ] Stripe redirect + confirmation page
- [ ] `bun run typecheck`/`build` passes, manual flow: add to cart → checkout → pickup/delivery → promo → COD creates order / Stripe redirects
