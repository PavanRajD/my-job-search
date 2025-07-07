import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader, CheckCircle, X } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { useResume } from "../../contexts/ResumeContext";
import { resumeParserService } from "@/services/resumeParserService";

interface ResumeUploaderProps {
  showTitle?: boolean;
  compact?: boolean;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  showTitle = true,
  compact = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tempResumeText, setTempResumeText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { resumeData, setResumeData } = useResume();
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (
      !file.type.includes("text") &&
      !file.name.toLowerCase().endsWith(".txt") &&
      !file.name.toLowerCase().endsWith(".docx") &&
      !file.name.toLowerCase().endsWith(".pdf") &&
      !file.name.toLowerCase().endsWith(".doc")
    ) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a TXT, DOCX, PDF, or DOC file.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await resumeParserService.parseDocument(file);

      setResumeData({
        content: response.content,
        filename: response.filename,
        uploadDate: new Date(),
      });

      toast({
        title: "Resume uploaded successfully",
        description: `${response.filename} has been processed and saved.`,
      });
    } catch (error) {
      console.error("File parsing error:", error);
      toast({
        title: "Upload failed",
        description:
          "Unable to parse the file. Please try again or paste your resume text manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleManualSave = () => {
    if (!tempResumeText.trim()) {
      toast({
        title: "No content to save",
        description: "Please enter your resume content.",
        variant: "destructive",
      });
      return;
    }

    setResumeData({
      content: tempResumeText,
      filename: "Manual Entry",
      uploadDate: new Date(),
    });

    setIsEditing(false);
    setTempResumeText("");

    toast({
      title: "Resume saved",
      description: "Your resume has been saved successfully.",
    });
  };

  const handleEdit = () => {
    setTempResumeText(resumeData?.content || "");
    setIsEditing(true);
  };

  const handleRemove = () => {
    setResumeData(null);
    setTempResumeText("");
    setIsEditing(false);
    toast({
      title: "Resume removed",
      description: "Your resume has been removed from the system.",
    });
  };

  if (compact && resumeData && !isEditing) {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900">
            Resume: {resumeData.filename}
          </p>
          <p className="text-xs text-green-600">
            Uploaded {resumeData.uploadDate.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={compact ? "border-0 shadow-sm" : ""}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            {resumeData ? "Your Resume" : "Upload Resume"}
          </CardTitle>
          <CardDescription>
            {resumeData
              ? "Your resume is uploaded and available throughout the app"
              : "Upload once and use everywhere in the application"}
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {resumeData && !isEditing ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-green-900">
                    ✅ Resume Uploaded
                  </h4>
                  <p className="text-sm text-green-700">
                    File: {resumeData.filename}
                  </p>
                  <p className="text-xs text-green-600">
                    Uploaded: {resumeData.uploadDate.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRemove}>
                    Remove
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 Your resume is now available for generating personalized
                interview answers across the application.
              </p>
            </div>
          </div>
        ) : (
          <>
            {!isEditing && (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                } ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {isProcessing ? (
                  <>
                    <Loader className="w-8 h-8 mx-auto mb-2 text-blue-500 animate-spin" />
                    <p className="text-sm text-blue-600 mb-2">
                      Processing your resume...
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop your resume here, or
                    </p>
                    <label className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>Choose File</span>
                      </Button>
                      <input
                        type="file"
                        accept=".txt,.doc,.docx,.pdf"
                        onChange={handleFileInput}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      TXT, DOCX, PDF, DOC supported
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="manual-resume">
                  {isEditing
                    ? "Edit Resume Content"
                    : "Or paste your resume text"}
                </Label>
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Manual Entry
                  </Button>
                )}
              </div>

              {(isEditing || !resumeData) && (
                <>
                  <Textarea
                    id="manual-resume"
                    placeholder="Paste your resume content here..."
                    value={tempResumeText}
                    onChange={(e) => setTempResumeText(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    disabled={isProcessing}
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={handleManualSave}
                      disabled={!tempResumeText.trim()}
                    >
                      Save Resume
                    </Button>
                    {isEditing && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setTempResumeText("");
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumeUploader;
