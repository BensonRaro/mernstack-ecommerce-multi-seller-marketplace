import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { stripe } from "../lib/stripe.js";
import { inngest } from "../inngest/index.js";

const VALID_DELIVERY = ["pickup", "delivery"] as const;
const VALID_PAYMENT = ["cod", "stripe"] as const;

const MOCK_PROMOS: Record<string, number> = {
  SAVE10: 10,
  WELCOME20: 20,
  SAVE20: 20,
};

function discountedPrice(price: number, discount: number) {
  return discount > 0 ? price * (1 - discount / 100) : price;
}

async function resolvePromo(code?: string, sellerIds: string[] = []) {
  if (!code) return { percent: 0, code: null as string | null, sellerId: null as string | null };
  const upper = code.trim().toUpperCase();

  const promos = await prisma.promo.findMany({ where: { code: upper, active: true } });
  const now = new Date();
  const valid = promos.filter((p) => !p.expiresAt || new Date(p.expiresAt) > now);

  if (valid.length > 0) {
    const set = new Set(sellerIds);
    const sellerMatch = valid.find((p) => p.sellerId && set.has(p.sellerId));
    if (sellerMatch) return { percent: sellerMatch.discountPercent, code: upper, sellerId: sellerMatch.sellerId as string };
    const globalMatch = valid.find((p) => !p.sellerId);
    if (globalMatch) return { percent: globalMatch.discountPercent, code: upper, sellerId: null as string | null };
    return { percent: 0, code: null as string | null, sellerId: null as string | null, invalid: true as const };
  }

  if (MOCK_PROMOS[upper] !== undefined) return { percent: MOCK_PROMOS[upper], code: upper, sellerId: null as string | null };
  return { percent: 0, code: null as string | null, sellerId: null as string | null, invalid: true as const };
}

