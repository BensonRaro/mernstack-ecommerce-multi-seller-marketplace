import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import { listReviews, canReview, createReview, updateReview, deleteReview, createComment, deleteComment } from "../controllers/review.js";

const router = Router();

router.get("/product/:productId", listReviews);
router.get("/can-review/:productId", requireAuth, canReview);

router.post("/", requireAuth, createReview);
router.put("/:id", requireAuth, updateReview);
router.delete("/:id", requireAuth, deleteReview);

router.post("/:reviewId/comments", requireAuth, createComment);
router.delete("/comments/:commentId", requireAuth, deleteComment);

export default router;
