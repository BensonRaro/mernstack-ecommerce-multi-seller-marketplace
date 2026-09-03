# Seller's AI-Insight Page Implementation

## Goal

Build a Seller's AI-Insight page at `/seller/ai-insights` that provides two AI-powered features:

1. **Product Recommendations** - Advise sellers on which products to add to their store based on:
   - Their current product catalog and categories
   - Market trends and popular products
   - Their sales data and customer preferences

2. **Feedback Summary** - Summarize all feedback/reviews for the seller's products:
   - Key themes from customer reviews
   - Common praise and complaints
   - Actionable insights to improve products

Each insight is triggered by a button and streams results in real-time via SSE, powered by Inngest background jobs and Gemini AI.

## Tech Stack

- **AI**: Gemini AI API (`@google/genai` or REST API)
- **Background Jobs**: Inngest (existing setup)
- **Real-time Updates**: Server-Sent Events (SSE)
- **Database**: Prisma (MongoDB)
- **Frontend**: React Router framework mode + TanStack Query

---

## Affected Routes/Endpoints

### Backend

| Method | Endpoint                                   | Description                           |
| ------ | ------------------------------------------ | ------------------------------------- |
| POST   | `/api/seller/ai-insights/recommendations`  | Trigger product recommendations (SSE) |
| POST   | `/api/seller/ai-insights/feedback-summary` | Trigger feedback summary (SSE)        |

### Frontend

| Route                 | Component          | Description           |
| --------------------- | ------------------ | --------------------- |
| `/seller/ai-insights` | `SellerAiInsights` | Main AI insights page |

---

## Data Model Changes

None required. We'll use existing models:

- `Product` - seller's current products
- `Review` - customer feedback on products
- `ReviewComment` - replies to reviews
- `OrderItem` - sales data for recommendations

---

## Backend Implementation

### 1. Gemini AI Service

Create `backend/src/lib/gemini.ts`:

```typescript
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function streamProductRecommendations(data: {
  sellerProducts: Array<{ name: string; category: string; price: number }>;
  allCategories: string[];
  recentSales: Array<{ productName: string; quantity: number }>;
}): Promise<ReadableStream<string>> {
  const prompt = `Based on the seller's current products and sales data, recommend 5-8 product ideas they should add to their store. Consider:
  - Categories they already sell in
  - Price points that work for their audience
  - Trending products in ecommerce
  
  Current products: ${JSON.stringify(data.sellerProducts)}
  All available categories: ${data.allCategories.join(", ")}
  Recent sales: ${JSON.stringify(data.recentSales)}
  
  Provide recommendations as a numbered list with:
  1. Product name
  2. Suggested category
  3. Recommended price range
  4. Brief reasoning (why this product would sell well)`;

  const response = await genAI.models.generateContentStream({
    model: "gemini-3.5-flash-lite",
    contents: prompt,
  });

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        controller.enqueue(chunk.text || "");
      }
      controller.close();
    },
  });
}

export async function streamFeedbackSummary(
  reviews: Array<{
    rating: number;
    comment: string | null;
    productName: string;
  }>,
): Promise<ReadableStream<string>> {
  const prompt = `Summarize the following customer reviews for this seller's products. Provide:
  1. Overall sentiment (positive/neutral/negative percentage)
  2. Top 3 things customers love
  3. Top 3 areas for improvement
  4. Key themes and patterns
  5. Actionable recommendations

  Reviews: ${JSON.stringify(reviews)}`;

  const response = await genAI.models.generateContentStream({
    model: "gemini-3.5-flash-lite",
    contents: prompt,
  });

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        controller.enqueue(chunk.text || "");
      }
      controller.close();
    },
  });
}
```

### 2. Inngest Functions

Add to `backend/src/inngest/functions.ts`:

