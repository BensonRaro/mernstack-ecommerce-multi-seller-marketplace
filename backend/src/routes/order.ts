import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import { requireSeller } from "../middlewares/require-seller.js";
import { createOrder, getOrder, listMyOrders, listSellerOrders, updateOrderStatus } from "../controllers/order.js";

const router = Router();

router.get("/seller", requireAuth, requireSeller, listSellerOrders);
router.patch("/:id/status", requireAuth, requireSeller, updateOrderStatus);

router.post("/", requireAuth, createOrder);
router.post("/stripe/checkout", requireAuth, createOrder);
router.get("/", requireAuth, listMyOrders);
router.get("/:id", requireAuth, getOrder);

export default router;
