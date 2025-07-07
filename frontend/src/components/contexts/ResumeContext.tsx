import React, { createContext, useContext, useState, useEffect } from "react";
import { userDataApiClient } from "@/services/userOnboardingService";
import { roleInferenceApiClient } from "@/services/roleInferenceService";
import { questionGenerationApiClient } from "@/services/generateQuestionsService";
import { ResumeData } from "@/models/ResumeData";
import { InferredRole } from "@/models/InferredRole";

interface ResumeContextType {
  resumeData: ResumeData | null;
  experiences: { [key: string]: string };
  inferredRole: InferredRole | null;
  setResumeData: (data: ResumeData | null) => void;
  addExperience: (content: string) => Promise<boolean>;
  removeExperience: (experienceKey: string) => Promise<boolean>;
  getCombinedExperience: () => Promise<string>;
  clearAllData: () => Promise<void>;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const useResume = () => {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error("useResume must be used within a ResumeProvider");
  }
  return context;
};

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [resumeData, setResumeDataState] = useState<ResumeData | null>(null);
  const [experiences, setExperiences] = useState<{ [key: string]: string }>({});
  const [inferredRole, setInferredRole] = useState<InferredRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [resumeContent, resumeFilename, experiencesData, storedRole] =
        await Promise.all([
          userDataApiClient.getValue("resume_content"),
          userDataApiClient.getValue("resume_filename"),
          userDataApiClient.getAllExperiences(),
          userDataApiClient.getValue("inferred_role"),
        ]);

      if (resumeContent) {
        const role = (storedRole as InferredRole) || null;
        setResumeDataState({
          content: resumeContent,
          filename: resumeFilename || "Uploaded Resume",
          uploadDate: new Date(),
          inferredRole: role,
        });
        setInferredRole(role);
      } else {
        setResumeDataState(null);
        setInferredRole(null);
      }

      setExperiences(experiencesData);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, []);

  const setResumeData = async (data: ResumeData | null) => {
    setResumeDataState(data);

    if (data) {
      try {
        setIsLoading(true);

        // Use Google AI to infer role from resume content
        console.log("Analyzing resume with Google AI...");
        const role = await roleInferenceApiClient.inferRole(data.content);
        const confidence = await roleInferenceApiClient.getConfidenceLevel(
          data.content,
          role
        );

        console.log(
          `Inferred role: ${role} (confidence: ${(confidence * 100).toFixed(
            1
          )}%)`
        );

        // Store resume data
        await userDataApiClient.setValue("resume_content", data.content);
        await userDataApiClient.setValue("resume_filename", data.filename);
        await userDataApiClient.setValue("inferred_role", role);

        // Generate role-specific questions using Google AI and insert into database
        console.log("Generating questions for role:", role);
        const questions = await questionGenerationApiClient.generateQuestions(
          role
        );

        if (questions.length > 0) {
          console.log(
            `Generated ${questions.length} questions, inserting into database...`
          );
          await questionGenerationApiClient.insertQuestions(questions);
          console.log("Questions successfully inserted into database");
        }

        // Update state
        setInferredRole(role);
        data.inferredRole = role;
      } catch (error) {
        console.error("Error processing resume with Google AI:", error);
        // Fallback to basic storage without AI processing
        await userDataApiClient.setValue("resume_content", data.content);
        await userDataApiClient.setValue("resume_filename", data.filename);
      } finally {
        setIsLoading(false);
      }
    } else {
      await userDataApiClient.setValue("resume_content", "");
      await userDataApiClient.setValue("resume_filename", "");
      await userDataApiClient.setValue("inferred_role", "");
      setInferredRole(null);
    }
  };

  const addExperience = async (content: string): Promise<boolean> => {
    const success = await userDataApiClient.addExperience(content);
    if (success) {
      await refreshData(); // Refresh to get updated experiences
    }
    return success;
  };

  const removeExperience = async (experienceKey: string): Promise<boolean> => {
    const success = await userDataApiClient.removeExperience(experienceKey);
    if (success) {
      await refreshData(); // Refresh to get updated experiences
    }
    return success;
  };

  const getCombinedExperience = async (): Promise<string> => {
    return await userDataApiClient.getCombinedContext();
  };

  const clearAllData = async (): Promise<void> => {
    await userDataApiClient.clearAllData();
    await refreshData();
  };

  return (
    <ResumeContext.Provider
      value={{
        resumeData,
        experiences,
        inferredRole,
        setResumeData,
        addExperience,
        removeExperience,
        getCombinedExperience,
        clearAllData,
        isLoading,
        refreshData,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};
