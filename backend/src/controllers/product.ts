import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { UTApi } from "uploadthing/server";
import type { Request, Response } from "express";

const utapi = new UTApi();

function extractFileKey(url: string): string | null {
  try {
    const parts = url.split("/");
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

const VALID_CATEGORIES = [
  "fashion",
  "electronics",
  "beauty",
  "fitness",
  "home-decor",
  "accessories",
];

const VALID_STATUSES = ["draft", "active", "archived"];
const VALID_GENDERS = ["men", "women", "unisex"];
const VALID_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export async function createProduct(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const {
      name, description, price, discount, category, images,
      stock, sizes, colors, gender, status,
    } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Product name is required" });
    }

    if (price === undefined || typeof price !== "number" || price <= 0) {
      return res.status(400).json({ error: "A valid price is required" });
    }

    if (discount !== undefined && (typeof discount !== "number" || discount < 0 || discount > 100)) {
      return res.status(400).json({ error: "Discount must be between 0 and 100" });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "A valid category is required" });
    }

    if (stock !== undefined && (typeof stock !== "number" || stock < 0)) {
      return res.status(400).json({ error: "Stock must be a non-negative number" });
    }

    if (sizes !== undefined && !Array.isArray(sizes)) {
      return res.status(400).json({ error: "Sizes must be an array" });
    }

    if (colors !== undefined && !Array.isArray(colors)) {
      return res.status(400).json({ error: "Colors must be an array" });
    }

    if (gender !== undefined && gender !== null && !VALID_GENDERS.includes(gender)) {
      return res.status(400).json({ error: "Invalid gender value" });
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
    });

    if (!seller) {
      return res.status(404).json({ error: "Seller profile not found" });
    }

    if (!seller.approved) {
      if (seller.revokedAt) {
        return res.status(403).json({ error: "Your seller account has been revoked." });
      }
      return res.status(403).json({ error: "Your seller account is pending approval." });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price,
        discount: discount ?? 0,
        category,
        images: Array.isArray(images) ? images : [],
        stock: stock ?? 0,
        sizes: Array.isArray(sizes) ? sizes : [],
        colors: Array.isArray(colors) ? colors : [],
        gender: gender || null,
        status: status || "draft",
        sellerId: seller.id,
      },
    });

    return res.status(201).json({ product });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function listProducts(req: Request, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = (req.query.search as string)?.trim() || "";
    const category = (req.query.category as string)?.trim() || "";
    const status = (req.query.status as string)?.trim() || "";
    const mine = req.query.mine === "true";
    const sellerIdParam = (req.query.sellerId as string)?.trim() || "";
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const ratingParam = req.query.rating ? parseFloat(req.query.rating as string) : undefined;
    const sort = (req.query.sort as string)?.trim() || "";

    const where: Record<string, unknown> = {};

    if (search) {
      (where as any).OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      (where as any).category = category;
    }

    if (status && VALID_STATUSES.includes(status)) {
      (where as any).status = status;
    } else if (!mine && !sellerIdParam && !status) {
      (where as any).status = "active";
    }

    if (sellerIdParam) {
      (where as any).sellerId = sellerIdParam;
    }

    // Public listings: hide products from sellers who are not approved
    if (!mine) {
      const approvedSellerIds = await prisma.seller.findMany({
        where: { approved: true },
        select: { id: true },
      }).then((sellers) => sellers.map((s) => s.id));

      if (approvedSellerIds.length === 0) {
        return res.json({ products: [], total: 0, page, limit, totalPages: 1 });
      }

      (where as any).sellerId = { in: approvedSellerIds };
    }

    if (mine) {
      let session = (req as any).session;
      if (!session) {
        try {
          session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers as never),
          });
        } catch {
          session = null;
        }
      }
      if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const seller = await prisma.seller.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      if (!seller) {
        return res.status(404).json({ error: "Seller profile not found" });
      }
      (where as any).sellerId = seller.id;
    }

    const needsMemoryProcessing = Boolean(
      (minPrice !== undefined && !isNaN(minPrice)) ||
        (maxPrice !== undefined && !isNaN(maxPrice)) ||
        (ratingParam !== undefined && !isNaN(ratingParam)) ||
        sort
    );

    if (!needsMemoryProcessing) {
      const skip = (page - 1) * limit;
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where: where as never,
          include: { seller: { select: { id: true, name: true, image: true, username: true } } },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.product.count({ where: where as never }),
      ]);

      const productIds = products.map((p) => p.id);
      let ratingMap = new Map<string, { avg: number; total: number }>();
      let salesMap = new Map<string, number>();
      if (productIds.length) {
        const [reviews, orderItems] = await Promise.all([
          prisma.review.findMany({ where: { productId: { in: productIds } }, select: { productId: true, rating: true } }),
          prisma.orderItem.findMany({ where: { productId: { in: productIds }, order: { status: { not: "cancelled" } } }, select: { productId: true, orderId: true } }),
        ]);
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
        const sMap = new Map<string, Set<string>>();
        for (const it of orderItems) {
          const set = sMap.get(it.productId) ?? new Set<string>();
          set.add(it.orderId);
          sMap.set(it.productId, set);
        }
        salesMap = new Map(Array.from(sMap.entries()).map(([k, v]) => [k, v.size]));
      }

      const enriched = products.map((p) => ({
        ...p,
        avgRating: ratingMap.get(p.id)?.avg ?? 0,
        totalReviews: ratingMap.get(p.id)?.total ?? 0,
        unitsSold: salesMap.get(p.id) ?? 0,
      }));

      const totalPages = Math.ceil(total / limit) || 1;
      return res.json({ products: enriched, total, page, limit, totalPages });
    }

    const allProducts = await prisma.product.findMany({
      where: where as never,
      include: { seller: { select: { id: true, name: true, image: true, username: true } } },
    });

    const productIds = allProducts.map((p) => p.id);
    let ratingMap = new Map<string, { avg: number; total: number }>();
    let salesMap = new Map<string, number>();
    if (productIds.length) {
      const [reviews, orderItems] = await Promise.all([
        prisma.review.findMany({ where: { productId: { in: productIds } }, select: { productId: true, rating: true } }),
        prisma.orderItem.findMany({ where: { productId: { in: productIds }, order: { status: { not: "cancelled" } } }, select: { productId: true, orderId: true } }),
      ]);
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
      const sMap = new Map<string, Set<string>>();
      for (const it of orderItems) {
        const set = sMap.get(it.productId) ?? new Set<string>();
        set.add(it.orderId);
        sMap.set(it.productId, set);
      }
      salesMap = new Map(Array.from(sMap.entries()).map(([k, v]) => [k, v.size]));
    }

    let enriched = allProducts.map((p) => {
      const discounted = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
      return {
        ...p,
        discountedPrice: discounted,
        avgRating: ratingMap.get(p.id)?.avg ?? 0,
        totalReviews: ratingMap.get(p.id)?.total ?? 0,
        unitsSold: salesMap.get(p.id) ?? 0,
      } as typeof p & { discountedPrice: number; avgRating: number; totalReviews: number; unitsSold: number };
    });

    if (minPrice !== undefined && !isNaN(minPrice)) enriched = enriched.filter((p) => (p as never as { discountedPrice: number }).discountedPrice >= minPrice);
    if (maxPrice !== undefined && !isNaN(maxPrice)) enriched = enriched.filter((p) => (p as never as { discountedPrice: number }).discountedPrice <= maxPrice);
    if (ratingParam !== undefined && !isNaN(ratingParam)) enriched = enriched.filter((p) => p.avgRating >= ratingParam);

    if (sort === "price_asc") enriched.sort((a, b) => (a as never as { discountedPrice: number }).discountedPrice - (b as never as { discountedPrice: number }).discountedPrice);
    else if (sort === "price_desc") enriched.sort((a, b) => (b as never as { discountedPrice: number }).discountedPrice - (a as never as { discountedPrice: number }).discountedPrice);
    else if (sort === "rating_desc") enriched.sort((a, b) => b.avgRating - a.avgRating || b.totalReviews - a.totalReviews);
    else if (sort === "newest") enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = enriched.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const paginated = enriched.slice(start, start + limit).map(({ discountedPrice: _d, ...rest }) => rest);

    return res.json({ products: paginated, total, page, limit, totalPages });
  } catch (error) {
    console.error("Error listing products:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getBestSellers(req: Request, res: Response) {
  try {
    const limit = Math.min(12, Math.max(1, parseInt(req.query.limit as string) || 6));

    const approvedSellerIds = await prisma.seller.findMany({
      where: { approved: true },
      select: { id: true },
    }).then((sellers) => sellers.map((s) => s.id));

    if (approvedSellerIds.length === 0) {
      return res.json({ bestSellers: [] });
    }

    const approvedProductIds = await prisma.product.findMany({
      where: { sellerId: { in: approvedSellerIds } },
      select: { id: true },
    }).then((products) => products.map((p) => p.id));

    if (approvedProductIds.length === 0) {
      return res.json({ bestSellers: [] });
    }

    const orderItems = await prisma.orderItem.findMany({
      where: { order: { status: { not: "cancelled" } }, productId: { in: approvedProductIds } },
      select: {
        productId: true,
        quantity: true,
        price: true,
        orderId: true,
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
            sellerId: true,
            createdAt: true,
            updatedAt: true,
            seller: { select: { id: true, name: true, image: true, username: true } },
          },
        },
      },
    });

    const map = new Map<string, { product: (typeof orderItems)[number]["product"]; unitsSold: number; revenue: number; orders: Set<string> }>();
    for (const it of orderItems) {
      if (!it.product) continue;
      const ex = map.get(it.productId);
      if (!ex) map.set(it.productId, { product: it.product, unitsSold: it.quantity, revenue: it.price * it.quantity, orders: new Set([it.orderId]) });
      else {
        ex.unitsSold += it.quantity;
        ex.revenue += it.price * it.quantity;
        ex.orders.add(it.orderId);
      }
    }

    let sorted = Array.from(map.values())
      .map((v) => ({ product: v.product, unitsSold: v.unitsSold, revenue: Math.round(v.revenue * 100) / 100, orders: v.orders.size }))
      .sort((a, b) => b.orders - a.orders || b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, limit);

    if (sorted.length === 0) {
      return res.json({ bestSellers: [] });
    }

    const productIds = sorted.map((s) => s.product!.id);
    const reviews = await prisma.review.findMany({ where: { productId: { in: productIds } }, select: { productId: true, rating: true } });
    const rMap = new Map<string, number[]>();
    for (const r of reviews) {
      const arr = rMap.get(r.productId) ?? [];
      arr.push(r.rating);
      rMap.set(r.productId, arr);
    }
    const ratingMap = new Map<string, { avg: number; total: number }>();
    for (const [pid, ratings] of rMap) {
      const total = ratings.length;
      const avg = total ? ratings.reduce((s, v) => s + v, 0) / total : 0;
      ratingMap.set(pid, { avg: Number(avg.toFixed(1)), total });
    }
    const enriched = sorted.map((s) => ({
      ...s,
      product: { ...s.product!, avgRating: ratingMap.get(s.product!.id)?.avg ?? 0, totalReviews: ratingMap.get(s.product!.id)?.total ?? 0 },
    }));

    return res.json({ bestSellers: enriched });
  } catch (e) {
    console.error("getBestSellers", e);
    return res.status(500).json({ error: "Failed to fetch best sellers" });
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const id = req.params.id as string;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { seller: { select: { id: true, name: true, image: true, username: true, approved: true } } },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (!product.seller?.approved) {
      return res.status(404).json({ error: "Product not found" });
    }

    const [reviews, orderItems] = await Promise.all([
      prisma.review.findMany({ where: { productId: id }, select: { rating: true } }),
      prisma.orderItem.findMany({ where: { productId: id, order: { status: { not: "cancelled" } } }, select: { orderId: true } }),
    ]);
    const totalReviews = reviews.length;
    const avgRating = totalReviews ? Number((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)) : 0;
    const unitsSold = new Set(orderItems.map((o) => o.orderId)).size;

    return res.json({ product: { ...product, avgRating, totalReviews, unitsSold } });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const id = req.params.id as string;
    const {
      name, description, price, discount, category, images,
      stock, sizes, colors, gender, status,
    } = req.body;

    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
    });

    if (!seller) {
      return res.status(404).json({ error: "Seller profile not found" });
    }

    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (existing.sellerId !== seller.id) {
      return res.status(403).json({ error: "Not authorized to update this product" });
    }

    if (existing.status === "rejected") {
      return res.status(403).json({ error: "This product has been rejected by an admin and cannot be edited. Please contact support for details." });
    }

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return res.status(400).json({ error: "Product name cannot be empty" });
    }

    if (price !== undefined && (typeof price !== "number" || price <= 0)) {
      return res.status(400).json({ error: "A valid price is required" });
    }

    if (discount !== undefined && (typeof discount !== "number" || discount < 0 || discount > 100)) {
      return res.status(400).json({ error: "Discount must be between 0 and 100" });
    }

    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(price !== undefined && { price }),
        ...(discount !== undefined && { discount }),
        ...(category !== undefined && { category }),
        ...(images !== undefined && { images }),
        ...(stock !== undefined && { stock }),
        ...(sizes !== undefined && { sizes }),
        ...(colors !== undefined && { colors }),
        ...(gender !== undefined && { gender: gender || null }),
        ...(status !== undefined && { status }),
      },
    });

    return res.json({ product });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const id = req.params.id as string;

    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
    });

    if (!seller) {
      return res.status(404).json({ error: "Seller profile not found" });
    }

    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (existing.sellerId !== seller.id) {
      return res.status(403).json({ error: "Not authorized to delete this product" });
    }

    if (existing.status === "rejected") {
      return res.status(403).json({ error: "This product has been rejected by an admin and cannot be deleted. Please contact support for details." });
    }

    const fileKeys = existing.images
      .map(extractFileKey)
      .filter((k): k is string => k !== null);

    if (fileKeys.length > 0) {
      await utapi.deleteFiles(fileKeys);
    }

    await prisma.product.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
