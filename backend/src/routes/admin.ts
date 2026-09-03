import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middlewares/require-auth.js";
import { requireAdmin } from "../middlewares/require-admin.js";
import { inngest } from "../inngest/index.js";

const router = Router();

router.get(
  "/sellers",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const raw = req.query as Record<string, string | string[] | undefined>;
      const pageRaw = raw.page;
      const limitRaw = raw.limit;
      const searchRaw = raw.search;
      const approvedRaw = raw.approved;

      const pageStr: string = Array.isArray(pageRaw) ? String(pageRaw[0] ?? "1") : String(pageRaw ?? "1");
      const limitStr: string = Array.isArray(limitRaw) ? String(limitRaw[0] ?? "10") : String(limitRaw ?? "10");
      const searchStr: string = Array.isArray(searchRaw) ? String(searchRaw[0] ?? "") : String(searchRaw ?? "");
      const approvedStr: string | undefined = Array.isArray(approvedRaw) ? approvedRaw[0] : approvedRaw;

      const pageNum = Math.max(1, parseInt(pageStr, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limitStr, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      const where: Record<string, unknown> = {};

      if (searchStr) {
        where.OR = [
          { name: { contains: searchStr, mode: "insensitive" } },
          { user: { email: { contains: searchStr, mode: "insensitive" } } },
          { username: { contains: searchStr, mode: "insensitive" } },
        ];
      }

      if (approvedStr !== undefined && approvedStr !== "") {
        where.approved = approvedStr === "true";
      }

      const [sellers, total] = await Promise.all([
        prisma.seller.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
              },
            },
            _count: { select: { products: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        prisma.seller.count({ where }),
      ]);

      return res.json({
        sellers,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      console.error("List sellers error:", error);
      return res.status(500).json({ error: "Failed to list sellers" });
    }
  }
);

router.patch(
  "/sellers/:id/approve",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = String(req.params.id);

      const seller = await prisma.seller.findUnique({
        where: { id },
        include: { user: { select: { name: true, email: true } } },
      });
      if (!seller) return res.status(404).json({ error: "Seller not found" });

      const updated = await prisma.seller.update({
        where: { id },
        data: { approved: true, revokedAt: null, revokedReason: null },
      });

      if (seller.user.email) {
        await inngest.send({
          name: "app/seller.approved",
          data: {
            to: seller.user.email,
            sellerName: seller.user.name || seller.name,
          },
        });
      }

      return res.json({ seller: updated });
    } catch (error) {
      console.error("Approve seller error:", error);
      return res.status(500).json({ error: "Failed to approve seller" });
    }
  }
);

router.patch(
  "/sellers/:id/reject",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = String(req.params.id);
      const { reason } = req.body as { reason?: string };

      if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
        return res.status(400).json({ error: "A reason is required to reject a seller" });
      }
      if (reason.trim().length > 500) {
        return res.status(400).json({ error: "Reason must be under 500 characters" });
      }

      const seller = await prisma.seller.findUnique({
        where: { id },
        include: { user: { select: { name: true, email: true } } },
      });
      if (!seller) return res.status(404).json({ error: "Seller not found" });

      const [updated] = await prisma.$transaction([
        prisma.seller.update({
          where: { id },
          data: {
            approved: false,
            revokedAt: new Date(),
            revokedReason: reason.trim(),
          },
        }),
        prisma.product.updateMany({
          where: { sellerId: id, status: { not: "archived" } },
          data: { status: "archived" },
        }),
      ]);

      if (seller.user.email) {
        await inngest.send({
          name: "app/seller.rejected",
          data: {
            to: seller.user.email,
            sellerName: seller.user.name || seller.name,
            reason: reason.trim(),
          },
        });
      }

      return res.json({ seller: updated });
    } catch (error) {
      console.error("Reject seller error:", error);
      return res.status(500).json({ error: "Failed to reject seller" });
    }
  }
);

router.patch(
  "/sellers/:id/ban",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = String(req.params.id);
      const { banned } = req.body as { banned: boolean };

      const seller = await prisma.seller.findUnique({ where: { id } });
      if (!seller) return res.status(404).json({ error: "Seller not found" });

      await prisma.user.update({
        where: { id: seller.userId },
        data: { banned },
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("Ban seller error:", error);
      return res.status(500).json({ error: "Failed to update seller" });
    }
  }
);

// ─── Users ──────────────────────────────────────────────────────────────────

