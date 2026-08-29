# Seller Profile Creation

## Goal
Allow logged-in users to become sellers by creating a seller profile (name, image, description) via a customized dialog. Sellers require admin approval before they can sell products.

## Data Model

### Prisma Schema - Seller Model
```prisma
model Seller {
  id          String   @id @map("_id")
  userId      String   @unique
  name        String
  image       String?
  description String?
  approved    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("seller")
}
```

Also add `seller Seller?` relation to the User model.

## API Endpoints

### POST /api/seller
- **Auth**: Required (buyer only - sellers shouldn't create again)
- **Body**: `{ name: string, image?: string, description?: string }`
- **Logic**: 
  - Check user is logged in and role is "buyer"
  - Check user doesn't already have a seller profile
  - Create seller profile
  - Update user role to "seller" via Better-Auth admin plugin
- **Response**: `{ seller: Seller }`

### GET /api/seller/me
- **Auth**: Required
- **Logic**: Get current user's seller profile (if exists)
- **Response**: `{ seller: Seller | null }`

## UI Components

### Button Location
**In the user dropdown menu** (header.tsx) - Add "Become a Seller" option between Profile and Sign out. Only show if:
- User is logged in
- User role is "buyer" (not already a seller/admin)

### BecomeSellerDialog Component
**File**: `frontend/app/components/globals/become-seller-dialog.tsx`

Customized dialog with:
- **Trigger**: Button in user dropdown
- **Header**: "Become a Seller" title + description
- **Form fields**:
  - Store name (required, text input)
  - Store image (optional, uploadthing avatarUploader)
  - Description (optional, textarea)
- **Footer**: Cancel + Submit buttons
- **States**: Loading, success (close dialog), error (toast)

### Design Details
- Use existing `AvatarUpload` component for image
- Show toast on success/error
- Reset form on close
- Disable submit while loading

## Files to Create/Modify
| File | Action |
|------|--------|
| `backend/prisma/schema.prisma` | Modify (add Seller model + User relation) |
| `backend/src/routes/seller.ts` | Create (Express router) |
| `backend/src/server.ts` | Modify (mount seller routes) |
| `frontend/app/components/globals/become-seller-dialog.tsx` | Create |
| `frontend/app/components/globals/header.tsx` | Modify (add "Become a Seller" button) |

## Edge Cases
- User already has seller profile → hide "Become a Seller" button
- User is admin → hide "Become a Seller" button
- Upload fails → show error toast, keep dialog open
- Network error → show error toast
- Form validation → disable submit until name is filled

## Done When
- Logged-in buyers see "Become a Seller" in user dropdown
- Clicking opens customized dialog with form
- Submitting creates seller profile and changes role to "seller"
- Success shows toast and closes dialog
- Typecheck passes with no errors
