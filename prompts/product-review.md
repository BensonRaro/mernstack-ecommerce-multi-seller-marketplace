# Product Review + Comment Thread

## Goal
Implement purchase-verified reviews (one per user per product, rating 1-5 + comment) plus threaded comments without rating. Reviews displayed on product details page replacing placeholder. Edit/delete own reviews. Comments form thread under each review. Elegant, custom shadcn UI.

## Affected Routes / Endpoints

### Backend
- `prisma/schema.prisma` — add:
  ```
  model Review {
    id        String   @id @default(auto()) @map("_id") @db.ObjectId
    productId String   @db.ObjectId
    userId    String
    rating    Int
    comment   String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
    comments  ReviewComment[]
    @@unique([productId, userId])
    @@map("review")
  }
  model ReviewComment {
    id        String   @id @default(auto()) @map("_id") @db.ObjectId
    reviewId  String   @db.ObjectId
    userId    String
    comment   String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    review    Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)
    @@map("reviewComment")
  }
  ```
  Add `reviews Review[]`, `reviewComments ReviewComment[]` to `User`; `reviews Review[]` to `Product`. Generate client.

- `backend/src/controllers/review.ts` — 
  - `GET /api/reviews/product/:productId` — list reviews with user (id,name,image), avg rating, count, include comments with user. Sort newest first. Public.
  - `GET /api/reviews/can-review/:productId` — requireAuth, check purchased (Order with userId and items productId, paymentStatus != failed, status != cancelled) and not already reviewed, return {canReview, hasReviewed, hasPurchased}.
  - `POST /api/reviews` — requireAuth, body {productId, rating 1-5, comment min 10}, check purchased, check not already reviewed (409), create.
  - `PUT /api/reviews/:id` — requireAuth, owner only, allow rating/comment update, validate.
  - `DELETE /api/reviews/:id` — owner only, cascade deletes comments.
  - `POST /api/reviews/:reviewId/comments` — requireAuth (any authenticated can comment), body {comment min 2}, create ReviewComment.
  - `DELETE /api/reviews/comments/:commentId` — owner only.
  - `GET /api/reviews/:reviewId/comments` — list comments for review.

- `backend/src/routes/review.ts` — mount at `/api/reviews` in `server.ts`. Public GET, auth for mutations.

### Frontend
- `frontend/app/hooks/use-reviews.ts` — TanStack Query:
  - `useReviews(productId)` GET product reviews
  - `useCanReview(productId)` GET can-review
  - `useCreateReview()` POST, invalidate reviews
  - `useUpdateReview()` PUT
  - `useDeleteReview()` DELETE
  - `useCreateComment(reviewId)` POST comment
  - `useDeleteComment()` DELETE comment

- `frontend/app/components/product/ReviewsSection.tsx` — replaces `ReviewsPlaceholder`:
  - Card with Tabs Details/Reviews(count). Reviews tab header: avg rating stars, count, distribution bars.
  - States: loading Skeleton, error Empty+Retry, empty placeholder (Star icons, "No reviews yet").
  - List: avatar, name, date, StarRating (1-5), comment, edit/delete dropdown if own (Pencil/Trash), edit form (StarSelector + Textarea + Save/Cancel).
  - Thread: under each review, list comments (avatar, name, date, comment, delete if own), inline input `Add a comment...` + Send (Send icon), collapsed with "Show N comments" toggle if >2.
  - Composer: if !auth → login prompt, else if !purchased → "Only purchasers can review" muted, else if hasReviewed → show edit CTA not create, else StarSelector + Textarea + Submit.

- `frontend/app/components/product/StarRating.tsx` / `StarSelector.tsx` — reusable 5-star display/input, hover, filled `text-primary`.

- `frontend/app/routes/product-details.tsx` — replace `ReviewsPlaceholder` with `ReviewsSection productId={product.id}`.

## Data Model Changes
- Add Review + ReviewComment as above, generate.

## Edge Cases
- Unauthenticated → hide forms, show login link
- Not purchased → disable review form, still allow comments? Spec: comments without rating allowed after review, but for thread, allow any authenticated to comment (no purchase check)
- Duplicate review → 409, show edit instead
- Invalid rating (not 1-5) / comment <10 → 400 Field error
- Edit/delete forbidden → 403
- Review deleted → comments cascade
- Product not found → 404
- XSS → sanitize via text rendering, no HTML

## Design System
- Tokens from `app.css` only, tomato primary, Playfair heading, Noto body, rounded-2xl cards, ring-1, 200ms, lucide-react (Star, Heart, Send, Pencil, Trash2, Package). Elegant, muted empty states.

## What "Done" Looks Like
- [ ] Prompt at `prompts/product-review.md`
- [ ] Prisma Review + ReviewComment + generate
- [ ] Backend review/comment CRUD + purchase check + can-review
- [ ] Hooks `use-reviews` with TanStack
- [ ] Product details shows ReviewsSection with thread, edit/delete own, purchase-gated
- [ ] `bun run typecheck`/`build` passes
