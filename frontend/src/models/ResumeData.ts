import { InferredRole } from "./InferredRole";

export interface ResumeData {
  content: string;
  filename: string;
  uploadDate: Date;
  inferredRole?: InferredRole;
}