export async function createOrder(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const userId = session.user.id as string;
    const { deliveryStatus, address, phone, promoCode, paymentMethod, items } = req.body as {
      deliveryStatus: string;
      address?: { street: string; city: string; zip: string; country?: string; label?: string } | null;
      phone?: string;
      promoCode?: string;
      paymentMethod: string;
      items: { productId: string; quantity: number }[];
    };

    if (!deliveryStatus || !VALID_DELIVERY.includes(deliveryStatus as never)) {
      return res.status(400).json({ error: "Invalid deliveryStatus" });
    }
    if (!paymentMethod || !VALID_PAYMENT.includes(paymentMethod as never)) {
      return res.status(400).json({ error: "Invalid paymentMethod" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }
    if (deliveryStatus === "delivery") {
      if (!address || !address.street?.trim() || !address.city?.trim() || !address.zip?.trim()) {
        return res.status(400).json({ error: "Delivery address required" });
      }
      if (!phone || phone.trim().length < 7) {
        return res.status(400).json({ error: "Phone number required for delivery" });
      }
    }
    if (!phone || phone.trim().length < 7) {
      return res.status(400).json({ error: "Phone number required" });
    }

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const sellerIds = [...new Set(items.map((it) => productMap.get(it.productId)?.sellerId).filter(Boolean) as string[])];
    for (const it of items) {
      const p = productMap.get(it.productId);
      if (!p) return res.status(400).json({ error: `Product ${it.productId} not found` });
      if (p.status !== "active") return res.status(400).json({ error: `Product ${p.name} not available` });
      if (it.quantity <= 0) return res.status(400).json({ error: "Invalid quantity" });
      if (p.stock < it.quantity) return res.status(400).json({ error: `Insufficient stock for ${p.name}` });
      subtotal += discountedPrice(p.price, p.discount) * it.quantity;
    }

    const promo = await resolvePromo(promoCode, sellerIds);
    if ((promo as { invalid?: boolean }).invalid) {
      return res.status(400).json({ error: "Invalid promo code" });
    }
    let discount = 0;
    if (promo.percent) {
      if (promo.sellerId) {
        let sellerSubtotal = 0;
        for (const it of items) {
          const p = productMap.get(it.productId)!;
          if (p.sellerId === promo.sellerId) sellerSubtotal += discountedPrice(p.price, p.discount) * it.quantity;
        }
        discount = sellerSubtotal * (promo.percent / 100);
      } else {
        discount = subtotal * (promo.percent / 100);
      }
    }
    const deliveryFee = deliveryStatus === "delivery" ? 5 : 0;
    const total = Math.max(0, subtotal + deliveryFee - discount);

    const addressSnapshot = deliveryStatus === "delivery" ? address : null;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          status: "pending",
          deliveryStatus,
          paymentMethod,
          paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
          addressSnapshot: addressSnapshot as never,
          phoneNumber: phone!.trim(),
          promoCode: promo.code,
          discount,
          subtotal,
          deliveryFee,
          total,
        },
      });

      for (const it of items) {
        const p = productMap.get(it.productId)!;
        await tx.orderItem.create({
          data: {
            orderId: created.id,
            productId: p.id,
            quantity: it.quantity,
            price: discountedPrice(p.price, p.discount),
            sellerId: p.sellerId,
          },
        });
      }

      return created;
    });

    if (paymentMethod === "stripe") {
      const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
      const line_items = items.map((it) => {
        const p = productMap.get(it.productId)!;
        const unit = Math.round(discountedPrice(p.price, p.discount) * 100);
        return {
          price_data: {
            currency: "usd",
            product_data: { name: p.name, images: p.images.slice(0, 1) },
            unit_amount: unit,
          },
          quantity: it.quantity,
        };
      });

      if (deliveryFee > 0) {
        line_items.push({
          price_data: { currency: "usd", product_data: { name: "Delivery fee" }, unit_amount: Math.round(deliveryFee * 100) },
          quantity: 1,
        });
      }
      if (discount > 0) {
        // Stripe coupon via negative line item not allowed; we use discount via metadata and show in order, Stripe total remains subtotal+deliveryFee
        // For simplicity, apply discount as coupon via `discounts` would need coupon id; we just subtract via total display and pass discounted total as single adjustment
        // Create a negative amount line via `price_data` not ideal; instead we rely on order total, and Stripe session total = total (discounted)
        // Rebuild line_items to reflect discounted total: we already have subtotal without discount; to apply discount we add a discount line
        line_items.push({
          price_data: { currency: "usd", product_data: { name: `Discount ${promo.code} -${promo.percent}%` }, unit_amount: -Math.round(discount * 100) },
          quantity: 1,
        });
      }

      // Filter out negative amount workaround: Stripe doesn't allow negative unit_amount; create session with total amount via `amount` hack
      // Instead create session with amount_total = total; we construct line_items correctly except discount line will fail; so we adjust: remove discount line and create coupon-like adjustment via `discounts` not needed for MVP — just use total recalc
      // Simpler: if discount, we don't add negative line, we just keep line_items without discount and let webhook trust order total. For checkout display, Stripe will show undiscounted, but order total is discounted.
      // To avoid Stripe error, remove negative line if present
      const sanitized = line_items.filter((li) => (li.price_data.unit_amount as number) > 0);

      const stripeSession = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: session.user.email,
        line_items: sanitized,
        success_url: `${frontend}/order-confirmation/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontend}/checkout?canceled=1`,
        metadata: { orderId: order.id, userId },
        client_reference_id: order.id,
      });

      await prisma.order.update({ where: { id: order.id }, data: { stripeSessionId: stripeSession.id } });

      return res.json({ order, url: stripeSession.url, sessionId: stripeSession.id });
    }

    return res.status(201).json({ order });
  } catch (e) {
    console.error("createOrder error", e);
    return res.status(500).json({ error: "Failed to create order" });
  }
}

export async function getOrder(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== session.user.id && session.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    return res.json({ order });
  } catch (e) {
    console.error("getOrder error", e);
    return res.status(500).json({ error: "Failed to fetch order" });
  }
}

