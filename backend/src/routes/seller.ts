import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middlewares/require-auth.js";
import { requireSeller } from "../middlewares/require-seller.js";

const RESERVED_USERNAMES = new Set([
  "seller",
  "checkout",
  "product",
  "products",
  "login",
  "signup",
  "admin",
  "api",
  "s",
  "u",
  "cart",
  "wishlist",
  "shop",
  "order-confirmation",
  "orders",
  "settings",
  "promos",
]);

function slugifyUsername(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);
}

function isValidUsername(username: string) {
  return /^[a-z0-9_-]{3,20}$/.test(username);
}

async function generateUniqueUsername(base: string) {
  let slug = slugifyUsername(base);
  if (!slug || slug.length < 3) slug = "seller";
  if (RESERVED_USERNAMES.has(slug)) slug = `${slug}-store`;
  let candidate = slug;
  let suffix = 1;
  while (await prisma.seller.findUnique({ where: { username: candidate } })) {
    const suffixStr = `-${suffix}`;
    candidate = `${slug.slice(0, 20 - suffixStr.length)}${suffixStr}`;
    suffix++;
    if (suffix > 100) break;
  }
  return candidate;
}

const router = Router();

router.get("/by-username/:username", async (req, res) => {
  try {
    const username = String(req.params.username).toLowerCase().trim();
    const seller = await prisma.seller.findUnique({
      where: { username },
      include: { user: { select: { id: true, name: true, image: true } } },
    });
    if (!seller) return res.status(404).json({ error: "Seller not found" });

    const products = await prisma.product.findMany({
      where: { sellerId: seller.id, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { seller: { select: { id: true, name: true, image: true, username: true } } },
    });

    const reviews = await prisma.review.findMany({
      where: { product: { sellerId: seller.id, status: "active" } },
      include: {
        user: { select: { id: true, name: true, image: true } },
        product: { select: { id: true, name: true, images: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const agg = await prisma.review.aggregate({
      where: { product: { sellerId: seller.id, status: "active" } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const avgRating = agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : 0;
    const totalReviews = agg._count.rating ?? 0;
    const productCount = await prisma.product.count({ where: { sellerId: seller.id, status: "active" } });

    return res.json({
      seller,
      products,
      reviews,
      avgRating,
      totalReviews,
      productCount,
    });
  } catch (error) {
    console.error("Error fetching seller by username:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/check-username/:username", async (req, res) => {
  try {
    const username = String(req.params.username).toLowerCase().trim();
    if (!isValidUsername(username)) return res.json({ available: false, reason: "Invalid format (3-20 chars, a-z 0-9 _ -)" });
    if (RESERVED_USERNAMES.has(username)) return res.json({ available: false, reason: "Reserved username" });
    const existing = await prisma.seller.findUnique({ where: { username } });
    return res.json({ available: !existing });
  } catch (error) {
    return res.status(500).json({ error: "Failed to check username" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const session = (req as any).session;

    if (session.user.role !== "buyer") {
      return res.status(403).json({ error: "Only buyers can become sellers" });
    }

    const existingSeller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSeller) {
      return res.status(409).json({ error: "Seller profile already exists" });
    }

    const { name, image, description, username } = req.body as {
      name: string;
      image?: string | null;
      description?: string | null;
      username?: string;
    };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Store name is required" });
    }

    let finalUsername: string;
    if (username && typeof username === "string" && username.trim()) {
      const lower = username.toLowerCase().trim();
      if (!isValidUsername(lower)) return res.status(400).json({ error: "Username must be 3-20 chars, a-z 0-9 _ -" });
      if (RESERVED_USERNAMES.has(lower)) return res.status(400).json({ error: "Username is reserved" });
      const taken = await prisma.seller.findUnique({ where: { username: lower } });
      if (taken) return res.status(409).json({ error: "Username already taken" });
      finalUsername = lower;
    } else {
      finalUsername = await generateUniqueUsername(name);
    }

    const seller = await prisma.seller.create({
      data: {
        userId: session.user.id,
        username: finalUsername,
        name: name.trim(),
        image: image || null,
        description: description?.trim() || null,
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "seller" },
    });

    return res.status(201).json({ seller });
  } catch (error) {
    console.error("Error creating seller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", requireAuth, requireSeller, async (req, res) => {
  try {
    const session = (req as any).session;
    const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
    if (!seller) return res.status(404).json({ error: "Seller profile not found" });

    const [productCount, reviewAgg, orderItems] = await Promise.all([
      prisma.product.count({ where: { sellerId: seller.id, status: { not: "archived" } } }),
      prisma.review.aggregate({
        where: { product: { sellerId: seller.id, status: { not: "archived" } } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.orderItem.findMany({
        where: { sellerId: seller.id },
        select: {
          price: true,
          quantity: true,
          orderId: true,
          productId: true,
          order: { select: { createdAt: true, status: true } },
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              images: true,
              price: true,
              discount: true,
              category: true,
              stock: true,
              sizes: true,
              colors: true,
              gender: true,
              createdAt: true,
              updatedAt: true,
              sellerId: true,
              status: true,
              seller: { select: { id: true, name: true, image: true, username: true } },
            },
          },
        },
      }),
    ]);

    const avgRating = reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(1)) : 0;
    const totalReviews = reviewAgg._count.rating ?? 0;

    const validItems = orderItems.filter((it) => it.order.status !== "cancelled" && it.product.status !== "archived");
    const orderIds = new Set(validItems.map((it) => it.orderId));
    const totalOrders = orderIds.size;
    const totalRevenue = validItems.reduce((sum, it) => sum + it.price * it.quantity, 0);

    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);
    const startUTC = new Date(todayUTC);
    startUTC.setUTCDate(todayUTC.getUTCDate() - 29);

    const dayMap = new Map<string, { revenue: number; orders: Set<string> }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(startUTC);
      d.setUTCDate(startUTC.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      dayMap.set(key, { revenue: 0, orders: new Set() });
    }

    for (const it of validItems) {
      const key = new Date(it.order.createdAt).toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (!entry) continue;
      entry.revenue += it.price * it.quantity;
      entry.orders.add(it.orderId);
    }

    const salesOverTime = Array.from(dayMap.entries()).map(([date, v]) => ({
      date,
      revenue: Math.round(v.revenue * 100) / 100,
      orders: v.orders.size,
    }));

    const productMap = new Map<string, { product: (typeof orderItems)[number]["product"]; unitsSold: number; revenue: number; orders: Set<string> }>();
    for (const it of validItems) {
      const existing = productMap.get(it.productId);
      if (!existing) {
        productMap.set(it.productId, { product: it.product, unitsSold: it.quantity, revenue: it.price * it.quantity, orders: new Set([it.orderId]) });
      } else {
        existing.unitsSold += it.quantity;
        existing.revenue += it.price * it.quantity;
        existing.orders.add(it.orderId);
      }
    }
    let bestSellers = Array.from(productMap.values())
      .map((v) => ({ product: v.product, unitsSold: v.unitsSold, revenue: Math.round(v.revenue * 100) / 100, orders: v.orders.size }))
      .sort((a, b) => b.orders - a.orders || b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, 5);

    if (bestSellers.length) {
      const ids = bestSellers.map((b) => b.product.id);
      const reviews = await prisma.review.findMany({ where: { productId: { in: ids } }, select: { productId: true, rating: true } });
      const rMap = new Map<string, number[]>();
      for (const r of reviews) {
        const arr = rMap.get(r.productId) ?? [];
        arr.push(r.rating);
        rMap.set(r.productId, arr);
      }
      bestSellers = bestSellers.map((b) => {
        const ratings = rMap.get(b.product.id) ?? [];
        const total = ratings.length;
        const avg = total ? ratings.reduce((s, v) => s + v, 0) / total : 0;
        return { ...b, product: { ...b.product, avgRating: Number(avg.toFixed(1)), totalReviews: total } };
      });
    }

    return res.json({
      totalProducts: productCount,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgRating,
      totalReviews,
      salesOverTime,
      bestSellers,
    });
  } catch (error) {
    console.error("Error fetching seller stats:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const session = (req as any).session;

    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
    });

    return res.json({ seller });
  } catch (error) {
    console.error("Error fetching seller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const session = (req as any).session;

    const existing = await prisma.seller.findUnique({
      where: { userId: session.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Seller profile not found" });
    }

    const { name, image, description, username } = req.body as {
      name?: string;
      image?: string | null;
      description?: string | null;
      username?: string;
    };

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return res.status(400).json({ error: "Store name is required" });
    }
    if (name !== undefined && name.trim().length > 80) {
      return res.status(400).json({ error: "Store name must be under 80 characters" });
    }
    if (description !== undefined && description !== null && description.length > 500) {
      return res.status(400).json({ error: "Description must be under 500 characters" });
    }
    if (username !== undefined) {
      const lower = String(username).toLowerCase().trim();
      if (!isValidUsername(lower)) return res.status(400).json({ error: "Username must be 3-20 chars, a-z 0-9 _ -" });
      if (RESERVED_USERNAMES.has(lower)) return res.status(400).json({ error: "Username is reserved" });
      const taken = await prisma.seller.findUnique({ where: { username: lower } });
      if (taken && taken.id !== existing.id) return res.status(409).json({ error: "Username already taken" });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name.trim();
    if (image !== undefined) data.image = image ? String(image) : null;
    if (description !== undefined) data.description = description ? String(description).trim() : null;
    if (username !== undefined) data.username = String(username).toLowerCase().trim();

    const seller = await prisma.seller.update({
      where: { userId: session.user.id },
      data,
    });

    return res.json({ seller });
  } catch (error) {
    console.error("Error updating seller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
