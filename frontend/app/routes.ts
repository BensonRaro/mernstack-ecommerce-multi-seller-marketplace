import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  layout("routes/public.tsx", [
    index("routes/home.tsx"),
    route("shop", "routes/shop.tsx"),
    route("product/:id", "routes/product-details.tsx"),
    route("checkout", "routes/checkout.tsx"),
    route("order-confirmation/:id", "routes/order-confirmation.tsx"),
    route(":username", "routes/seller-profile.tsx"),
  ]),
  layout("routes/auth.tsx", [
    route("signup", "routes/signup.tsx"),
    route("login", "routes/login.tsx"),
  ]),
  layout("routes/seller/layout.tsx", [
    route("seller", "routes/seller/index.tsx"),
    route("seller/products", "routes/seller/products.tsx"),
    route("seller/products/create", "routes/seller/create-product.tsx"),
    route("seller/products/:id/edit", "routes/seller/edit-product.tsx"),
    route("seller/promos", "routes/seller/promos.tsx"),
    route("seller/orders", "routes/seller/orders.tsx"),
    route("seller/settings", "routes/seller/settings.tsx"),
    route("seller/ai-insights", "routes/seller/ai-insights.tsx"),
  ]),
  layout("routes/admin/layout.tsx", [
    route("admin", "routes/admin/index.tsx"),
    route("admin/sellers", "routes/admin/sellers.tsx"),
    route("admin/users", "routes/admin/users.tsx"),
    route("admin/products", "routes/admin/products.tsx"),
  ]),
  layout("routes/user.tsx", [
    route("profile", "routes/profile.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