```typescript
import { inngest } from "./client";
import {
  streamProductRecommendations,
  streamFeedbackSummary,
} from "../lib/gemini";
import { prisma } from "../lib/prisma";

export const generateProductRecommendations = inngest.createFunction(
  { id: "generate-product-recommendations", retries: 2 },
  { event: "ai/product-recommendations" },
  async ({ event, step }) => {
    const { sellerId } = event.data;

    const sellerProducts = await step.run("fetch-seller-products", async () => {
      return prisma.product.findMany({
        where: { sellerId },
        select: { name: true, category: true, price: true },
      });
    });

    const allCategories = await step.run("fetch-categories", async () => {
      return [
        "fashion",
        "electronics",
        "beauty",
        "fitness",
        "home-decor",
        "accessories",
      ];
    });

    const recentSales = await step.run("fetch-recent-sales", async () => {
      const items = await prisma.orderItem.findMany({
        where: { sellerId },
        include: { product: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
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

    const stream = await streamProductRecommendations({
      sellerProducts,
      allCategories,
      recentSales,
    });

    const reader = stream.getReader();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += value;

      await step.run("stream-chunk", async () => {
        return { chunk: value, fullText };
      });
    }

    return { result: fullText, sellerId };
  },
);

export const generateFeedbackSummary = inngest.createFunction(
  { id: "generate-feedback-summary", retries: 2 },
  { event: "ai/feedback-summary" },
  async ({ event, step }) => {
    const { sellerId } = event.data;

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
      return { result: "No reviews found for your products yet.", sellerId };
    }

    const stream = await streamFeedbackSummary(reviews);

    const reader = stream.getReader();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += value;

      await step.run("stream-chunk", async () => {
        return { chunk: value, fullText };
      });
    }

    return { result: fullText, sellerId };
  },
);
```

Update `backend/src/inngest/index.ts` to export new functions.

### 3. SSE API Endpoints

Create `backend/src/routes/ai-insights.ts`:

```typescript
import { Router, Request, Response } from "express";
import { requireAuth } from "../middlewares/require-auth";
import { requireSeller } from "../middlewares/require-seller";
import { inngest } from "../inngest/client";
import { prisma } from "../lib/prisma";

const router = Router();

// SSE endpoint for product recommendations
router.post(
  "/recommendations",
  requireAuth,
  requireSeller,
  async (req: Request, res: Response) => {
    const session = (req as any).session;
    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
    });

    if (!seller) {
      return res.status(404).json({ error: "Seller profile not found" });
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Send initial event
    res.write("data: " + JSON.stringify({ type: "started" }) + "\n\n");

    // Trigger Inngest function
    const result = await inngest.send({
      name: "ai/product-recommendations",
      data: { sellerId: seller.id },
    });

    // Poll for result (simplified - in production use Inngest's streaming API)
    const pollInterval = setInterval(async () => {
      // Check if result is available
      // For now, we'll use a simpler approach with polling
    }, 1000);

    req.on("close", () => {
      clearInterval(pollInterval);
    });
  },
);

// SSE endpoint for feedback summary
router.post(
  "/feedback-summary",
  requireAuth,
  requireSeller,
  async (req: Request, res: Response) => {
    const session = (req as any).session;
    const seller = await prisma.seller.findUnique({
      where: { userId: session.user.id },
    });

    if (!seller) {
      return res.status(404).json({ error: "Seller profile not found" });
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Send initial event
    res.write("data: " + JSON.stringify({ type: "started" }) + "\n\n");

    // Trigger Inngest function
    await inngest.send({
      name: "ai/feedback-summary",
      data: { sellerId: seller.id },
    });
  },
);

export default router;
```

Mount in `server.ts`: `app.use("/api/seller/ai-insights", aiInsightsRoutes);`

---

## Frontend Implementation

### 1. API Client Extension

Add SSE helper to `frontend/app/lib/api.ts`:

```typescript
export function createSSEConnection(
  url: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void,
): () => void {
  const eventSource = new EventSource(`${API_BASE}${url}`, {
    withCredentials: true,
  });

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "chunk") {
      onChunk(data.content);
    } else if (data.type === "done") {
      onDone();
      eventSource.close();
    }
  };

  eventSource.onerror = (error) => {
    onError(new Error("SSE connection failed"));
    eventSource.close();
  };

  return () => eventSource.close();
}
```

### 2. AI Insights Hook

Create `frontend/app/hooks/use-ai-insights.ts`:

