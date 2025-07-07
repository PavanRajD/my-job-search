import { FeedbackScore } from "./FeedbackScore";

export interface FeedbackResponse {
  structure: FeedbackScore;
  clarity: FeedbackScore;
  tone: FeedbackScore;
  impact: FeedbackScore;
  overall: string;
  improvedExample: string;
}
