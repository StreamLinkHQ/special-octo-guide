/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo } from "react";
import {
  useGetQuizQuestions,
  useSubmitQuizAnswers,
  useRequirePublicKey,
} from "@vidbloq/react";
import { useStream } from "../../hooks";

const QuizTaker = () => {
  const { getQuizQuestions, quiz: fetchedQuiz, isLoading: quizLoading } = useGetQuizQuestions();
  const { submitQuizAnswers } = useSubmitQuizAnswers();
  const { publicKey } = useRequirePublicKey();
  const { 
    activeAgendaId, 
    activeAddonType,
    isParticipationAvailable,
    preloadedQuizData,
    isPreloadingQuiz
  } = useStream();
  
  // Use preloaded data if available, otherwise use fetched data
  const quiz = preloadedQuizData || fetchedQuiz;
  const isLoading = isPreloadingQuiz || quizLoading;
  
  const questions = useMemo(() => quiz?.questions || [], [quiz]);

  // State management (simplified - no need to manage addon state here)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  console.log("QuizTaker - Global state:", {
    activeAgendaId,
    activeAddonType,
    isParticipationAvailable,
    quiz: !!quiz,
    questionsCount: questions.length,
    isUsingPreloadedData: !!preloadedQuizData
  });

  // Calculate total possible points
  const totalPoints = questions.reduce((sum: any, q:any) => sum + q.points, 0);

  // All hooks must be called before any conditional returns
  // Timer effect
  useEffect(() => {
    if (isTimerActive && timeRemaining !== null && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            // Time's up - auto submit
            setIsTimerActive(false);
            setShowResults(true);
            submitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerActive, timeRemaining]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Format time for display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Fetch quiz data when activeAgendaId changes and no preloaded data exists
  useEffect(() => {
    if (activeAgendaId && !preloadedQuizData && !hasInitialized) {
      fetchQuizData();
      setHasInitialized(true);
    }
  }, [activeAgendaId, preloadedQuizData, hasInitialized]);

  // Reset initialization flag when agenda changes
  useEffect(() => {
    if (!activeAgendaId) {
      setHasInitialized(false);
      // Reset quiz state when agenda changes
      setQuizStarted(false);
      setShowResults(false);
      setAnswers({});
      setCurrentQuestionIndex(0);
    }
  }, [activeAgendaId]);

  // Only render if quiz addon is active - check after all hooks
  if (activeAddonType !== 'Quiz' || !isParticipationAvailable) {
    console.log("Quiz not active or not available");
    return null;
  }

  const fetchQuizData = async () => {
    if (!activeAgendaId) return;

    console.log("Fetching quiz data for agenda:", activeAgendaId);

    try {
      await getQuizQuestions(activeAgendaId);
      console.log("Quiz data fetched successfully");
    } catch (error) {
      console.error("Error fetching quiz data:", error);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // Stop timer when submitting
      setIsTimerActive(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setShowResults(true);
      submitQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((question: any) => {
      const userAnswer = answers[question.id];
      if (
        userAnswer &&
        userAnswer.toLowerCase().trim() ===
          question.correctAnswer.toLowerCase().trim()
      ) {
        score += question.points;
      }
    });
    return score;
  };

  const prepareAnswersForSubmission = () => {
    return questions.map((question: any) => {
      const userAnswer = answers[question.id] || "";
      const isCorrect =
        userAnswer.toLowerCase().trim() ===
        question.correctAnswer.toLowerCase().trim();

      return {
        questionId: question.id,
        answer: userAnswer,
        isCorrect: isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
      };
    });
  };

  const submitQuiz = async () => {
    if (!publicKey || !activeAgendaId) {
      console.error("No public key or active agenda ID found, unable to submit quiz");
      return;
    }

    try {
      const quizAnswers = prepareAnswersForSubmission();
      const totalScore = calculateScore();

      const submitRequest = {
        wallet: publicKey.toString(),
        answers: quizAnswers,
        totalScore: totalScore,
      };
      await submitQuizAnswers(activeAgendaId, submitRequest);
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    
    // Initialize timer if quiz has duration (convert minutes to seconds)
    const durationInMinutes = Number(quiz?.duration);
    if (durationInMinutes && durationInMinutes > 0) {
      const durationInSeconds = durationInMinutes * 60;
      setTimeRemaining(durationInSeconds);
      setIsTimerActive(true);
    }
  };

  // Show loading state
  if (isLoading || (!quiz && activeAgendaId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-purple-200 rounded-full opacity-20 blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-purple-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        </div>
        
        <div className="max-w-2xl mx-auto relative">
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">
                {isPreloadingQuiz ? "Preparing quiz..." : "Loading quiz..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no quiz data after loading
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
            <div className="text-center">
              <p className="text-red-500 mb-4">No quiz data available</p>
              <div className="space-x-2">
                <button
                  onClick={fetchQuizData}
                  className="bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Retry Fetch
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="max-w-2xl mx-auto relative">
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent mb-4">
                {quiz?.title || "Quiz"}
              </h1>
              {quiz?.description && (
                <p className="text-gray-600 mb-8 leading-relaxed">{quiz.description}</p>
              )}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 mb-8">
                <p className="text-lg text-gray-700 mb-2">
                  <span className="font-semibold">{quiz.questions.length}</span>{" "}
                  questions
                </p>
                <p className="text-lg text-gray-700 mb-2">
                  Total points: <span className="font-semibold">{totalPoints}</span>
                </p>
                {quiz?.duration && Number(quiz.duration) > 0 && (
                  <p className="text-lg text-gray-700">
                    Time limit: <span className="font-semibold">{Number(quiz.duration)} minutes</span>
                  </p>
                )}
              </div>
              <button
                onClick={startQuiz}
                className="bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-4 px-12 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / totalPoints) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="max-w-2xl mx-auto relative">
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
            <div className="text-center">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent mb-8">
                Quiz Complete!
              </h2>

              <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-8 rounded-2xl mb-8 shadow-lg">
                <div className="text-5xl font-bold mb-2">
                  {score} / {totalPoints}
                </div>
                <div className="text-2xl opacity-90">{percentage}%</div>
              </div>

              <div className="space-y-4">
                {questions.map((question: any, index: number) => {
                  const userAnswer = answers[question.id] || "";
                  const isCorrect =
                    userAnswer.toLowerCase().trim() ===
                    question.correctAnswer.toLowerCase().trim();

                  return (
                    <div
                      key={question.id}
                      className={`p-5 rounded-xl text-left border-l-4 ${
                        isCorrect 
                          ? 'bg-green-50 border-green-500' 
                          : 'bg-red-50 border-red-500'
                      }`}
                    >
                      <p className="font-semibold text-gray-800 mb-3">
                        Question {index + 1}: {question.questionText}
                      </p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium text-gray-600">Your answer:</span>{" "}
                          <span
                            className={
                              isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"
                            }
                          >
                            {userAnswer || "No answer"}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium text-gray-600">Correct answer:</span>{" "}
                          <span className="text-green-600 font-medium">
                            {question.correctAnswer}
                          </span>
                        </p>
                        <p>
                          <span className="font-medium text-gray-600">Points:</span>{" "}
                          <span
                            className={
                              isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"
                            }
                          >
                            {isCorrect ? question.points : 0} / {question.points}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="max-w-2xl mx-auto relative">
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
          {/* Timer display */}
          {timeRemaining !== null && (
            <div className={`mb-6 p-4 rounded-xl text-center font-semibold transition-all duration-300 ${
              timeRemaining <= 60 
                ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' 
                : timeRemaining <= 300
                ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                : 'bg-purple-50 text-purple-600 border border-purple-200'
            }`}>
              <div className="text-lg">
                Time remaining: {formatTime(timeRemaining)}
              </div>
              {timeRemaining <= 60 && (
                <div className="text-sm mt-1">⚠️ Less than 1 minute remaining!</div>
              )}
            </div>
          )}

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-3">
              <span>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="font-medium text-purple-600">{currentQuestion.points} points</span>
            </div>
            <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-700 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    ((currentQuestionIndex + 1) / questions.length) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
              {currentQuestion.questionText}
            </h2>

            {/* Multiple choice */}
            {currentQuestion.isMultiChoice && currentQuestion.options.length > 0 ? (
              <div className="space-y-3">
                {currentQuestion.options.map((option: string, index: number) => (
                  <label
                    key={index}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      answers[currentQuestion.id] === option
                        ? 'bg-purple-50 border-purple-400 shadow-md'
                        : 'bg-white border-gray-200 hover:bg-purple-50 hover:border-purple-300 hover:translate-x-1'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={(e) =>
                        handleAnswerChange(currentQuestion.id, e.target.value)
                      }
                      className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              /* Text input for non-multiple choice */
              <div>
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, e.target.value)
                  }
                  placeholder="Type your answer here..."
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                />
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-100">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                currentQuestionIndex === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50 hover:-translate-y-0.5"
              }`}
            >
              Previous
            </button>

            <button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
              className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
                !answers[currentQuestion.id]
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : currentQuestionIndex === questions.length - 1
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg hover:-translate-y-0.5"
                  : "bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:shadow-lg hover:-translate-y-0.5"
              }`}
            >
              {currentQuestionIndex === questions.length - 1
                ? "Finish Quiz"
                : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTaker;