import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { questionsApiClient } from "@/services/behaviouralQuestionService";
import { answersApiClient } from "@/services/answersService";
import { useToast } from "../../hooks/use-toast";

const ExpertAnswerTab: React.FC = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [expertAnswer, setExpertAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true);
      try {
        const qs = await questionsApiClient.fetchQuestions();
        setQuestions(qs);
        setCurrentIndex(0);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load questions.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadQuestions();
  }, [toast]);

  useEffect(() => {
    const loadUserAnswer = async () => {
      if (!questions[currentIndex]) return;
      try {
        const userAnswers = await answersApiClient.fetchUserAnswers("default_session");
        const answer = userAnswers.find(
          (a) => a.questionId === questions[currentIndex].id
        );
        setUserAnswer(answer?.answerText || "");
      } catch {
        setUserAnswer("");
      }
    };
    loadUserAnswer();
  }, [questions, currentIndex]);

  const handleGetExpertAnswer = async () => {
    setIsLoading(true);
    try {
      const response = await questionsApiClient.generateSuggestedAnswer(
        questions[currentIndex].id
      );
      setExpertAnswer(response.suggestedAnswer);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load expert answer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % questions.length);
    setExpertAnswer("");
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
    setExpertAnswer("");
  };

  if (!questions.length) {
    return <div className="text-center py-12">No questions available.</div>;
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Expert Answer Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="font-semibold text-blue-900 mb-2">Question:</div>
            <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500 mb-4">
              {currentQuestion.text}
            </div>
            <div className="flex gap-2 mb-2">
              <Button onClick={handlePrev} variant="outline" size="sm">Previous</Button>
              <Button onClick={handleNext} variant="outline" size="sm">Next</Button>
            </div>
          </div>
          <div className="mb-4">
            <div className="font-semibold text-gray-900 mb-2">Your Answer:</div>
            <Textarea value={userAnswer} readOnly className="min-h-[120px] mb-2" />
          </div>
          <div className="mb-4">
            <div className="font-semibold text-gray-900 mb-2">Expert Answer:</div>
            <Textarea value={expertAnswer} readOnly className="min-h-[120px] mb-2" />
            <Button onClick={handleGetExpertAnswer} disabled={isLoading}>
              {isLoading ? "Loading..." : "Show Expert Answer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpertAnswerTab;