```typescript
import { useState, useCallback } from "react";
import { createSSEConnection } from "../lib/api";

export function useAiInsights() {
  const [recommendations, setRecommendations] = useState("");
  const [feedbackSummary, setFeedbackSummary] = useState("");
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] =
    useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  const generateRecommendations = useCallback(() => {
    setIsGeneratingRecommendations(true);
    setRecommendations("");

    const cleanup = createSSEConnection(
      "/api/seller/ai-insights/recommendations",
      (chunk) => setRecommendations((prev) => prev + chunk),
      () => setIsGeneratingRecommendations(false),
      () => setIsGeneratingRecommendations(false),
    );

    return cleanup;
  }, []);

  const generateFeedbackSummary = useCallback(() => {
    setIsGeneratingFeedback(true);
    setFeedbackSummary("");

    const cleanup = createSSEConnection(
      "/api/seller/ai-insights/feedback-summary",
      (chunk) => setFeedbackSummary((prev) => prev + chunk),
      () => setIsGeneratingFeedback(false),
      () => setIsGeneratingFeedback(false),
    );

    return cleanup;
  }, []);

  return {
    recommendations,
    feedbackSummary,
    isGeneratingRecommendations,
    isGeneratingFeedback,
    generateRecommendations,
    generateFeedbackSummary,
  };
}
```

### 3. AI Insights Page Component

Create `frontend/app/components/seller/seller-ai-insights.tsx`:

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Sparkles, MessageSquare, Loader2 } from "lucide-react";
import { useAiInsights } from "../../hooks/use-ai-insights";
import { cn } from "../../lib/utils";

export function SellerAiInsights() {
  const {
    recommendations,
    feedbackSummary,
    isGeneratingRecommendations,
    isGeneratingFeedback,
    generateRecommendations,
    generateFeedbackSummary,
  } = useAiInsights();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground">
          Get AI-powered recommendations and feedback analysis for your store.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Product Recommendations Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Product Recommendations
            </CardTitle>
            <CardDescription>
              Get AI suggestions on which products to add to your store based on
              your current catalog and market trends.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={generateRecommendations}
              disabled={isGeneratingRecommendations}
              className="w-full"
            >
              {isGeneratingRecommendations ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Recommendations
                </>
              )}
            </Button>

            {recommendations && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {recommendations}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feedback Summary
            </CardTitle>
            <CardDescription>
              Analyze customer reviews and get actionable insights to improve
              your products.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={generateFeedbackSummary}
              disabled={isGeneratingFeedback}
              variant="outline"
              className="w-full"
            >
              {isGeneratingFeedback ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Analyze Feedback
                </>
              )}
            </Button>

            {feedbackSummary && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                  {feedbackSummary}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### 4. Route File

Create `frontend/app/routes/seller/ai-insights.tsx`:

```tsx
import { SellerAiInsights } from "../../components/seller/seller-ai-insights";

export default function SellerAiInsightsPage() {
  return <SellerAiInsights />;
}
```

### 5. Update Routes Config

Add to `frontend/app/routes.ts` in the seller layout:

```typescript
route("ai-insights", "seller/ai-insights.tsx"),
```

---

## Edge Cases

1. **No seller products**: Show message "Add some products first to get AI recommendations"
2. **No reviews**: Show message "No customer reviews yet to analyze"
3. **SSE connection fails**: Show error toast and allow retry
4. **Gemini API errors**: Handle gracefully, show user-friendly error message
5. **Rate limiting**: Inngest handles retries (2 retries configured)
6. **Concurrent requests**: Disable button while generating to prevent multiple requests

---

## What "Done" Looks Like

- [ ] Seller can navigate to `/seller/ai-insights`
- [ ] Two cards displayed: Product Recommendations and Feedback Summary
- [ ] Clicking "Get Recommendations" triggers SSE and streams AI response in real-time
- [ ] Clicking "Analyze Feedback" triggers SSE and streams AI response in real-time
- [ ] Loading states shown while generating
- [ ] Results displayed in styled markdown format
- [ ] Error states handled gracefully
- [ ] Works for sellers with products and reviews
- [ ] Shows appropriate empty states for sellers with no data
- [ ] All TypeScript types correct
- [ ] No lint errors
