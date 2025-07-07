import React, { useState, useEffect } from "react";
import { useResume } from "../contexts/ResumeContext";
import { userDataApiClient } from "@/services/userOnboardingService";
import UploadScreen from "./Onboarding/UploadScreen";
import PracticeLibrary from "./Behavioural/PracticeLibrary";

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<
    "upload" | "workshop" | "interview"
  >("upload");
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<
    boolean | null
  >(null);
  const { resumeData, getCombinedExperience } = useResume();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const completed = await userDataApiClient.isOnboardingCompleted();
      setIsOnboardingComplete(completed);

      // If onboarding is complete, go directly to workshop
      if (completed) {
        setCurrentScreen("workshop");
      }
    };

    checkOnboardingStatus();
  }, []);

  const handleOnboardingComplete = async () => {
    await userDataApiClient.completeOnboarding();
    setIsOnboardingComplete(true);
    setCurrentScreen("workshop");
  };

  const handleStartInterview = async () => {
    const combinedData = await getCombinedExperience();
    if (!combinedData.trim()) {
      setCurrentScreen("upload");
      return;
    }
    setCurrentScreen("interview");
  };
  
  if (currentScreen === "upload") {
    return <UploadScreen onComplete={handleOnboardingComplete} />;
  }

  if (currentScreen === "workshop") {
    return (
      <PracticeLibrary
        onStartInterview={handleStartInterview}
        onUpdateProfile={() => setCurrentScreen("upload")}
      />
    );
  }

  return null;
};

export default Index;
