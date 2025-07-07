import { AnalyzeAnswerRequest } from "@/models/AnalyzeAnswerRequest";
import { SaveAnswerRequest } from "@/models/SaveAnswerRequest";
import { SaveAnswerResponse } from "@/models/SaveAnswerResponse";
import { UserAnswerResponse } from "@/models/UserAnswerResponse";
import { AnalyzeAnswerResponse } from "@/models/AnalyzeAnswerResponse";
import { FeedbackResponse } from "@/models/FeedbackResponse";

export const answersApiClient = {
  async saveUserAnswer(
    request: SaveAnswerRequest
  ): Promise<SaveAnswerResponse> {
    const res = await fetch(`/api/user-answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error("Failed to save user answer");
    return await res.json();
  },

  async fetchUserAnswers(
    sessionId: string = "default_session",
    category?: string
  ): Promise<UserAnswerResponse[]> {
    const params = new URLSearchParams();
    params.append("sessionId", sessionId);
    if (category && category !== "All Categories")
      params.append("category", category);
    const res = await fetch(`/api/user-answers?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch user answers");
    const data = await res.json();
    // Ensure updatedAt is a Date object
    return data.map((answer: any) => ({
      ...answer,
      updatedAt: new Date(answer.updatedAt),
    }));
  },

  async generatePersonalizedAnswer(
    request: AnalyzeAnswerRequest
  ): Promise<AnalyzeAnswerResponse> {
    const res = await fetch("/api/generate-personalized-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error("Failed to analyze answer");
    return await res.json();
  },

  async analyzeAnswer(
    request: AnalyzeAnswerRequest
  ): Promise<FeedbackResponse> {
    const res = await fetch("/api/analyze-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error("Failed to analyze answer");
    return await res.json();
  },
};
