import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, User, Mic, Settings } from "lucide-react";
import PracticeQuestionsTab from "./PracticeQuestionsTab";
import EnhanceAnswersTab from "./EnhanceAnswersTab";
import ExpertAnswerTab from "./ExpertAnswerTab";

interface PracticeLibraryProps {
  onStartInterview?: () => void;
  onUpdateProfile?: () => void;
}

const PracticeLibrary: React.FC<PracticeLibraryProps> = ({
  onStartInterview,
  onUpdateProfile,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Answer Workshop
            </h1>
            <p className="text-gray-600">
              Build your library of behavioral interview responses
            </p>
          </div>

          {onUpdateProfile && (
            <Button
              variant="outline"
              onClick={onUpdateProfile}
              className="flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Update Profile
            </Button>
          )}
        </div>

        <Tabs defaultValue="practice" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="enhance" className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Enhance Answers
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center">
              <Mic className="w-4 h-4 mr-2" />
              Practice Questions
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              Expert Answer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enhance">
            <EnhanceAnswersTab />
          </TabsContent>

          <TabsContent value="practice">
            <PracticeQuestionsTab />
          </TabsContent>

          <TabsContent value="profile">
            <ExpertAnswerTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PracticeLibrary;