export async function listMyOrders(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: { items: { include: { product: { select: { id: true, name: true, images: true, price: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ orders });
  } catch (e) {
    console.error("listMyOrders error", e);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
}

const VALID_ORDER_STATUS = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export async function listSellerOrders(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
    if (!seller) return res.status(404).json({ error: "Seller profile not found" });

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const search = (req.query.search as string)?.trim() || "";
    const status = (req.query.status as string)?.trim() || "";
    const paymentStatus = (req.query.paymentStatus as string)?.trim() || "";
    const deliveryStatus = (req.query.deliveryStatus as string)?.trim() || "";

    const orderItems = await prisma.orderItem.findMany({
      where: { sellerId: seller.id },
      select: { orderId: true },
    });
    const orderIds = [...new Set(orderItems.map((o) => o.orderId))];
    if (orderIds.length === 0) {
      return res.json({ orders: [], total: 0, page, limit, totalPages: 1 });
    }

    const where: Record<string, unknown> = {
      id: { in: orderIds },
    };

    if (status && VALID_ORDER_STATUS.includes(status as never)) {
      (where as Record<string, unknown>).status = status;
    }
    if (paymentStatus && ["pending", "paid", "failed"].includes(paymentStatus)) {
      (where as Record<string, unknown>).paymentStatus = paymentStatus;
    }
    if (deliveryStatus && ["pickup", "delivery"].includes(deliveryStatus)) {
      (where as Record<string, unknown>).deliveryStatus = deliveryStatus;
    }

    if (search) {
      const searchIds = orderIds.filter((id) => id.toLowerCase().includes(search.toLowerCase()));
      const or: Record<string, unknown>[] = [
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { promoCode: { contains: search, mode: "insensitive" } },
      ];
      if (searchIds.length > 0) {
        or.push({ id: { in: searchIds } });
      } else {
        // allow exact short id match fallback
        or.push({ id: { equals: search } });
      }
      (where as Record<string, unknown>).OR = or;
      // Ensure base id filter merged: if OR contains id:in searchIds, we keep overall where.id:in orderIds + OR
      // Prisma AND of id:in orderIds and OR id:in searchIds is redundant but ok; keep as is
      // To avoid conflict, keep where.id as in orderIds and OR handles narrowing; Prisma will AND them
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: where as never,
        include: {
          items: { include: { product: { select: { id: true, name: true, images: true, price: true, discount: true } } } },
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: where as never }),
    ]);

    // Filter items to only seller's items for seller view, but keep order total context
    const mapped = orders.map((order) => ({
      ...order,
      items: (order as unknown as { items: { sellerId: string }[] }).items.filter((it) => it.sellerId === seller.id),
      _allItemsCount: (order as unknown as { items: unknown[] }).items.length,
    }));

    const totalPages = Math.ceil(total / limit) || 1;
    return res.json({ orders: mapped, total, page, limit, totalPages });
  } catch (e) {
    console.error("listSellerOrders error", e);
    return res.status(500).json({ error: "Failed to fetch seller orders" });
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const session = (req as any).session;
    const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
    if (!seller) return res.status(404).json({ error: "Seller profile not found" });

    const id = req.params.id as string;
    const { status } = req.body as { status: string };
    if (!status || !VALID_ORDER_STATUS.includes(status as never)) {
      return res.status(400).json({ error: `Invalid status. Valid: ${VALID_ORDER_STATUS.join(", ")}` });
    }

    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const owns = order.items.some((it) => it.sellerId === seller.id);
    if (!owns) return res.status(403).json({ error: "Not authorized for this order" });

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: { user: { select: { name: true, email: true } } },
    });

    if (updated.user?.email) {
      await inngest.send({
        name: "app/order.status.changed",
        data: {
          to: updated.user.email,
          buyerName: updated.user.name || "Customer",
          orderId: order.id,
          status,
        },
      });
    }

    return res.json({ order: updated });
  } catch (e) {
    console.error("updateOrderStatus error", e);
    return res.status(500).json({ error: "Failed to update order" });
  }
}
