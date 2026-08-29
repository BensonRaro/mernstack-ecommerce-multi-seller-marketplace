import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import type { Request, Response } from "express";

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
      return res.status(403).json({ error: "Seller account not yet approved" });
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
    }

    if (sellerIdParam) {
      (where as any).sellerId = sellerIdParam;
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

    const totalPages = Math.ceil(total / limit) || 1;

    return res.json({ products, total, page, limit, totalPages });
  } catch (error) {
    console.error("Error listing products:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getBestSellers(req: Request, res: Response) {
  try {
    const limit = Math.min(12, Math.max(1, parseInt(req.query.limit as string) || 6));
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { status: { not: "cancelled" } } },
      select: {
        productId: true,
        quantity: true,
        price: true,
        orderId: true,
        product: { select: { id: true, name: true, images: true, price: true, discount: true, category: true, stock: true, sizes: true, colors: true, sellerId: true, createdAt: true, updatedAt: true, seller: { select: { id: true, name: true, image: true, username: true } } } },
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

    const sorted = Array.from(map.values())
      .map((v) => ({ product: v.product, unitsSold: v.unitsSold, revenue: Math.round(v.revenue * 100) / 100, orders: v.orders.size }))
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, limit);

    if (sorted.length === 0) {
      const fallback = await prisma.product.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { seller: { select: { id: true, name: true, image: true, username: true } } },
      });
      return res.json({ bestSellers: fallback.map((p) => ({ product: p, unitsSold: 0, revenue: 0, orders: 0 })) });
    }

    return res.json({ bestSellers: sorted });
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
      include: { seller: { select: { id: true, name: true, image: true, username: true } } },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({ product });
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

    await prisma.product.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
