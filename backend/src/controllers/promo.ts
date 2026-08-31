import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function listSellerPromos(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
    if (!seller) return res.status(404).json({ error: "Seller profile not found" });
    const promos = await prisma.promo.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: "desc" } });
    return res.json({ promos });
  } catch (e) {
    console.error("listSellerPromos", e);
    return res.status(500).json({ error: "Failed to fetch promos" });
  }
}

export async function createPromo(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
    if (!seller) return res.status(404).json({ error: "Seller profile not found" });
    if (!seller.approved) {
      if (seller.revokedAt) {
        return res.status(403).json({ error: "Your seller account has been revoked." });
      }
      return res.status(403).json({ error: "Your seller account is pending approval." });
    }
    const { code, discountPercent, active, expiresAt } = req.body as { code: string; discountPercent: number; active?: boolean; expiresAt?: string | null };
    if (!code || typeof code !== "string" || !code.trim()) return res.status(400).json({ error: "Code required" });
    const upper = code.trim().toUpperCase();
    if (upper.length < 3 || upper.length > 20) return res.status(400).json({ error: "Code must be 3-20 chars" });
    const discount = Number(discountPercent);
    if (Number.isNaN(discount) || discount < 1 || discount > 90) return res.status(400).json({ error: "Discount must be 1-90" });

    const existing = await prisma.promo.findFirst({ where: { code: upper, sellerId: seller.id } });
    if (existing) return res.status(409).json({ error: "Code already exists for this seller" });

    const promo = await prisma.promo.create({
      data: {
        code: upper,
        discountPercent: discount,
        active: active ?? true,
        sellerId: seller.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    return res.status(201).json({ promo });
  } catch (e) {
    console.error("createPromo", e);
    return res.status(500).json({ error: "Failed to create promo" });
  }
}

export async function updatePromo(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
    if (!seller) return res.status(404).json({ error: "Seller profile not found" });
    const id = req.params.id as string;
    const existing = await prisma.promo.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Promo not found" });
    if (existing.sellerId !== seller.id) return res.status(403).json({ error: "Not your promo" });

    const { code, discountPercent, active, expiresAt } = req.body as { code?: string; discountPercent?: number; active?: boolean; expiresAt?: string | null };
    const data: Record<string, unknown> = {};
    if (code !== undefined) {
      const upper = String(code).trim().toUpperCase();
      if (upper.length < 3 || upper.length > 20) return res.status(400).json({ error: "Code must be 3-20 chars" });
      if (upper !== existing.code) {
        const dup = await prisma.promo.findFirst({ where: { code: upper, sellerId: seller.id } });
        if (dup) return res.status(409).json({ error: "Code already exists for this seller" });
      }
      data.code = upper;
    }
    if (discountPercent !== undefined) {
      const d = Number(discountPercent);
      if (Number.isNaN(d) || d < 1 || d > 90) return res.status(400).json({ error: "Discount must be 1-90" });
      data.discountPercent = d;
    }
    if (active !== undefined) data.active = Boolean(active);
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt as string) : null;

    const promo = await prisma.promo.update({ where: { id }, data });
    return res.json({ promo });
  } catch (e) {
    console.error("updatePromo", e);
    return res.status(500).json({ error: "Failed to update promo" });
  }
}

export async function deletePromo(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
    if (!seller) return res.status(404).json({ error: "Seller profile not found" });
    const id = req.params.id as string;
    const existing = await prisma.promo.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Promo not found" });
    if (existing.sellerId !== seller.id) return res.status(403).json({ error: "Not your promo" });
    await prisma.promo.delete({ where: { id } });
    return res.json({ success: true });
  } catch (e) {
    console.error("deletePromo", e);
    return res.status(500).json({ error: "Failed to delete promo" });
  }
}

export async function validatePromo(req: Request, res: Response) {
  try {
    const { code, sellerIds } = req.body as { code: string; sellerIds?: string[] };
    if (!code || typeof code !== "string") return res.status(400).json({ error: "Code required" });
    const upper = code.trim().toUpperCase();
    const now = new Date();

    const promos = await prisma.promo.findMany({
      where: {
        code: upper,
        active: true,
        OR: [{ sellerId: null }, { seller: { approved: true } }],
      },
    });

    const valid = promos.filter((p) => {
      if (p.expiresAt && new Date(p.expiresAt) < now) return false;
      return true;
    });

    if (valid.length === 0) return res.status(404).json({ error: "Invalid or expired promo code" });

    // Prefer seller-specific promo that matches cart sellers
    const sellerSet = new Set((sellerIds ?? []).filter(Boolean));
    const sellerMatch = valid.find((p) => p.sellerId && sellerSet.has(p.sellerId));
    if (sellerMatch) {
    const seller = await prisma.seller.findUnique({ where: { id: sellerMatch.sellerId! }, select: { name: true, approved: true } });
    if (!seller?.approved) return res.status(404).json({ error: "Promo not applicable to items in your cart" });
    return res.json({ valid: true, promo: sellerMatch, sellerName: seller?.name ?? null });
    }

    const globalMatch = valid.find((p) => !p.sellerId);
    if (globalMatch) return res.json({ valid: true, promo: globalMatch, sellerName: null });

    // If promo exists but seller mismatch
    return res.status(404).json({ error: "Promo not applicable to items in your cart" });
  } catch (e) {
    console.error("validatePromo", e);
    return res.status(500).json({ error: "Failed to validate promo" });
  }
}
