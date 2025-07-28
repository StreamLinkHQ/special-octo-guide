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
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <p className="text-gray-600">
            {isPreloadingQuiz ? "Preparing quiz..." : "Loading quiz..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if no quiz data after loading
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <p className="text-red-600">No quiz data available</p>
          <div className="mt-4 space-x-2">
            <button
              onClick={fetchQuizData}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Retry Fetch
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {quiz?.title || "Quiz"}
          </h1>
          {quiz?.description && (
            <p className="text-gray-600 mb-6">{quiz.description}</p>
          )}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-lg text-gray-700">
              <span className="font-semibold">{quiz.questions.length}</span>{" "}
              questions
            </p>
            <p className="text-lg text-gray-700">
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / totalPoints) * 100);

    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Quiz Complete!
          </h2>

          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
            <div className="text-4xl font-bold mb-2">
              {score} / {totalPoints}
            </div>
            <div className="text-xl">{percentage}%</div>
          </div>

          <div className="space-y-4 mb-6">
            {questions.map((question: any, index: number) => {
              const userAnswer = answers[question.id] || "";
              const isCorrect =
                userAnswer.toLowerCase().trim() ===
                question.correctAnswer.toLowerCase().trim();

              return (
                <div
                  key={question.id}
                  className="bg-gray-50 p-4 rounded-lg text-left"
                >
                  <p className="font-semibold text-gray-800 mb-2">
                    Question {index + 1}: {question.questionText}
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Your answer:</span>{" "}
                      <span
                        className={
                          isCorrect ? "text-green-600" : "text-red-600"
                        }
                      >
                        {userAnswer || "No answer"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Correct answer:</span>{" "}
                      <span className="text-green-600">
                        {question.correctAnswer}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Points:</span>{" "}
                      <span
                        className={
                          isCorrect ? "text-green-600" : "text-red-600"
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
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Timer display */}
      {timeRemaining !== null && (
        <div className="mb-4">
          <div className={`text-center p-3 rounded-lg ${
            timeRemaining <= 60 ? 'bg-red-100 text-red-800' : 
            timeRemaining <= 300 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-blue-100 text-blue-800'
          }`}>
            <div className="text-lg font-semibold">
              Time remaining: {formatTime(timeRemaining)}
            </div>
            {timeRemaining <= 60 && (
              <div className="text-sm mt-1">⚠️ Less than 1 minute remaining!</div>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span>{currentQuestion.points} points</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {currentQuestion.questionText}
        </h2>

        {/* Multiple choice */}
        {currentQuestion.isMultiChoice && currentQuestion.options.length > 0 ? (
          <div className="space-y-3">
            {currentQuestion.options.map((option: string, index: number) => (
              <label
                key={index}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, e.target.value)
                  }
                  className="w-4 h-4 text-blue-600"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
            currentQuestionIndex === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gray-600 hover:bg-gray-700 text-white"
          }`}
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          disabled={!answers[currentQuestion.id]}
          className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
            !answers[currentQuestion.id]
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : currentQuestionIndex === questions.length - 1
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {currentQuestionIndex === questions.length - 1
            ? "Finish Quiz"
            : "Next"}
        </button>
      </div>
    </div>
  );
};

export default QuizTaker;