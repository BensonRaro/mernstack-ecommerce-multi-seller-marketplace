import { inngest } from "./client.js";
import {
  sendProductRejectedEmail,
  sendProductApprovedEmail,
  sendOrderStatusEmail,
  sendSellerApprovedEmail,
  sendSellerRejectedEmail,
  sendUserBannedEmail,
} from "../lib/emails.js";
import { prisma } from "../lib/prisma.js";
import {
  generateProductRecommendations,
  generateFeedbackSummary,
} from "../lib/gemini.js";

export const sendProductRejected = inngest.createFunction(
  { id: "send-product-rejected", retries: 3, triggers: [{ event: "app/product.rejected" }] },
  async ({ event, step }) => {
    await step.run("send-email", async () => {
      const data = event.data as { to: string; productName: string; reason: string };
      await sendProductRejectedEmail(data);
    });
  }
);

export const sendProductApproved = inngest.createFunction(
  { id: "send-product-approved", retries: 3, triggers: [{ event: "app/product.approved" }] },
  async ({ event, step }) => {
    await step.run("send-email", async () => {
      const data = event.data as { to: string; productName: string };
      await sendProductApprovedEmail(data);
    });
  }
);

export const sendOrderStatus = inngest.createFunction(
  { id: "send-order-status", retries: 3, triggers: [{ event: "app/order.status.changed" }] },
  async ({ event, step }) => {
    await step.run("send-email", async () => {
      const data = event.data as { to: string; buyerName: string; orderId: string; status: string };
      await sendOrderStatusEmail(data);
    });
  }
);

export const sendSellerApproved = inngest.createFunction(
  { id: "send-seller-approved", retries: 3, triggers: [{ event: "app/seller.approved" }] },
  async ({ event, step }) => {
    await step.run("send-email", async () => {
      const data = event.data as { to: string; sellerName: string };
      await sendSellerApprovedEmail(data);
    });
  }
);

export const sendSellerRejected = inngest.createFunction(
  { id: "send-seller-rejected", retries: 3, triggers: [{ event: "app/seller.rejected" }] },
  async ({ event, step }) => {
    await step.run("send-email", async () => {
      const data = event.data as { to: string; sellerName: string; reason?: string };
      await sendSellerRejectedEmail(data);
    });
  }
);

export const sendUserBanned = inngest.createFunction(
  { id: "send-user-banned", retries: 3, triggers: [{ event: "app/user.banned" }] },
  async ({ event, step }) => {
    await step.run("send-email", async () => {
      const data = event.data as { to: string; userName: string };
      await sendUserBannedEmail(data);
    });
  }
);

async function appendChunks(streamId: string, newChunks: string[]) {
  const stream = await prisma.aiInsightStream.findUnique({
    where: { id: streamId },
  });
  if (!stream) return;

  const existing = JSON.parse(stream.chunks) as string[];
  const updated = [...existing, ...newChunks];

  await prisma.aiInsightStream.update({
    where: { id: streamId },
    data: { chunks: JSON.stringify(updated) },
  });
}

async function completeStream(streamId: string, fullText: string) {
  const stream = await prisma.aiInsightStream.findUnique({
    where: { id: streamId },
  });
  if (!stream) return;

  await prisma.aiInsightStream.update({
    where: { id: streamId },
    data: { status: "complete", chunks: JSON.stringify([...JSON.parse(stream.chunks), ""]) },
  });

  await prisma.aiInsight.create({
    data: {
      sellerId: stream.sellerId,
      type: stream.type,
      content: fullText,
    },
  });
}

async function errorStream(streamId: string, error: string) {
  await prisma.aiInsightStream.update({
    where: { id: streamId },
    data: { status: "error", error },
  });
}

export const generateProductRecommendationsFn = inngest.createFunction(
  { id: "generate-product-recommendations", retries: 2, triggers: [{ event: "ai/product-recommendations" }] },
  async ({ event, step }) => {
    const { sellerId, streamId } = event.data as { sellerId: string; streamId: string };

    const sellerProducts = await step.run("fetch-seller-products", async () => {
      return prisma.product.findMany({
        where: { sellerId },
        select: { name: true, category: true, price: true },
      });
    });

    const allCategories = await step.run("fetch-categories", async () => {
      return ["fashion", "electronics", "beauty", "fitness", "home-decor", "accessories"];
    });

    const recentSales = await step.run("fetch-recent-sales", async () => {
      const items = await prisma.orderItem.findMany({
        where: { sellerId },
        include: { product: { select: { name: true } } },
        take: 50,
      });

      const salesMap = new Map<string, number>();
      for (const item of items) {
        const name = item.product.name;
        salesMap.set(name, (salesMap.get(name) || 0) + item.quantity);
      }

      return Array.from(salesMap.entries()).map(([productName, quantity]) => ({
        productName,
        quantity,
      }));
    });

    const fullText = await step.run("generate-recommendations", async () => {
      return generateProductRecommendations({
        sellerProducts,
        allCategories,
        recentSales,
      });
    });

    await step.run("stream-and-save", async () => {
      const words = fullText.split(" ");
      const batchSize = 5;

      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize).join(" ") + " ";
        await appendChunks(streamId, [batch]);
        await new Promise((r) => setTimeout(r, 50));
      }

      await completeStream(streamId, fullText);
    });

    return { sellerId, streamId };
  }
);

export const generateFeedbackSummaryFn = inngest.createFunction(
  { id: "generate-feedback-summary", retries: 2, triggers: [{ event: "ai/feedback-summary" }] },
  async ({ event, step }) => {
    const { sellerId, streamId } = event.data as { sellerId: string; streamId: string };

    const reviews = await step.run("fetch-seller-reviews", async () => {
      const sellerProducts = await prisma.product.findMany({
        where: { sellerId },
        select: { id: true, name: true },
      });

      const productIds = sellerProducts.map((p) => p.id);
      const productMap = new Map(sellerProducts.map((p) => [p.id, p.name]));

      const allReviews = await prisma.review.findMany({
        where: { productId: { in: productIds } },
        select: { rating: true, comment: true, productId: true },
      });

      return allReviews.map((r) => ({
        rating: r.rating,
        comment: r.comment,
        productName: productMap.get(r.productId) || "Unknown",
      }));
    });

    if (reviews.length === 0) {
      await step.run("no-reviews", async () => {
        await appendChunks(streamId, ["No reviews found for your products yet."]);
        await completeStream(streamId, "No reviews found for your products yet.");
      });
      return { sellerId, streamId };
    }

    const fullText = await step.run("generate-summary", async () => {
      return generateFeedbackSummary(reviews);
    });

    await step.run("stream-and-save", async () => {
      const words = fullText.split(" ");
      const batchSize = 5;

      for (let i = 0; i < words.length; i += batchSize) {
        const batch = words.slice(i, i + batchSize).join(" ") + " ";
        await appendChunks(streamId, [batch]);
        await new Promise((r) => setTimeout(r, 50));
      }

      await completeStream(streamId, fullText);
    });

    return { sellerId, streamId };
  }
);
