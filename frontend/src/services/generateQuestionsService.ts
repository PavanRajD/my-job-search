import { GeneratedQuestion } from "../models/GeneratedQuestion";

export const questionGenerationApiClient = {
  async generateQuestions(role: string): Promise<GeneratedQuestion[]> {
    const res = await fetch(`/api/generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error("Failed to generate questions");
    const data = await res.json();
    return data.questions;
  },

  async insertQuestions(questions: GeneratedQuestion[]): Promise<boolean> {
    const res = await fetch(`/api/insert-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions }),
    });
    if (!res.ok) throw new Error("Failed to insert questions");
    const data = await res.json();
    return !!data.success || !!data.received;
  },
};
