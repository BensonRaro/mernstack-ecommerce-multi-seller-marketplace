# Inngest Integration — Background Task Infrastructure

## Goal
Integrate Inngest into the Express backend to provide durable, observable background task execution. The initial use case is offloading all email notifications (currently fire-and-forget `sendXxxEmail()` calls) into Inngest functions with automatic retries, failure logging, and Dev Server observability. This sets the foundation for future workflows (drip campaigns, order follow-ups, analytics aggregation, etc.).

## Current State
- 6 email functions in `backend/src/lib/emails.ts` — already fire-and-forget (not awaited in routes)
- No background job infrastructure exists
- Emails are sent directly from route handlers with no retry mechanism

## Affected Files

### Backend — New Files

1. **`backend/src/inngest/client.ts`** — Inngest client:
   ```ts
   import { Inngest } from "inngest";
   export const inngest = new Inngest({ id: "ecommerce" });
   ```

2. **`backend/src/inngest/functions.ts`** — Inngest functions (6 email functions):
   - `sendProductRejectedEmail` — triggered by `app/product.rejected`
   - `sendProductApprovedEmail` — triggered by `app/product.approved`
   - `sendOrderStatusEmail` — triggered by `app/order.status.changed`
   - `sendSellerApprovedEmail` — triggered by `app/seller.approved`
   - `sendSellerRejectedEmail` — triggered by `app/seller.rejected`
   - `sendUserBannedEmail` — triggered by `app/user.banned`

3. **`backend/src/inngest/index.ts`** — Barrel export (client + functions):
   ```ts
   export { inngest } from "./client.js";
   export { functions } from "./functions.js";
   ```

### Backend — Modified Files

4. **`backend/src/server.ts`** — Mount Inngest HTTP endpoint:
   - Import `serve` from `inngest/express`
   - Import `inngest` and `functions` from `./inngest/index.js`
   - Add `app.use("/api/inngest", serve({ client: inngest, functions }))` BEFORE other routes

5. **`backend/src/routes/admin.ts`** — Replace direct email calls with `inngest.send()`:
   - Remove email imports (`sendSellerApprovedEmail`, `sendSellerRejectedEmail`, `sendUserBannedEmail`, `sendProductRejectedEmail`, `sendProductApprovedEmail`)
   - Import `inngest` from `../inngest/index.js`
   - Replace each `sendXxxEmail({...})` call with `inngest.send({ name: "app/xxx", data: {...} })`

6. **`backend/src/controllers/order.ts`** — Replace direct email call with `inngest.send()`:
   - Remove `sendOrderStatusEmail` import
   - Import `inngest` from `../inngest/index.js`
   - Replace `sendOrderStatusEmail({...})` with `inngest.send({ name: "app/order.status.changed", data: {...} })`

### Backend — Dependencies

7. **Install**: `bun add inngest` in `backend/`

### Environment Variables

8. **`backend/.env`** — Add:
   ```
   INNGEST_DEV=1
   ```

### No Frontend Changes

## Inngest Function Pattern

Each function follows this pattern:
```ts
const functionName = inngest.createFunction(
  { id: "function-id", retries: 3 },
  { event: "app/event.name" },
  async ({ event, step }) => {
    await step.run("send-email", async () => {
      // call the existing email send function from lib/emails.ts
    });
  }
);
```

- `retries: 3` — retry failed email sends up to 3 times
- Each step is wrapped in `step.run()` for durability
- The actual email logic stays in `lib/emails.ts` (no duplication)

## Event Payloads

| Event | Data Shape |
|-------|-----------|
| `app/product.rejected` | `{ to, productName, reason }` |
| `app/product.approved` | `{ to, productName }` |
| `app/order.status.changed` | `{ to, buyerName, orderId, status }` |
| `app/seller.approved` | `{ to, sellerName }` |
| `app/seller.rejected` | `{ to, sellerName, reason? }` |
| `app/user.banned` | `{ to, userName }` |

## Integration Points

| File | Current Code | Replacement |
|------|-------------|-------------|
| `routes/admin.ts:106` | `sendSellerApprovedEmail({...})` | `inngest.send({ name: "app/seller.approved", data: {...} })` |
| `routes/admin.ts:158` | `sendSellerRejectedEmail({...})` | `inngest.send({ name: "app/seller.rejected", data: {...} })` |
| `routes/admin.ts:301` | `sendUserBannedEmail({...})` | `inngest.send({ name: "app/user.banned", data: {...} })` |
| `routes/admin.ts:500` | `sendProductRejectedEmail({...})` | `inngest.send({ name: "app/product.rejected", data: {...} })` |
| `routes/admin.ts:514` | `sendProductApprovedEmail({...})` | `inngest.send({ name: "app/product.approved", data: {...} })` |
| `controllers/order.ts:348` | `sendOrderStatusEmail({...})` | `inngest.send({ name: "app/order.status.changed", data: {...} })` |

## Dev Server

After implementation, run:
```bash
# Terminal 1 — backend
cd backend && INNGEST_DEV=1 bun run dev

# Terminal 2 — Inngest dev server
npx inngest-cli@latest dev -u http://localhost:5000/api/inngest
```

Dev Server UI at `http://localhost:8288` — verify functions appear in Functions tab.

## Edge Cases
- If Inngest dev server is not running, `inngest.send()` still works (events are queued locally)
- Email failures are retried up to 3 times by Inngest before marking as failed
- All existing email logic in `lib/emails.ts` is reused — no duplication
- If `INNGEST_DEV=1` is not set, functions will attempt to connect to Inngest Cloud (will fail without API key — acceptable for dev)

## What "Done" Looks Like
- [ ] `inngest` installed in backend
- [ ] `backend/src/inngest/client.ts` — Inngest client
- [ ] `backend/src/inngest/functions.ts` — 6 email functions
- [ ] `backend/src/inngest/index.ts` — barrel export
- [ ] `backend/src/server.ts` — Inngest endpoint mounted at `/api/inngest`
- [ ] `backend/src/routes/admin.ts` — all 5 email calls replaced with `inngest.send()`
- [ ] `backend/src/controllers/order.ts` — order status email call replaced with `inngest.send()`
- [ ] `INNGEST_DEV=1` added to `.env`
- [ ] `bun run typecheck` passes
- [ ] Dev Server shows all 6 functions in Functions tab
