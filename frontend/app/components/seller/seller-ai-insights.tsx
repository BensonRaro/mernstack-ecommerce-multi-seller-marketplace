import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { Alert } from "../ui/alert";
import { Badge } from "../ui/badge";
import { useAiInsights, type AiInsight } from "../../hooks/use-ai-insights";

function InsightCard({ insight }: { insight: AiInsight }) {
  return (
    <div className="rounded-lg border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant={insight.type === "recommendations" ? "default" : "secondary"}>
          {insight.type === "recommendations" ? "Product Recommendations" : "Feedback Summary"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {new Date(insight.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <Markdown remarkPlugins={[remarkGfm]}>{insight.content}</Markdown>
      </div>
    </div>
  );
}

export function SellerAiInsights() {
  const {
    recommendations,
    feedbackSummary,
    isGeneratingRecommendations,
    isGeneratingFeedback,
    recommendationsError,
    feedbackError,
    generateRecommendations,
    generateFeedbackSummary,
    savedInsights,
    fetchHistory,
  } = useAiInsights();

  const [activeTab, setActiveTab] = useState<"all" | "recommendations" | "feedback">("all");

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredInsights = savedInsights.filter((insight) => {
    if (activeTab === "all") return true;
    return insight.type === activeTab;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground">
          Get AI-powered recommendations and feedback analysis for your store.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Recommendations</CardTitle>
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
                  <Spinner className="mr-2 size-4" />
                  Generating...
                </>
              ) : (
                "Get Recommendations"
              )}
            </Button>

            {recommendationsError && (
              <Alert variant="destructive">{recommendationsError}</Alert>
            )}

            {recommendations && (
              <div className="mt-4 rounded-lg bg-muted p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Markdown remarkPlugins={[remarkGfm]}>{recommendations}</Markdown>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback Summary</CardTitle>
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
                  <Spinner className="mr-2 size-4" />
                  Analyzing...
                </>
              ) : (
                "Analyze Feedback"
              )}
            </Button>

            {feedbackError && (
              <Alert variant="destructive">{feedbackError}</Alert>
            )}

            {feedbackSummary && (
              <div className="mt-4 rounded-lg bg-muted p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Markdown remarkPlugins={[remarkGfm]}>{feedbackSummary}</Markdown>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Insight History</CardTitle>
              <CardDescription>
                Your previously generated AI insights.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("all")}
              >
                All
              </Button>
              <Button
                variant={activeTab === "recommendations" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("recommendations")}
              >
                Recommendations
              </Button>
              <Button
                variant={activeTab === "feedback" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("feedback")}
              >
                Feedback
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredInsights.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No insights generated yet. Use the buttons above to generate your first insight.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredInsights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
