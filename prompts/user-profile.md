# User Profile Page Implementation

## Goal
Build a user profile page that displays:
- User profile information
- Orders (including seller orders, reusing existing functionality where possible)
- Reviews

Additionally, implement:
- User address and phone number CRUD operations
- Update checkout page to use real address and phone number from user profile

## Affected Routes/Endpoints

### Frontend Routes
- `/profile` - User profile page with tabbed interface (Profile, Orders, Reviews)
- `/settings` - Settings page displaying user profile info (read-only for now)

### Backend API Endpoints (need to add)
- `GET /api/user/profile` - Get user profile with address and phone
- `PUT /api/user/profile` - Update user profile (address and phone)
- Existing endpoints to reuse:
  - `GET /api/orders/seller` - Seller orders (reuse useSellerOrders hook)
  - `GET /api/orders/my` - My orders (reuse useMyOrders or listMyOrders)
  - `GET /api/reviews` - Reviews (reuse useReviews hook or create new)

## Data Model Changes

### Backend (Prisma)
Add fields to User model or create a Profile model:
- `address` (String, nullable) - User's street address
- `phone` (String, nullable) - User's phone number

Or alternatively, add to existing user schema if not already present.

## Edge Cases
- Unauthenticated users should be redirected to login
- Seller orders should only show orders where the user is the seller
- Reviews should only show reviews for the current user's purchased products
- Address/phone validation (phone min length, address not empty)
- Error states for API failures
- Loading states for all data fetches

## What "Done" Looks Like
- Profile page at `/profile` with three tabs: Profile Information, Orders, Reviews
- Settings page at `/settings` displaying user info read-only
- Address and phone can be edited via modal/dialog
- Checkout page uses stored address/phone instead of manual entry
- All API calls use TanStack Query
- Shadcn UI components customized to match app design
- Empty states, loading states, and error states are handled
- Responsive design (mobile + desktop)

## Key Features to Implement
1. **Profile Tab**: Display name, email, image, address, phone number
2. **Orders Tab**: 
   - For buyers: list their purchased orders
   - For sellers: list their seller orders (reuse `useSellerOrders` hook)
3. **Reviews Tab**: Display user's reviews on products
4. **Settings**: Read-only display of profile info
5. **Address/Phone CRUD**: 
   - Form to update address and phone
   - Validation on submit
   - Success/error feedback
6. **Checkout Update**: 
   - Pre-fill address/phone from user profile
   - Use stored values as defaults