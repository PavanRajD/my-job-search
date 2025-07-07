import { Question } from "@/models/question";
import { SuggestedAnswerRequest } from "@/models/SuggestedAnswerRequest";
import { SuggestedAnswerResponse } from "@/models/SuggestedAnswerResponse";

export const questionsApiClient = {
  async fetchQuestions(category?: string, limit?: number): Promise<Question[]> {
    const params = new URLSearchParams();
    if (category && category !== "All Categories")
      params.append("category", category);
    if (limit) params.append("limit", limit.toString());
    const res = await fetch(`/api/questions?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch questions");
    return await res.json();
  },

  async generateSuggestedAnswer(
    questionId: string,
    request?: SuggestedAnswerRequest
  ): Promise<SuggestedAnswerResponse> {
    const res = await fetch(
      `/api/questions/${encodeURIComponent(questionId)}/suggested-answer`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request || {}),
      }
    );
    if (!res.ok) throw new Error("Failed to generate suggested answer");
    return await res.json();
  },
};
