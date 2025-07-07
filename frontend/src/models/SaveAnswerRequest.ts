export interface SaveAnswerRequest {
    sessionId?: string;
    questionId: string;
    answerText: string;
    isSaved: boolean;
}
