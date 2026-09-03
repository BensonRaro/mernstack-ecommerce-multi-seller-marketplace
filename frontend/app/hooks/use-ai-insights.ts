import { useState, useCallback } from "react";
import { createSSEConnection, api } from "../lib/api";

export interface AiInsight {
  id: string;
  sellerId: string;
  type: string;
  content: string;
  createdAt: string;
}

export function useAiInsights() {
  const [recommendations, setRecommendations] = useState("");
  const [feedbackSummary, setFeedbackSummary] = useState("");
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] =
    useState(false);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<
    string | null
  >(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [savedInsights, setSavedInsights] = useState<AiInsight[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const fetchHistory = useCallback(async (type?: string) => {
    setIsLoadingHistory(true);
    try {
      const url = type
        ? `/api/seller/ai-insights/history?type=${type}`
        : "/api/seller/ai-insights/history";
      const data = await api.get<{ insights: AiInsight[] }>(url);
      setSavedInsights(data.insights);
    } catch {
      // ignore
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const generateRecommendations = useCallback(() => {
    setIsGeneratingRecommendations(true);
    setRecommendations("");
    setRecommendationsError(null);

    const cleanup = createSSEConnection(
      "/api/seller/ai-insights/recommendations",
      {
        onStart: () => {},
        onChunk: (chunk) => setRecommendations((prev) => prev + chunk),
        onDone: () => {
          setIsGeneratingRecommendations(false);
          fetchHistory("recommendations");
        },
        onError: (error) => {
          setIsGeneratingRecommendations(false);
          setRecommendationsError(error.message);
        },
      }
    );

    return cleanup;
  }, [fetchHistory]);

  const generateFeedbackSummary = useCallback(() => {
    setIsGeneratingFeedback(true);
    setFeedbackSummary("");
    setFeedbackError(null);

    const cleanup = createSSEConnection(
      "/api/seller/ai-insights/feedback-summary",
      {
        onStart: () => {},
        onChunk: (chunk) => setFeedbackSummary((prev) => prev + chunk),
        onDone: () => {
          setIsGeneratingFeedback(false);
          fetchHistory("feedback");
        },
        onError: (error) => {
          setIsGeneratingFeedback(false);
          setFeedbackError(error.message);
        },
      }
    );

    return cleanup;
  }, [fetchHistory]);

  return {
    recommendations,
    feedbackSummary,
    isGeneratingRecommendations,
    isGeneratingFeedback,
    recommendationsError,
    feedbackError,
    generateRecommendations,
    generateFeedbackSummary,
    savedInsights,
    isLoadingHistory,
    fetchHistory,
  };
}
