export const resumeParserService = {
  async parseDocument(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/parse-document", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to parse document");
    }

    return response.json();
  },
};
