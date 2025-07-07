import { ProgressResponse } from "../models/ProgressResponse";

export const progressApiClient = {
  async fetchUserProgress(
    sessionId: string = "default_session"
  ): Promise<ProgressResponse> {
    const res = await fetch(`/api/progress/${encodeURIComponent(sessionId)}`);
    if (!res.ok) throw new Error("Failed to fetch user progress");
    return await res.json();
  },
};
