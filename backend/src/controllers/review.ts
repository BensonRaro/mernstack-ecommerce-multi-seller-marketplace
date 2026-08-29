import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

async function hasPurchased(userId: string, productId: string) {
  const order = await prisma.order.findFirst({
    where: {
      userId,
      items: { some: { productId } },
      NOT: [{ paymentStatus: "failed" } as never],
    },
    select: { id: true },
  });
  return !!order;
}

export async function listReviews(req: Request, res: Response) {
  try {
    const productId = req.params.productId as string;
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        comments: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const total = reviews.length;
    const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    return res.json({ reviews, avg, total });
  } catch (e) {
    console.error("listReviews", e);
    return res.status(500).json({ error: "Failed to fetch reviews" });
  }
}

export async function canReview(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const productId = req.params.productId as string;
    const userId = session.user.id as string;

    const purchased = await hasPurchased(userId, productId);
    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });

    return res.json({
      canReview: purchased && !existing,
      hasPurchased: purchased,
      hasReviewed: !!existing,
      review: existing ?? null,
    });
  } catch (e) {
    console.error("canReview", e);
    return res.status(500).json({ error: "Failed to check" });
  }
}

export async function createReview(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const userId = session.user.id as string;
    const { productId, rating, comment } = req.body as { productId: string; rating: number; comment: string };

    if (!productId || typeof productId !== "string") return res.status(400).json({ error: "productId required" });
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) return res.status(400).json({ error: "Rating must be 1-5" });
    if (!comment || typeof comment !== "string" || comment.trim().length < 10) return res.status(400).json({ error: "Comment must be at least 10 characters" });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const purchased = await hasPurchased(userId, productId);
    if (!purchased) return res.status(403).json({ error: "Only purchasers can review" });

    const existing = await prisma.review.findUnique({ where: { productId_userId: { productId, userId } } });
    if (existing) return res.status(409).json({ error: "You have already reviewed this product" });

    const review = await prisma.review.create({
      data: { productId, userId, rating: r, comment: comment.trim() },
      include: { user: { select: { id: true, name: true, image: true } }, comments: true },
    });
    return res.status(201).json({ review });
  } catch (e) {
    console.error("createReview", e);
    return res.status(500).json({ error: "Failed to create review" });
  }
}

export async function updateReview(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const userId = session.user.id as string;
    const id = req.params.id as string;
    const { rating, comment } = req.body as { rating?: number; comment?: string };

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Review not found" });
    if (existing.userId !== userId) return res.status(403).json({ error: "Not your review" });

    const data: Record<string, unknown> = {};
    if (rating !== undefined) {
      const r = Number(rating);
      if (!Number.isInteger(r) || r < 1 || r > 5) return res.status(400).json({ error: "Rating must be 1-5" });
      data.rating = r;
    }
    if (comment !== undefined) {
      if (typeof comment !== "string" || comment.trim().length < 10) return res.status(400).json({ error: "Comment must be at least 10 characters" });
      data.comment = comment.trim();
    }

    const review = await prisma.review.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true, image: true } }, comments: { include: { user: { select: { id: true, name: true, image: true } } } } },
    });
    return res.json({ review });
  } catch (e) {
    console.error("updateReview", e);
    return res.status(500).json({ error: "Failed to update review" });
  }
}

export async function deleteReview(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const userId = session.user.id as string;
    const id = req.params.id as string;
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Review not found" });
    if (existing.userId !== userId) return res.status(403).json({ error: "Not your review" });
    await prisma.review.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    console.error("deleteReview", e);
    return res.status(500).json({ error: "Failed to delete review" });
  }
}

export async function createComment(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const userId = session.user.id as string;
    const reviewId = req.params.reviewId as string;
    const { comment } = req.body as { comment: string };
    if (!comment || typeof comment !== "string" || comment.trim().length < 2) return res.status(400).json({ error: "Comment must be at least 2 characters" });
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return res.status(404).json({ error: "Review not found" });
    const created = await prisma.reviewComment.create({
      data: { reviewId, userId, comment: comment.trim() },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    return res.status(201).json({ comment: created });
  } catch (e) {
    console.error("createComment", e);
    return res.status(500).json({ error: "Failed to create comment" });
  }
}

export async function deleteComment(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const userId = session.user.id as string;
    const id = req.params.commentId as string;
    const existing = await prisma.reviewComment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Comment not found" });
    if (existing.userId !== userId) return res.status(403).json({ error: "Not your comment" });
    await prisma.reviewComment.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    console.error("deleteComment", e);
    return res.status(500).json({ error: "Failed to delete comment" });
  }
}
