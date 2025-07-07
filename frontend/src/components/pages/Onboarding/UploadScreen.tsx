import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useResume } from '../../contexts/ResumeContext';
import ResumeUploader from './ResumeUploader';
import ExperienceManager from './ExperienceManager';

interface UploadScreenProps {
  onComplete: () => void;
}

const UploadScreen: React.FC<UploadScreenProps> = ({ onComplete }) => {
  const { resumeData } = useResume();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Your Profile</h1>
          <p className="text-gray-600">
            Upload your resume to automatically detect your role and generate personalized interview questions
          </p>
        </div>

        <div className="space-y-8">
          {/* {isDevelopmentMode && <LocalConfigPanel />} */}
          <ResumeUploader />
          <ExperienceManager />

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">🤖 AI-Powered Role Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>• <strong>Google AI Analysis:</strong> Resume analyzed by Gemini AI to detect your role</li>
                <li>• <strong>Dynamic Questions:</strong> Role-specific questions generated and stored in database</li>
                <li>• <strong>STAR Method:</strong> Questions optimized for behavioral interview responses</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button 
            onClick={onComplete}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            disabled={!resumeData || !resumeData.inferredRole}
          >
            Complete Setup & Start Practicing
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          {resumeData && (
            <p className="text-sm text-green-600 mt-3">
              ✅ Resume analyzed{resumeData.inferredRole ? ` - Role: ${resumeData.inferredRole}` : ''} - Questions ready!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadScreen;
