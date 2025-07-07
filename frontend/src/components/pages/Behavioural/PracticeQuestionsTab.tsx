import React, { useState, useEffect, useRef } from "react";
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
import { Mic, MicOff, RefreshCw, Send, Volume2 } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { questionsApiClient } from "@/services/behaviouralQuestionService";
import { answersApiClient } from "@/services/answersService";
import { FeedbackResponse } from "@/models/FeedbackResponse";
import { Question } from "@/models/question";

const PracticeQuestionsTab: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRandomQuestion();

    // Initialize speech recognition if available
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";
    }
  }, []);

  const loadRandomQuestion = async () => {
    setIsLoading(true);
    try {
      const questions = await questionsApiClient.fetchQuestions();
      if (questions.length > 0) {
        const randomIndex = Math.floor(Math.random() * questions.length);
        setCurrentQuestion(questions[randomIndex]);
      }
    } catch (error) {
      console.error("Error loading questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      // Try browser's native Speech Recognition first (more reliable)
      if (recognitionRef.current) {
        setIsRecording(true);

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setAnswer((prev) => prev + " " + finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          // Fallback to MediaRecorder
          startMediaRecording();
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current.start();
        return;
      }

      // Fallback to MediaRecorder
      await startMediaRecording();
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const startMediaRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      await transcribeAudio(audioBlob);
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];
        var supabase = window as any;
        const { data, error } = await supabase.functions.invoke(
          "voice-interview",
          {
            body: {
              action: "transcribe",
              audioData: base64Audio,
            },
          }
        );

        if (error) {
          console.error("Transcription API error:", error);
          // Provide user-friendly fallback
          setAnswer(
            (prev) =>
              prev +
              " [Speech could not be transcribed - please type your answer]"
          );
          toast({
            title: "Transcription Unavailable",
            description: "Please type your answer in the text box.",
            variant: "default",
          });
          return;
        }

        const transcript = data?.transcript || "";
        if (transcript.trim()) {
          setAnswer((prev) => prev + " " + transcript);
          toast({
            title: "Transcription Complete",
            description: "Your speech has been converted to text.",
          });
        } else {
          toast({
            title: "No Speech Detected",
            description:
              "Please try speaking more clearly or type your answer.",
            variant: "default",
          });
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast({
        title: "Transcription Error",
        description: "Please type your answer instead.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const analyzeAnswer = async () => {
    if (!answer.trim() || !currentQuestion) {
      toast({
        title: "No Answer to Analyze",
        description: "Please provide an answer first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      var data = await answersApiClient.analyzeAnswer({
        question: currentQuestion.text,
        answer: answer,
        category: currentQuestion.category,
      });

      setFeedback(data);
      toast({
        title: "Analysis Complete",
        description: "Your answer has been analyzed with detailed feedback.",
      });
    } catch (error) {
      console.error("Error analyzing answer:", error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getNewQuestion = () => {
    setAnswer("");
    setFeedback(null);
    loadRandomQuestion();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Loading question...</span>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No questions available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Question Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{currentQuestion.category}</Badge>
            <Button variant="outline" size="sm" onClick={getNewQuestion}>
              <RefreshCw className="w-4 h-4 mr-2" />
              New Question
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-blue-900">
              {currentQuestion.text}
            </h3>
          </div>
        </CardContent>
      </Card>

      {/* Answer Input */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Your Answer
            <div className="flex gap-2">
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isAnalyzing || isTranscribing}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
                {isRecording ? "Stop Recording" : "Record Answer"}
              </Button>
            </div>
          </CardTitle>
          {isRecording && (
            <CardDescription className="text-red-600">
              🔴 Recording... Speak your answer clearly
            </CardDescription>
          )}
          {isTranscribing && (
            <CardDescription className="text-blue-600">
              🔄 Processing speech...
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here or use the record button to speak..."
            className="min-h-[200px]"
            disabled={isRecording}
          />
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">
              {answer.split(" ").filter((word) => word.length > 0).length} words
            </p>
            <Button
              onClick={analyzeAnswer}
              disabled={!answer.trim() || isRecording || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Get Feedback
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Section */}
      {feedback && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-xl text-purple-900">
              AI Feedback Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries({
                Structure: feedback.structure,
                Clarity: feedback.clarity,
                Tone: feedback.tone,
                Impact: feedback.impact,
              }).map(([category, score]) => (
                <div key={category} className="bg-white p-4 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-900">{category}</h4>
                    <span
                      className={`text-2xl font-bold ${getScoreColor(
                        score.score
                      )}`}
                    >
                      {score.score}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {score.notes}
                  </p>
                </div>
              ))}
            </div>

            {/* Overall Assessment */}
            <div className="bg-white p-6 rounded-lg border">
              <h4 className="font-semibold text-gray-900 mb-3">
                Overall Assessment
              </h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                {feedback.overall}
              </p>

              <h5 className="font-semibold text-gray-900 mb-2">
                Suggested Improvement:
              </h5>
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {feedback.improvedExample}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PracticeQuestionsTab;