router.get(
  "/users",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const raw = req.query as Record<string, string | string[] | undefined>;
      const pageRaw = raw.page;
      const limitRaw = raw.limit;
      const searchRaw = raw.search;
      const roleRaw = raw.role;

      const pageStr: string = Array.isArray(pageRaw) ? String(pageRaw[0] ?? "1") : String(pageRaw ?? "1");
      const limitStr: string = Array.isArray(limitRaw) ? String(limitRaw[0] ?? "10") : String(limitRaw ?? "10");
      const searchStr: string = Array.isArray(searchRaw) ? String(searchRaw[0] ?? "") : String(searchRaw ?? "");
      const roleStr: string = Array.isArray(roleRaw) ? String(roleRaw[0] ?? "") : String(roleRaw ?? "");

      const pageNum = Math.max(1, parseInt(pageStr, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limitStr, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      const where: Record<string, unknown> = {};

      if (searchStr) {
        where.OR = [
          { name: { contains: searchStr, mode: "insensitive" } },
          { email: { contains: searchStr, mode: "insensitive" } },
        ];
      }

      if (roleStr && ["buyer", "seller", "admin"].includes(roleStr)) {
        where.role = roleStr;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            banned: true,
            createdAt: true,
            seller: {
              select: {
                id: true,
                name: true,
                username: true,
                approved: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        prisma.user.count({ where }),
      ]);

      return res.json({
        users,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      console.error("List users error:", error);
      return res.status(500).json({ error: "Failed to list users" });
    }
  }
);

router.patch(
  "/users/:id/ban",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = String(req.params.id);
      const { banned } = req.body as { banned: boolean };
      const session = req.session as { user: { id: string } };

      if (id === session.user.id) {
        return res.status(400).json({ error: "You cannot ban your own account" });
      }

      const user = await prisma.user.findUnique({
        where: { id },
        include: { seller: { select: { id: true } } },
      });
      if (!user) return res.status(404).json({ error: "User not found" });

      await prisma.user.update({
        where: { id },
        data: { banned },
      });

      if (banned && user.email) {
        await inngest.send({
          name: "app/user.banned",
          data: {
            to: user.email,
            userName: user.name || "User",
          },
        });
      }

      if (user.seller) {
        if (banned) {
          await prisma.product.updateMany({
            where: { sellerId: user.seller.id, status: { not: "archived" } },
            data: { status: "archived" },
          });
        } else {
          await prisma.product.updateMany({
            where: { sellerId: user.seller.id, status: "archived" },
            data: { status: "active" },
          });
        }
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Ban user error:", error);
      return res.status(500).json({ error: "Failed to update user" });
    }
  }
);

// ─── Products ───────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ["fashion", "electronics", "beauty", "fitness", "home-decor", "accessories"];
const VALID_STATUSES = ["draft", "active", "archived", "rejected"];
const REJECTABLE_STATUSES = ["active", "draft"];

router.get(
  "/products",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const raw = req.query as Record<string, string | string[] | undefined>;
      const pageRaw = raw.page;
      const limitRaw = raw.limit;
      const searchRaw = raw.search;
      const categoryRaw = raw.category;
      const statusRaw = raw.status;

      const pageStr: string = Array.isArray(pageRaw) ? String(pageRaw[0] ?? "1") : String(pageRaw ?? "1");
      const limitStr: string = Array.isArray(limitRaw) ? String(limitRaw[0] ?? "10") : String(limitRaw ?? "10");
      const searchStr: string = Array.isArray(searchRaw) ? String(searchRaw[0] ?? "") : String(searchRaw ?? "");
      const categoryStr: string = Array.isArray(categoryRaw) ? String(categoryRaw[0] ?? "") : String(categoryRaw ?? "");
      const statusStr: string = Array.isArray(statusRaw) ? String(statusRaw[0] ?? "") : String(statusRaw ?? "");

      const pageNum = Math.max(1, parseInt(pageStr, 10) || 1);
      const limitNum = Math.min(50, Math.max(1, parseInt(limitStr, 10) || 10));
      const skip = (pageNum - 1) * limitNum;

      const where: Record<string, unknown> = {};

      if (searchStr) {
        where.OR = [
          { name: { contains: searchStr, mode: "insensitive" } },
          { description: { contains: searchStr, mode: "insensitive" } },
        ];
      }

      if (categoryStr && VALID_CATEGORIES.includes(categoryStr)) {
        where.category = categoryStr;
      }

      if (statusStr && VALID_STATUSES.includes(statusStr)) {
        where.status = statusStr;
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                username: true,
                approved: true,
              },
            },
            _count: { select: { reviews: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        prisma.product.count({ where }),
      ]);

      const productIds = products.map((p) => p.id);
      let ratingMap = new Map<string, { avg: number; total: number }>();
      if (productIds.length) {
        const reviews = await prisma.review.findMany({
          where: { productId: { in: productIds } },
          select: { productId: true, rating: true },
        });
        const rMap = new Map<string, number[]>();
        for (const r of reviews) {
          const arr = rMap.get(r.productId) ?? [];
          arr.push(r.rating);
          rMap.set(r.productId, arr);
        }
        for (const [pid, ratings] of rMap) {
          const totalR = ratings.length;
          const avg = totalR ? ratings.reduce((s, v) => s + v, 0) / totalR : 0;
          ratingMap.set(pid, { avg: Number(avg.toFixed(1)), total: totalR });
        }
      }

      const enriched = products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        discount: p.discount,
        category: p.category,
        images: p.images,
        stock: p.stock,
        sizes: p.sizes,
        colors: p.colors,
        gender: p.gender,
        status: p.status,
        rejectionReason: p.rejectionReason,
        sellerId: p.sellerId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        seller: p.seller,
        avgRating: ratingMap.get(p.id)?.avg ?? 0,
        totalReviews: ratingMap.get(p.id)?.total ?? 0,
      }));

      return res.json({
        products: enriched,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      console.error("List admin products error:", error);
      return res.status(500).json({ error: "Failed to list products" });
    }
  }
);

