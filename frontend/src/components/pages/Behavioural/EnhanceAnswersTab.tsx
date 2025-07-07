import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Save,
  Edit3,
  RefreshCw,
  CheckCircle,
  Circle,
  Shuffle,
  Download,
  Target,
  ChevronDown,
  MessageSquare,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Question } from "@/models/question";
import { useResume } from "../../contexts/ResumeContext";
import { useToast } from "../../hooks/use-toast";
import { questionsApiClient } from "@/services/behaviouralQuestionService";
import { answersApiClient } from "@/services/answersService";
import { progressApiClient } from "@/services/progressService";
import { ProgressResponse } from "@/models/ProgressResponse";

interface SavedAnswer {
  questionId: string;
  userAnswer?: string;
  suggestedAnswer?: string;
  isSaved: boolean;
  timestamp: Date;
  category: string;
}

const BEHAVIORAL_CATEGORIES = [
  "All Categories",
  "Leadership",
  "Conflict Resolution",
  "Teamwork",
  "Problem Solving",
  "Adaptability",
  "Communication",
  "Time Management",
  "Decision Making",
  "Stress Management",
  "Creativity and Innovation",
];

const EnhanceAnswersTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState<Map<string, SavedAnswer>>(
    new Map()
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [suggestedAnswers, setSuggestedAnswers] = useState<Map<string, string>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressResponse>({
    totalQuestions: 0,
    savedAnswers: 0,
    categoriesCovered: [],
  });
  const [usePersonalExperience, setUsePersonalExperience] = useState(true);
  const { resumeData, getCombinedExperience, experiences } = useResume();
  const { toast } = useToast();

  const currentSessionId = "default_session";
  const progressPercentage =
    progress.totalQuestions > 0
      ? (progress.savedAnswers / progress.totalQuestions) * 100
      : 0;

  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        const fetchedQuestions = await questionsApiClient.fetchQuestions(
          selectedCategory === "All Categories" ? undefined : selectedCategory
        );
        setQuestions(fetchedQuestions);
        setCurrentQuestionIndex(0);
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast({
          title: "Error",
          description: "Failed to load questions. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [selectedCategory, toast]);

  useEffect(() => {
    const loadSavedAnswers = async () => {
      try {
        const userAnswers = await answersApiClient.fetchUserAnswers(
          currentSessionId
        );
        const answersMap = new Map<string, SavedAnswer>();

        userAnswers.forEach((answer) => {
          answersMap.set(answer.questionId, {
            questionId: answer.questionId,
            userAnswer: answer.answerText,
            isSaved: true,
            timestamp: answer.updatedAt,
            category: answer.category,
          });
        });

        setSavedAnswers(answersMap);
      } catch (error) {
        console.error("Error loading saved answers:", error);
      }
    };

    loadSavedAnswers();
  }, [currentSessionId]);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const userProgress = await progressApiClient.fetchUserProgress(
          currentSessionId
        );
        setProgress(userProgress);
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    };

    loadProgress();
  }, [currentSessionId, savedAnswers]);

  const currentQuestion = questions[currentQuestionIndex];
  const savedAnswer = currentQuestion
    ? savedAnswers.get(currentQuestion.id)
    : undefined;
  const hasPersonalData = resumeData || Object.keys(experiences).length > 0;

  const handleExportAnswers = () => {
    const exportData = {
      totalSaved: progress.savedAnswers,
      exportDate: new Date().toISOString(),
      answers: Array.from(savedAnswers.entries()).map(
        ([questionId, answer]) => {
          const question = questions.find((q) => q.id === questionId);
          return {
            question: question?.text || "Question not found",
            category: answer.category,
            answer: answer.userAnswer || answer.suggestedAnswer || "",
            savedDate: answer.timestamp,
          };
        }
      ),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `interview-answers-${
      new Date().toISOString().split("T")[0]
    }.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toast({
      title: "✅ Export Complete",
      description: "Your interview answers have been exported successfully.",
    });
  };

  const handleLoadSuggestedAnswer = async (forceRegerate = false) => {
    if (!currentQuestion) {
      return;
    }

    if (!forceRegerate && savedAnswers.has(currentQuestion.id)) {
      setSuggestedAnswers(
        (prev) =>
          new Map([
            ...prev,
            [
              currentQuestion.id,
              savedAnswers.get(currentQuestion.id)?.userAnswer,
            ],
          ])
      );
      setIsEditing(false);
      return;
    }

    if (suggestedAnswers.has(currentQuestion.id)) {
      setSuggestedAnswers((prev) => {
        const newMap = new Map(prev);
        newMap.delete(currentQuestion.id);
        return newMap;
      });
    }

    setIsLoading(true);
    try {
      let response;

      if (usePersonalExperience && resumeData) {
        const combinedContext = await getCombinedExperience();
        response = await answersApiClient.generatePersonalizedAnswer({
          question: currentQuestion.text,
          answer: "",
          category: currentQuestion.category,
          generateSuggestion: true,
          personalContext: combinedContext,
        });
      } else {
        response = await questionsApiClient.generateSuggestedAnswer(
          currentQuestion.id
        );
      }

      setSuggestedAnswers(
        (prev) =>
          new Map([...prev, [currentQuestion.id, response.suggestedAnswer]])
      );
    } catch (error) {
      console.error("Error generating suggested answer:", error);
      toast({
        title: "Error",
        description: "Failed to generate suggested answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentQuestion) {
      handleLoadSuggestedAnswer();
    }
  }, [currentQuestion, usePersonalExperience]);

  const handleSaveSuggestedAnswer = async () => {
    if (!currentQuestion) return;

    const suggested = suggestedAnswers.get(currentQuestion.id);
    if (!suggested) return;

    try {
      await answersApiClient.saveUserAnswer({
        sessionId: currentSessionId,
        questionId: currentQuestion.id,
        answerText: suggested,
        isSaved: true,
      });

      const answerData: SavedAnswer = {
        questionId: currentQuestion.id,
        suggestedAnswer: suggested,
        isSaved: true,
        timestamp: new Date(),
        category: currentQuestion.category,
      };

      setSavedAnswers(
        (prev) => new Map([...prev, [currentQuestion.id, answerData]])
      );

      toast({
        title: "✅ Answer saved!",
        description: "Suggested answer has been saved to your library.",
      });
    } catch (error) {
      console.error("Error saving answer:", error);
      toast({
        title: "Error",
        description: "Failed to save answer. Please try again.",
      });
    }
  };

  const handleSaveMyAnswer = async () => {
    if (!userAnswer.trim() || !currentQuestion) return;

    try {
      await answersApiClient.saveUserAnswer({
        sessionId: currentSessionId,
        questionId: currentQuestion.id,
        answerText: userAnswer,
        isSaved: true,
      });

      const answerData: SavedAnswer = {
        questionId: currentQuestion.id,
        userAnswer: userAnswer,
        isSaved: true,
        timestamp: new Date(),
        category: currentQuestion.category,
      };

      setSavedAnswers(
        (prev) => new Map([...prev, [currentQuestion.id, answerData]])
      );
      setSuggestedAnswers(
        (prev) =>
          new Map([
            ...prev,
            [
              currentQuestion.id,
              userAnswer,
            ],
          ])
      );
      setIsEditing(false);
      setUserAnswer("");

      toast({
        title: "✅ Your answer saved!",
        description: "Your custom answer has been saved to your library.",
      });
    } catch (error) {
      console.error("Error saving answer:", error);
      toast({
        title: "Error",
        description: "Failed to save answer. Please try again.",
      });
    }
  };

  const handleWriteMyOwn = () => {
    setIsEditing(true);
    setUserAnswer(savedAnswer?.userAnswer || "");
  };

  const handleEditSuggested = () => {
    if (!currentQuestion) return;

    const suggested = suggestedAnswers.get(currentQuestion.id);
    if (suggested) {
      setIsEditing(true);
      setUserAnswer(suggested);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setCurrentQuestionIndex(0);
    }
    setIsEditing(false);
    setUserAnswer("");
  };

  const handleRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * questions.length);
    setCurrentQuestionIndex(randomIndex);
    setIsEditing(false);
    setUserAnswer("");
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setIsEditing(false);
    setUserAnswer("");
  };

  if (isLoading && questions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-2" />
        <p className="text-gray-600">Loading questions...</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          No questions available for this category.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Tracker */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Your Progress
            </span>
            <Button variant="outline" size="sm" onClick={handleExportAnswers}>
              <Download className="w-4 h-4 mr-2" />
              Export Library
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                You've saved {progress.savedAnswers} of{" "}
                {progress.totalQuestions} question types
              </span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Controls Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Category Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedCategory}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {BEHAVIORAL_CATEGORIES.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => handleCategoryChange(category)}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>

          {hasPersonalData && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Answer Generation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    onClick={() =>
                      setUsePersonalExperience(!usePersonalExperience)
                    }
                    variant={usePersonalExperience ? "default" : "outline"}
                    className="w-full"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {usePersonalExperience
                      ? "Using Your Profile"
                      : "Use Your Profile"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleRandomQuestion}
                variant="outline"
                className="w-full"
                disabled={questions.length === 0}
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Surprise Me
              </Button>
              <Button
                onClick={handleNextQuestion}
                variant="outline"
                className="w-full"
                disabled={questions.length === 0}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Next Question
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Workshop Area */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-xl">
                    {savedAnswers.has(currentQuestion.id) ? (
                      <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 mr-2 text-gray-400" />
                    )}
                    {currentQuestion.category}
                  </CardTitle>
                  <div className="flex items-center mt-1">
                    <CardDescription>
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </CardDescription>
                    {usePersonalExperience && hasPersonalData && (
                      <Badge variant="secondary" className="ml-2">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Personalized
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge
                  variant={
                    savedAnswers.has(currentQuestion.id)
                      ? "default"
                      : "secondary"
                  }
                >
                  {savedAnswers.has(currentQuestion.id) ? "Saved" : "New"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Question Display */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6 border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  {currentQuestion.text}
                </h3>
              </div>

              {!isEditing ? (
                <div className="space-y-6">
                  {/* Suggested Answer Box */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      {usePersonalExperience && hasPersonalData
                        ? "Personalized Answer (Based on Your Profile)"
                        : "AI-Generated Answer (STAR Format)"}
                    </h4>
                    <div className="bg-gray-50 p-6 rounded-lg border">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                          <span className="text-gray-600">
                            {usePersonalExperience
                              ? "Creating personalized answer..."
                              : "Generating answer..."}
                          </span>
                        </div>
                      ) : (
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                          {suggestedAnswers.get(currentQuestion.id) ||
                            "Failed to load suggested answer."}
                        </pre>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleSaveSuggestedAnswer}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={
                        isLoading || !suggestedAnswers.has(currentQuestion.id)
                      }
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save This Answer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleEditSuggested}
                      disabled={
                        isLoading || !suggestedAnswers.has(currentQuestion.id)
                      }
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit This Answer
                    </Button>
                    <Button variant="outline" onClick={handleWriteMyOwn}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Write My Own
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleLoadSuggestedAnswer(true)}
                      disabled={isLoading}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Regenerate Answer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Write My Own Editor */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Your Custom Answer
                    </h4>
                    <Textarea
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Write your answer using the STAR format..."
                      className="min-h-[300px] text-sm leading-relaxed"
                    />
                  </div>

                  {/* Save Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveMyAnswer}
                      disabled={!userAnswer.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save My Answer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setUserAnswer("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhanceAnswersTab;
