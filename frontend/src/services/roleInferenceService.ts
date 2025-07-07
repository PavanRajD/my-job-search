import { InferredRole } from "../models/InferredRole";

export const roleInferenceApiClient = {
  async inferRole(resumeContent: string): Promise<InferredRole> {
    const res = await fetch(`/api/infer-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeContent }),
    });
    if (!res.ok) throw new Error("Failed to infer role");
    const data = await res.json();
    return data.inferredRole as InferredRole;
  },

  async getConfidenceLevel(
    resumeContent: string,
    inferredRole: InferredRole
  ): Promise<number> {
    const res = await fetch(`/api/confidence-level`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeContent, inferredRole }),
    });
    if (!res.ok) throw new Error("Failed to get confidence level");
    const data = await res.json();
    return data.confidence as number;
  },
};
