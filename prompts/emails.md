# Email Notifications — Resend Integration

## Goal
Set up transactional email notifications using Resend for important platform events. Create a reusable email service with custom HTML templates that match the application's design system. Emails are fire-and-forget (non-blocking) — failures are logged but don't block the API response.

## Events Requiring Emails

| # | Event | Recipient | Subject | Trigger |
|---|-------|-----------|---------|---------|
| 1 | Product Rejected | Seller | "Your product has been rejected" | `PATCH /api/admin/products/:id/status` with `status: "rejected"` |
| 2 | Product Approved | Seller | "Your product has been approved" | `PATCH /api/admin/products/:id/status` with `status: "active"` (from rejected state) |
| 3 | Order Status Changed | Buyer | "Your order status has been updated" | `PATCH /api/orders/:id/status` |
| 4 | Seller Approved | Seller | "Your seller account has been approved" | `PATCH /api/admin/sellers/:id/approve` |
| 5 | Seller Rejected/Revoked | Seller | "Your seller application has been rejected" | `PATCH /api/admin/sellers/:id/reject` |
| 6 | User Banned | User | "Your account has been suspended" | `PATCH /api/admin/users/:id/ban` (when banning) |

## Affected Files

### Backend

1. **Install Resend**: `bun add resend` in `backend/`

2. **`backend/src/lib/resend.ts`** (new) — Resend client initialization:
   ```ts
   import { Resend } from "resend";
   export const resend = new Resend(process.env.RESEND_API_KEY);
   ```

3. **`backend/src/lib/emails.tsx`** (new) — Email service with all send functions and HTML templates:
   - `sendProductRejectedEmail({ to, productName, reason })` 
   - `sendProductApprovedEmail({ to, productName })`
   - `sendOrderStatusEmail({ to, buyerName, orderId, status })`
   - `sendSellerApprovedEmail({ to, sellerName })`
   - `sendSellerRejectedEmail({ to, sellerName, reason })`
   - `sendUserBannedEmail({ to, userName })`
   
   Each function:
   - Uses `resend.emails.send()` with `from: "Resend <onboarding@resend.dev>"` (unchanged)
   - `to: [to]` (the recipient email)
   - Returns `{ data, error }` — logs error if any, does NOT throw
   - Uses idempotency key: `<event-type>/<entity-id>` (e.g. `product-rejected/product-123`)
   
   HTML template design:
   - Inline CSS (no external stylesheets — email clients don't support them)
   - Max width 600px, centered, clean typography
   - Header with app name "Ecommerce" in primary color (`#c0392b` — tomato from theme)
   - Body with clear message, details in a card-like section
   - Footer with "This is an automated notification" text
   - Uses system fonts: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
   - Responsive: works on mobile

4. **Integration points** — add `await sendXxxEmail(...)` calls (fire-and-forget, don't await in try/catch):
   - `backend/src/routes/admin.ts` → product reject/approve endpoint
   - `backend/src/routes/admin.ts` → seller approve/reject endpoint  
   - `backend/src/routes/admin.ts` → user ban endpoint
   - `backend/src/controllers/order.ts` → updateOrderStatus function

### No Frontend Changes
This is backend-only. No frontend files modified.

## Email Template Design

All emails share a consistent layout:

```
┌─────────────────────────────────────┐
│  [Logo area]                        │
│  ECOMMERCE                          │
├─────────────────────────────────────┤
│                                     │
│  Hi {name},                         │
│                                     │
│  {Message body}                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Details card               │    │
│  │  {Key-value details}        │    │
│  └─────────────────────────────┘    │
│                                     │
│  {CTA button if applicable}         │
│                                     │
├─────────────────────────────────────┤
│  This is an automated notification. │
│  © 2026 Ecommerce                  │
└─────────────────────────────────────┘
```

Color scheme:
- Header bg: `#c0392b` (tomato primary)
- Text: `#1a1a1a` (dark)
- Muted text: `#666666`
- Card bg: `#f9f9f9`
- Card border: `#e5e5e5`
- CTA button: `#c0392b` bg, white text
- Footer: `#999999`

## Edge Cases
- Resend API failure → log error, don't block API response
- Missing user email → skip sending (some users may not have email)
- Idempotency → use event-type/entity-id keys to prevent duplicates
- `onboarding@resend.dev` sandbox → only delivers to Resend account email (acceptable for dev)

## What "Done" Looks Like
- [ ] Resend installed in backend
- [ ] `backend/src/lib/resend.ts` — Resend client
- [ ] `backend/src/lib/emails.tsx` — 6 email functions with HTML templates
- [ ] Integration into admin.ts (product reject/approve, seller approve/reject, user ban)
- [ ] Integration into order.ts (order status change)
- [ ] `bun run typecheck` passes
