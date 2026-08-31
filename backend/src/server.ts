import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { createRouteHandler } from "uploadthing/express";
import { auth } from "./lib/auth.js";
import { uploadRouter } from "./lib/uploadthing.js";
import sellerRoutes from "./routes/seller.js";
import filesRoutes from "./routes/files.js";
import productRoutes from "./routes/product.js";
import orderRoutes from "./routes/order.js";
import promoRoutes from "./routes/promo.js";
import reviewRoutes from "./routes/review.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(helmet());

// Global CORS
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use(morgan("dev"));

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use("/api/uploadthing", createRouteHandler({ router: uploadRouter }));

app.get("/", (_req, res) => {
  res.status(200).json({ message: "API is running", status: "ok" });
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/me", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  return res.json(session);
});

app.use("/api/seller", sellerRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/promos", promoRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
