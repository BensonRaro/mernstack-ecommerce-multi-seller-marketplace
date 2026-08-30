import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import {
  getProfile,
  updateProfile,
  getUserReviews,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  listPhones,
  createPhone,
  updatePhone,
  deletePhone,
  setDefaultPhone,
} from "../controllers/user.js";

const router = Router();

router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.get("/reviews", requireAuth, getUserReviews);

// Address CRUD
router.get("/addresses", requireAuth, listAddresses);
router.post("/addresses", requireAuth, createAddress);
router.put("/addresses/:id", requireAuth, updateAddress);
router.delete("/addresses/:id", requireAuth, deleteAddress);
router.post("/addresses/:id/default", requireAuth, setDefaultAddress);

// Phone CRUD
router.get("/phones", requireAuth, listPhones);
router.post("/phones", requireAuth, createPhone);
router.put("/phones/:id", requireAuth, updatePhone);
router.delete("/phones/:id", requireAuth, deletePhone);
router.post("/phones/:id/default", requireAuth, setDefaultPhone);

export default router;