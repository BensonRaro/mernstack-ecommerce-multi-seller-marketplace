# Uploadthing Setup

## Goal
Set up Uploadthing for file uploads (product images, user avatars) using the Express backend adapter.

## Environment Status
- `uploadthing` already installed in both `backend/package.json` and `frontend/package.json`
- `UPLOADTHING_TOKEN` already configured in `backend/.env`

## Implementation Steps

### 1. Backend - Create Upload Router
**File**: `backend/src/lib/uploadthing.ts`

Create a FileRouter with two routes:
- `productImageUploader`: Accepts images up to 8MB, max 5 files (for product listings)
- `avatarUploader`: Accepts images up to 2MB, max 1 file (for user profile pictures)

Both routes will include middleware to verify authentication via Better-Auth session.

### 2. Backend - Mount Route Handler
**File**: `backend/src/server.ts`

- Import `createRouteHandler` from `uploadthing/express`
- Mount at `/api/uploadthing`
- Add Uploadthing-related headers to CORS config

### 3. Frontend - Generate Upload Components
**File**: `frontend/app/lib/uploadthing.ts`

Generate `UploadButton` and `UploadDropzone` components pointing to `http://localhost:5000/api/uploadthing`.

### 4. Frontend - Create Reusable Upload Components
**Files**:
- `frontend/app/components/ui/product-image-upload.tsx` - Multi-image upload for products
- `frontend/app/components/ui/avatar-upload.tsx` - Single image upload for avatars

## Files to Create/Modify
| File | Action |
|------|--------|
| `backend/src/lib/uploadthing.ts` | Create |
| `backend/src/server.ts` | Modify (mount handler) |
| `frontend/app/lib/uploadthing.ts` | Create |
| `frontend/app/components/ui/product-image-upload.tsx` | Create |
| `frontend/app/components/ui/avatar-upload.tsx` | Create |

## Edge Cases
- Handle upload errors gracefully with toast notifications
- Validate file types client-side before upload
- Show upload progress indicators
- Handle authentication failures (redirect to login)

## Done When
- Backend serves uploadthing routes at `/api/uploadthing`
- Frontend can upload images via UploadButton/UploadDropzone
- Uploaded files are accessible via Uploadthing CDN URLs
- Typecheck passes with no errors