router.patch(
  "/products/:id/status",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = String(req.params.id);
      const { status, reason } = req.body as { status?: string; reason?: string };

      if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }

      if (status === "rejected") {
        if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
          return res.status(400).json({ error: "A reason is required to reject a product" });
        }
        if (reason.trim().length > 500) {
          return res.status(400).json({ error: "Reason must be under 500 characters" });
        }
      }

      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) return res.status(404).json({ error: "Product not found" });

      const updateData: Record<string, unknown> = { status };
      if (status === "rejected") {
        updateData.rejectionReason = reason!.trim();
      } else {
        updateData.rejectionReason = null;
      }

      const updated = await prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          seller: {
            select: { id: true, name: true, username: true, approved: true },
          },
        },
      });

      if (status === "rejected" && updated.seller) {
        const sellerUser = await prisma.user.findUnique({
          where: { id: updated.sellerId },
          select: { email: true },
        });
        if (sellerUser?.email) {
          await inngest.send({
            name: "app/product.rejected",
            data: {
              to: sellerUser.email,
              productName: product.name,
              reason: reason!.trim(),
            },
          });
        }
      }

      if (status === "active" && product.status === "rejected" && updated.seller) {
        const sellerUser = await prisma.user.findUnique({
          where: { id: updated.sellerId },
          select: { email: true },
        });
        if (sellerUser?.email) {
          await inngest.send({
            name: "app/product.approved",
            data: {
              to: sellerUser.email,
              productName: product.name,
            },
          });
        }
      }

      return res.json({ product: updated });
    } catch (error) {
      console.error("Update product status error:", error);
      return res.status(500).json({ error: "Failed to update product status" });
    }
  }
);

// ─── Stats ──────────────────────────────────────────────────────────────────

router.get(
  "/stats",
  requireAuth,
  requireAdmin,
  async (_req, res) => {
    try {
      const [
        totalUsers,
        totalSellers,
        pendingSellers,
        totalProducts,
        totalOrders,
        revenueResult,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.seller.count(),
        prisma.seller.count({ where: { approved: false, revokedAt: null } }),
        prisma.product.count(),
        prisma.order.count({ where: { status: { not: "cancelled" } } }),
        prisma.order.aggregate({
          where: { status: { not: "cancelled" } },
          _sum: { total: true },
        }),
      ]);

      const totalRevenue = Math.round((revenueResult._sum.total ?? 0) * 100) / 100;

      // Sales over time — last 30 days
      const todayUTC = new Date();
      todayUTC.setUTCHours(0, 0, 0, 0);
      const startUTC = new Date(todayUTC);
      startUTC.setUTCDate(todayUTC.getUTCDate() - 29);

      const orders = await prisma.order.findMany({
        where: {
          status: { not: "cancelled" },
          createdAt: { gte: startUTC },
        },
        select: { id: true, total: true, createdAt: true },
      });

      const dayMap = new Map<string, { revenue: number; orders: Set<string> }>();
      for (let i = 0; i < 30; i++) {
        const d = new Date(startUTC);
        d.setUTCDate(startUTC.getUTCDate() + i);
        const key = d.toISOString().slice(0, 10);
        dayMap.set(key, { revenue: 0, orders: new Set() });
      }

      for (const o of orders) {
        const key = new Date(o.createdAt).toISOString().slice(0, 10);
        const entry = dayMap.get(key);
        if (!entry) continue;
        entry.revenue += o.total;
        entry.orders.add(o.id);
      }

      const salesOverTime = Array.from(dayMap.entries()).map(([date, v]) => ({
        date,
        revenue: Math.round(v.revenue * 100) / 100,
        orders: v.orders.size,
      }));

      // Recent pending sellers
      const recentPendingSellers = await prisma.seller.findMany({
        where: { approved: false, revokedAt: null },
        select: {
          id: true,
          name: true,
          username: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      return res.json({
        totalUsers,
        totalSellers,
        pendingSellers,
        totalProducts,
        totalOrders,
        totalRevenue,
        salesOverTime,
        recentPendingSellers,
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      return res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  }
);

export default router;
