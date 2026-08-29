import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("routes/public.tsx", [
    index("routes/home.tsx"),
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
  ]),
] satisfies RouteConfig;
