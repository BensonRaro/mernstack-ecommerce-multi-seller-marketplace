import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import { requireSeller } from "../middlewares/require-seller.js";
import { listSellerPromos, createPromo, updatePromo, deletePromo, validatePromo } from "../controllers/promo.js";

const router = Router();

router.post("/validate", validatePromo);

router.get("/mine", requireAuth, requireSeller, listSellerPromos);
router.post("/", requireAuth, requireSeller, createPromo);
router.put("/:id", requireAuth, requireSeller, updatePromo);
router.delete("/:id", requireAuth, requireSeller, deletePromo);

export default router;
