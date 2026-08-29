# Product Model + Create Product Page

## Goal

Add a Prisma Product model, backend CRUD routes, and a frontend create-product form for sellers.

## 1. Prisma Schema — `backend/prisma/schema.prisma`

Add a `Product` model:

```prisma
model Product {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  description String?
  price       Float
  discount    Float    @default(0)
  category    String
  images      String[]
  sellerId    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  seller Seller @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  @@map("product")
}
```

Add `products Product[]` to the existing `Seller` model.

After editing, run `cd backend && bunx prisma generate` to regenerate the Prisma client.

## 2. Backend Routes — `backend/src/routes/product.ts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/` | Required (seller) | Create product (auto-attach sellerId from session) |
| `GET` | `/` | None | List all products (public, for future shop page) |
| `GET` | `/:id` | None | Get single product |
| `PUT` | `/:id` | Required (seller) | Update own product |
| `DELETE` | `/:id` | Required (seller) | Delete own product |

**Validation rules:**
- `name`: required, non-empty string
- `price`: required, positive number
- `discount`: optional, 0–100 range
- `category`: required, must be one of the defined categories
- `images`: optional array of strings

**Route mounting** in `backend/src/server.ts`:
```ts
import productRoutes from "./routes/product.js";
app.use("/api/products", productRoutes);
```

## 3. Frontend Hooks — `frontend/app/hooks/use-products.ts`

```ts
useCreateProduct()  — POST /api/products, invalidates ["seller-products"]
useSellerProducts() — GET /api/products?sellerId=me (or separate endpoint)
```

## 4. Create Product Page — `frontend/app/routes/seller/create-product.tsx`

Replace the placeholder with a real form. Use existing shadcn components:
- `Field`, `FieldGroup`, `FieldLabel`, `FieldError` from `@/components/ui/field`
- `Input` from `@/components/ui/input`
- `Textarea` from `@/components/ui/textarea`
- `NativeSelect` from `@/components/ui/native-select` for category dropdown
- `ProductImageUpload` from `@/components/ui/product-image-upload`
- `Button` from `@/components/ui/button`
- `toast` from `@/components/ui/toast`

**Form fields:**
1. Product Images — `ProductImageUpload` (max 5)
2. Product Name — `Input` (required)
3. Description — `Textarea` (optional, 4 rows)
4. Category — `NativeSelect` with the 6 categories from `constants/categories.ts`
5. Price — `Input` type="number" (required, min 0)
6. Discount % — `Input` type="number" (optional, 0–100)

**Submit flow:**
1. Validate fields
2. Call `useCreateProduct().mutate(data)`
3. On success: toast success, redirect to `/seller/products`
4. On error: toast error

**Layout:** Use a `Card` for the form container. Keep the file minimal — the form logic is simple enough to live in the route file.

## Conventions

- Backend local imports end with `.js` (Vercel deployment rule)
- Use `bun` as package manager
- No comments in code
- Use theme tokens, not hardcoded colors
- Group by feature: product components go in `components/product/` if needed

## Done When

- [ ] Prisma schema has Product model with all fields
- [ ] `prisma generate` succeeds
- [ ] Backend routes: POST, GET, GET/:id, PUT/:id, DELETE/:id
- [ ] Routes mounted in server.ts
- [ ] Frontend hook `useCreateProduct` works
- [ ] Create product form renders with all fields
- [ ] Form submits and creates product via API
- [ ] Success redirects to `/seller/products`
- [ ] `bunx tsc --noEmit` passes in both frontend and backend
