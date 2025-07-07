export const userDataApiClient = {
  async getValue(key: string): Promise<string | null> {
    const res = await fetch(`/api/user-meta/generic/${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.value ?? null;
  },

  async setValue(key: string, value: string): Promise<boolean> {
    const res = await fetch(`/api/user-meta`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    return res.ok;
  },

  async getAllExperiences(): Promise<{ [key: string]: string }> {
    const res = await fetch(`/api/user-meta/experiences`);
    if (!res.ok) return {};
    const data = await res.json();
    return data.experiences ?? {};
  },

  async addExperience(content: string): Promise<boolean> {
    const res = await fetch(`/api/user-meta/experience`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  },

  async removeExperience(experienceKey: string): Promise<boolean> {
    const res = await fetch(
      `/api/user-meta/experience/${encodeURIComponent(experienceKey)}`,
      {
        method: "DELETE",
      }
    );
    return res.ok;
  },

  async getCombinedContext(): Promise<string> {
    const res = await fetch(`/api/user-meta/combined-context`);
    if (!res.ok) return "";
    const data = await res.json();
    return data.combined ?? "";
  },

  async isOnboardingCompleted(): Promise<boolean> {
    const res = await fetch(`/api/user-meta/onboarding-completed`);
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.completed;
  },

  async completeOnboarding(): Promise<boolean> {
    const res = await fetch(`/api/user-meta/complete-onboarding`, {
      method: "POST",
    });
    return res.ok;
  },

  async clearAllData(): Promise<boolean> {
    const res = await fetch(`/api/user-meta/clear`, {
      method: "DELETE",
    });
    return res.ok;
  },
};
