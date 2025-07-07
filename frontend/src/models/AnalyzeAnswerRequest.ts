// Service for analyzing answers (personalized STAR answer generation)
export interface AnalyzeAnswerRequest {
    question: string;
    answer: string;
    category: string;
    generateSuggestion?: boolean;
    personalContext?: string;
}
