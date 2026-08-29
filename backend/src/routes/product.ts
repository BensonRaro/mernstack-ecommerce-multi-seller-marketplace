import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import { requireSeller } from "../middlewares/require-seller.js";
import {
  createProduct,
  listProducts,
  getBestSellers,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.js";

const router = Router();

router.get("/best-sellers", getBestSellers);
router.get("/", listProducts);
router.get("/:id", getProduct);

router.post("/", requireAuth, requireSeller, createProduct);
router.put("/:id", requireAuth, requireSeller, updateProduct);
router.delete("/:id", requireAuth, requireSeller, deleteProduct);

export default router;
