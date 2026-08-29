# Seller Dashboard Layout

## Goal

Create a seller dashboard layout using React Router's `layout()` route with a shadcn Sidebar component. The layout provides navigation to Products, Create Product, Orders, and Settings pages. It must be auth-gated (sellers only) and responsive (sidebar collapses to a sheet on mobile).

## Route Structure

Add to `frontend/app/routes.ts`:

```ts
layout("routes/seller/layout.tsx", [
  route("seller", "routes/seller/index.tsx"),           // redirect to /seller/products
  route("seller/products", "routes/seller/products.tsx"),
  route("seller/products/create", "routes/seller/create-product.tsx"),
  route("seller/orders", "routes/seller/orders.tsx"),
  route("seller/settings", "routes/seller/settings.tsx"),
]),
```

The layout lives at `/seller/*` — clean and short.

## Files to Create

### 1. `frontend/app/routes/seller/layout.tsx` — Dashboard Layout

- **Auth guard**: Use `clientLoader` to check session via `authClient.getSession()`. If no session, redirect to `/login`. If session exists but `user.role !== "seller"`, redirect to `/`.
- **Structure**: Wrap in `SidebarProvider` > `Sidebar` + `SidebarInset`.
- **Sidebar content**:
  - **Header**: Seller store name (from `useSellerMe()` hook) or "Seller Dashboard" fallback.
  - **Nav links** (using `SidebarMenu` / `SidebarMenuItem` / `SidebarMenuButton`):
    - Products (icon: `Package`) → `/seller/products`
    - Create Product (icon: `PlusCircle`) → `/seller/products/create`
    - Orders (icon: `ShoppingBag`) → `/seller/orders`
    - Settings (icon: `Settings`) → `/seller/settings`
  - **Footer**: "Back to Store" link (icon: `Store`) → `/` + sidebar collapse trigger.
- **Active state**: Use `NavLink` with `isActive` to highlight the current nav item. Apply `bg-sidebar-accent text-sidebar-accent-foreground` for active, `text-sidebar-foreground` for inactive.
- **Mobile**: The shadcn Sidebar component handles mobile sheet automatically. Add a `SidebarTrigger` button in the `SidebarInset` header bar for toggling.
- **Top bar in SidebarInset**: A simple bar with `SidebarTrigger`, a breadcrumb or page title area, and the user avatar dropdown (reuse the existing user menu pattern from `header.tsx` but simplified — just avatar + sign out).
- **Icons**: Use `lucide-react` (already the project's icon library per `components.json`).
- **Styling**: Use CSS variables from `app.css` — `sidebar`, `sidebar-foreground`, `sidebar-accent`, `sidebar-border`, etc. No hardcoded colors.

### 2. `frontend/app/routes/seller/index.tsx` — Redirect

- Simple `clientLoader` that redirects `/seller` → `/seller/products`.
- No default component needed (or render null).

### 3. `frontend/app/routes/seller/products.tsx` — Placeholder

- Minimal placeholder page with heading "Products" and empty state.
- Use `<Empty>` component from shadcn for the empty state.
- Keep file minimal — just the route module.

### 4. `frontend/app/routes/seller/create-product.tsx` — Placeholder

- Minimal placeholder with heading "Create Product".
- Keep file minimal.

### 5. `frontend/app/routes/seller/orders.tsx` — Placeholder

- Minimal placeholder with heading "Orders" and empty state.
- Keep file minimal.

### 6. `frontend/app/routes/seller/settings.tsx` — Placeholder

- Minimal placeholder with heading "Settings".
- Keep file minimal.

## Conventions

- **Minimal routes**: Each route file should be as small as possible. Push logic into components.
- **No comments** in code.
- **Use `clientLoader`** (not `loader`) since this is a client-side auth check.
- **All local imports end with `.js`** is NOT needed here — that rule is backend-only.
- **Use `bun`** as package manager.
- **TypeScript**: Use proper types. Import types from `./+types/seller/layout` etc. if needed.
- **Sidebar component**: Already installed at `components/ui/sidebar.tsx`. Do NOT re-add it.
- **Design**: Match the existing "elegant, slick, modern" design system. Use theme tokens, not hardcoded values.

## Auth Flow

```
clientLoader checks session
  → No session → redirect /login
  → Session + role !== "seller" → redirect /
  → Session + role === "seller" → render layout
```

## Done When

- [ ] `/seller` redirects to `/seller/products`
- [ ] Sidebar shows all 4 nav links with correct icons
- [ ] Active link is visually highlighted
- [ ] Sidebar collapses/expands on desktop (toggle button works)
- [ ] Sidebar becomes a sheet on mobile (hamburger trigger)
- [ ] Auth guard redirects non-sellers away
- [ ] Top bar has user avatar + sign out
- [ ] "Back to Store" link in sidebar footer goes to `/`
- [ ] `bun run typecheck` passes
