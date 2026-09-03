const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  parts?: GeminiPart[];
  role?: string;
}

interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
  index?: number;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: unknown;
  usageMetadata?: unknown;
}

async function generateContent(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as GeminiResponse;

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error(`Gemini returned empty response: ${JSON.stringify(data)}`);
  }

  return text;
}

export async function generateProductRecommendations(data: {
  sellerProducts: Array<{ name: string; category: string; price: number }>;
  allCategories: string[];
  recentSales: Array<{ productName: string; quantity: number }>;
}): Promise<string> {
  const productList =
    data.sellerProducts.length > 0
      ? data.sellerProducts
          .map((p) => `- ${p.name} (${p.category}) - $${p.price}`)
          .join("\n")
      : "No products yet";

  const salesList =
    data.recentSales.length > 0
      ? data.recentSales
          .map((s) => `- ${s.productName}: ${s.quantity} sold`)
          .join("\n")
      : "No sales data yet";

  const prompt = `You are an ecommerce business advisor. Based on the seller's current products and sales data, recommend 5-8 product ideas they should add to their store.

Current products:
${productList}

Available categories: ${data.allCategories.join(", ")}

Recent sales:
${salesList}

Provide your recommendations as a numbered list. For each recommendation include:
1. Product name
2. Suggested category
3. Recommended price range (e.g. $20-$40)
4. Brief reasoning (1-2 sentences on why this would sell well)

Be specific and actionable.`;

  return generateContent(prompt);
}

export async function generateFeedbackSummary(
  reviews: Array<{
    rating: number;
    comment: string | null;
    productName: string;
  }>,
): Promise<string> {
  const reviewList = reviews
    .map(
      (r) =>
        `- ${r.productName}: ${r.rating}/5 stars${r.comment ? ` — "${r.comment}"` : " (no comment)"}`,
    )
    .join("\n");

  const prompt = `You are an ecommerce business analyst. Summarize the following customer reviews for this seller's products.

Reviews:
${reviewList}

Provide your analysis in this format:

**Overall Sentiment**
Estimate the percentage of positive, neutral, and negative feedback.

**Top Things Customers Love**
List the top 3 positive themes.

**Areas for Improvement**
List the top 3 things to improve.

**Key Patterns**
Note any recurring themes or patterns.

**Actionable Recommendations**
Give 3-5 specific things the seller should do based on this feedback.`;

  return generateContent(prompt);
}
