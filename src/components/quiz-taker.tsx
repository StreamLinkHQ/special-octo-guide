// import { useState, useEffect, useRef, useMemo } from "react";
// import {
//   useGetQuizQuestions,
//   useStreamAddons,
//   useSubmitQuizAnswers,
//   useRequirePublicKey,
// } from "@vidbloq/react";
// import { useStream } from "../hooks/useStream";

// interface QuizTakerProps {
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   activeAddons?: any;
// }

// const QuizTaker = ({ activeAddons: propsActiveAddons }: QuizTakerProps = {}) => {
//   const { getQuizQuestions, quiz, isLoading: quizLoading } = useGetQuizQuestions();
//   const { activeAddons: hookActiveAddons } = useStreamAddons();
//   const { submitQuizAnswers } = useSubmitQuizAnswers();
//   const { publicKey } = useRequirePublicKey();
//   const questions = useMemo(() => quiz?.questions || [], [quiz]);

//   // Use props activeAddons if provided, otherwise use hook
//   const activeAddons = propsActiveAddons || hookActiveAddons;

//   // State management
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [answers, setAnswers] = useState<{ [key: string]: string }>({});
//   const [showResults, setShowResults] = useState(false);
//   const [quizStarted, setQuizStarted] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [hasInitialized, setHasInitialized] = useState(false);
//   const [fetchAttempts, setFetchAttempts] = useState(0);
  
//   // Timer state
//   const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
//   const [isTimerActive, setIsTimerActive] = useState(false);
//   const timerRef = useRef<NodeJS.Timeout | null>(null);

//   const { activeAgendaId, setActiveAgendaId } = useStream();

//   console.log("Quiz duration:", quiz?.duration);
//   console.log({quiz})
//   console.log({activeAgendaId})
//   console.log({ answers });
//   console.log("Quiz loading state:", { isLoading, quizLoading, fetchAttempts });

//   // Get the quiz addon data - try both Quiz and quiz keys
//   const quizAddon = activeAddons.Quiz || activeAddons.quiz || activeAddons['Quiz'];
//   const quizData = quizAddon?.data as { agendaId?: string } | undefined;

//   // Add comprehensive debugging
//   console.log("QuizTaker Component State:", {
//     activeAddons,
//     activeAddonsKeys: Object.keys(activeAddons || {}),
//     quizAddon,
//     quizAddonIsActive: quizAddon?.isActive,
//     quizData,
//     activeAgendaId,
//     quiz: !!quiz,
//     questionsCount: questions.length
//   });

//   // Calculate total possible points
//   const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

//   // Timer effect
//   useEffect(() => {
//     if (isTimerActive && timeRemaining !== null && timeRemaining > 0) {
//       timerRef.current = setTimeout(() => {
//         setTimeRemaining(prev => {
//           if (prev === null || prev <= 1) {
//             // Time's up - auto submit
//             setIsTimerActive(false);
//             setShowResults(true);
//             submitQuiz();
//             return 0;
//           }
//           return prev - 1;
//         });
//       }, 1000);
//     }

//     return () => {
//       if (timerRef.current) {
//         clearTimeout(timerRef.current);
//       }
//     };
//   }, [isTimerActive, timeRemaining]);

//   // Cleanup timer on unmount
//   useEffect(() => {
//     return () => {
//       if (timerRef.current) {
//         clearTimeout(timerRef.current);
//       }
//     };
//   }, []);

//   // Format time for display
//   const formatTime = (seconds: number) => {
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = seconds % 60;
//     return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
//   };

//   // When quiz becomes active, extract and set the agenda ID from addon data
//   useEffect(() => {
//     if (quizAddon?.isActive && quizData?.agendaId) {
//       console.log("Quiz addon is active with agenda ID:", quizData.agendaId);
      
//       if (!hasInitialized) {
//         console.log("Initializing quiz with agenda ID:", quizData.agendaId);
//         setActiveAgendaId(quizData.agendaId);
//         setHasInitialized(true);
//       } else if (activeAgendaId !== quizData.agendaId) {
//         console.log("Agenda ID mismatch, updating:", activeAgendaId, "->", quizData.agendaId);
//         setActiveAgendaId(quizData.agendaId);
//       }
//     }

//     // Reset when quiz becomes inactive
//     if (!quizAddon?.isActive && hasInitialized) {
//       console.log("Quiz became inactive, resetting");
//       setHasInitialized(false);
//       setActiveAgendaId(null);
//     }
//   }, [
//     quizAddon?.isActive,
//     quizData?.agendaId,
//     activeAgendaId,
//     setActiveAgendaId,
//     hasInitialized,
//   ]);

//   const handleAnswerChange = (questionId: string, answer: string) => {
//     setAnswers((prev) => ({
//       ...prev,
//       [questionId]: answer,
//     }));
//   };

//   const handleNext = () => {
//     if (currentQuestionIndex < questions.length - 1) {
//       setCurrentQuestionIndex((prev) => prev + 1);
//     } else {
//       // Stop timer when submitting
//       setIsTimerActive(false);
//       if (timerRef.current) {
//         clearTimeout(timerRef.current);
//       }
//       setShowResults(true);
//       submitQuiz();
//     }
//   };

//   const handlePrevious = () => {
//     if (currentQuestionIndex > 0) {
//       setCurrentQuestionIndex((prev) => prev - 1);
//     }
//   };

//   const calculateScore = () => {
//     let score = 0;
//     questions.forEach((question) => {
//       const userAnswer = answers[question.id];
//       if (
//         userAnswer &&
//         userAnswer.toLowerCase().trim() ===
//           question.correctAnswer.toLowerCase().trim()
//       ) {
//         score += question.points;
//       }
//     });
//     return score;
//   };

//   const prepareAnswersForSubmission = () => {
//     return questions.map((question) => {
//       const userAnswer = answers[question.id] || "";
//       const isCorrect =
//         userAnswer.toLowerCase().trim() ===
//         question.correctAnswer.toLowerCase().trim();

//       return {
//         questionId: question.id,
//         answer: userAnswer,
//         isCorrect: isCorrect,
//         pointsEarned: isCorrect ? question.points : 0,
//       };
//     });
//   };

//   const submitQuiz = async () => {
//     if (!publicKey || !activeAgendaId) {
//       console.error(
//         "No public key or active agenda ID found, unable to submit quiz"
//       );
//       return;
//     }

//     try {
//       const quizAnswers = prepareAnswersForSubmission();
//       const totalScore = calculateScore();

//       const submitRequest = {
//         wallet: publicKey.toString(),
//         answers: quizAnswers,
//         totalScore: totalScore,
//       };
//       await submitQuizAnswers(activeAgendaId, submitRequest);
//     } catch (error) {
//       console.error("Error submitting quiz:", error);
//     }
//   };

//   const fetchQuizData = async () => {
//     if (!activeAgendaId) {
//       console.log("No activeAgendaId, skipping fetch");
//       return;
//     }

//     console.log("Fetching quiz data for agenda:", activeAgendaId);
//     setIsLoading(true);
//     setFetchAttempts(prev => prev + 1);

//     try {
//       const result = await getQuizQuestions(activeAgendaId);
//       console.log("Quiz fetch result:", result);
//       console.log("Quiz data fetched successfully");
      
//       // Wait a bit and check if quiz was updated
//       setTimeout(() => {
//         console.log("Quiz object after fetch:", quiz);
//         console.log("Questions after fetch:", questions);
//       }, 100);
//     } catch (error) {
//       console.error("Error fetching quiz data:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const startQuiz = () => {
//     setQuizStarted(true);
    
//     // Initialize timer if quiz has duration (convert minutes to seconds)
//     const durationInMinutes = Number(quiz?.duration);
//     if (durationInMinutes && durationInMinutes > 0) {
//       const durationInSeconds = durationInMinutes * 60;
//       setTimeRemaining(durationInSeconds);
//       setIsTimerActive(true);
//     }
//   };

//   // Debug quiz data changes
//   useEffect(() => {
//     console.log("Quiz data changed:", { 
//       quiz, 
//       questionsLength: questions.length, 
//       activeAgendaId,
//       quizExists: !!quiz,
//       hasQuestions: questions.length > 0,
//       shouldShowQuiz: !!(quiz && questions.length > 0)
//     });
//   }, [quiz, questions, activeAgendaId]);

//   // Fetch quiz data when activeAgendaId changes
//   useEffect(() => {
//     if (activeAgendaId) {
//       console.log("ActiveAgendaId changed, fetching quiz data:", activeAgendaId);
//       fetchQuizData();
//     }
//   }, [activeAgendaId]);

//   // Force refetch if quiz is null but we have an active agenda
//   useEffect(() => {
//     if (activeAgendaId && quizAddon?.isActive && !quiz && !isLoading && !quizLoading && fetchAttempts < 3) {
//       console.log(`Quiz is null but should have data, forcing refetch (attempt ${fetchAttempts + 1})`);
//       const timer = setTimeout(() => {
//         fetchQuizData();
//       }, 1000 * (fetchAttempts + 1)); // Exponential backoff
//       return () => clearTimeout(timer);
//     }
//   }, [activeAgendaId, quizAddon?.isActive, quiz, isLoading, quizLoading, fetchAttempts]);

//   // Reset when quiz becomes inactive
//   useEffect(() => {
//     if (!quizAddon?.isActive) {
//       setCurrentQuestionIndex(0);
//       setAnswers({});
//       setShowResults(false);
//       setQuizStarted(false);
//       setHasInitialized(false);
//       setTimeRemaining(null);
//       setIsTimerActive(false);
//       setFetchAttempts(0);
//       if (timerRef.current) {
//         clearTimeout(timerRef.current);
//       }
//     }
//   }, [quizAddon?.isActive]);

//   // Don't render anything if quiz is not active
//   // Temporarily comment this out to debug
//   /*
//   if (!quizAddon?.isActive) {
//     console.log("Quiz not active, not rendering", {
//       quizAddon,
//       isActive: quizAddon?.isActive,
//       activeAddons
//     });
//     return null;
//   }
//   */

//   // Show loading state
//   if (isLoading || quizLoading || (!quiz && activeAgendaId && fetchAttempts < 3)) {
//     console.log("Showing loading state");
//     return (
//       <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
//         <div className="text-center">
//           <p className="text-gray-600">Loading quiz...</p>
//           <p className="text-sm text-gray-500 mt-2">Attempt {fetchAttempts} of 3</p>
//         </div>
//       </div>
//     );
//   }

//   console.log("Checking quiz data:", {
//     quiz: !!quiz,
//     questionsLength: questions.length,
//     quizQuestions: quiz?.questions,
//     localQuestions: questions
//   });

//   // Show error state if no quiz data after loading
//   if (!quiz || !quiz.questions || quiz.questions.length === 0) {
//     console.log("Showing error state - no quiz data");
//     return (
//       <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
//         <div className="text-center">
//           <p className="text-red-600">No quiz data available</p>
//           {!activeAgendaId && (
//             <p className="text-sm text-gray-600 mt-2">
//               Waiting for agenda ID...
//               {quizData?.agendaId && (
//                 <span className="block text-xs mt-1">
//                   Found in addon data: {quizData.agendaId}
//                 </span>
//               )}
//             </p>
//           )}
//           {activeAgendaId && (
//             <p className="text-sm text-gray-600 mt-2">
//               Agenda ID: {activeAgendaId}
//             </p>
//           )}
//           <div className="mt-4 text-xs text-gray-500 space-y-1">
//             <p>Quiz addon active: {quizAddon?.isActive ? 'Yes' : 'No'}</p>
//             <p>Quiz data: {quiz ? 'Loaded' : 'Not loaded'}</p>
//             <p>Questions count: {quiz?.questions?.length || 0}</p>
//             <p>Is loading: {isLoading ? 'Yes' : 'No'}</p>
//             <p>Has initialized: {hasInitialized ? 'Yes' : 'No'}</p>
//           </div>
//           <div className="mt-4 space-x-2">
//             <button
//               onClick={fetchQuizData}
//               className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//             >
//               Retry Fetch
//             </button>
//             {quizData?.agendaId && activeAgendaId !== quizData.agendaId && (
//               <button
//                 onClick={() => setActiveAgendaId(quizData.agendaId || null)}
//                 className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
//               >
//                 Set Correct Agenda ID
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   console.log("Quiz data is valid, proceeding to render quiz");

//   if (!quizStarted) {
//     console.log("Showing quiz start screen");
//     return (
//       <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
//         <div className="text-center">
//           <h1 className="text-3xl font-bold text-gray-800 mb-4">
//             {quiz?.title || "Quiz"}
//           </h1>
//           {quiz?.description && (
//             <p className="text-gray-600 mb-6">{quiz.description}</p>
//           )}
//           <div className="bg-blue-50 p-4 rounded-lg mb-6">
//             <p className="text-lg text-gray-700">
//               <span className="font-semibold">{quiz.questions.length}</span>{" "}
//               questions
//             </p>
//             <p className="text-lg text-gray-700">
//               Total points: <span className="font-semibold">{totalPoints}</span>
//             </p>
//             {quiz?.duration && Number(quiz.duration) > 0 && (
//               <p className="text-lg text-gray-700">
//                 Time limit: <span className="font-semibold">{Number(quiz.duration)} minutes</span>
//               </p>
//             )}
//           </div>
//           <button
//             onClick={startQuiz}
//             className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
//           >
//             Start Quiz
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (showResults) {
//     const score = calculateScore();
//     const percentage = Math.round((score / totalPoints) * 100);

//     return (
//       <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
//         <div className="text-center">
//           <h2 className="text-3xl font-bold text-gray-800 mb-6">
//             Quiz Complete!
//           </h2>

//           <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg mb-6">
//             <div className="text-4xl font-bold mb-2">
//               {score} / {totalPoints}
//             </div>
//             <div className="text-xl">{percentage}%</div>
//           </div>

//           <div className="space-y-4 mb-6">
//             {questions.map((question, index) => {
//               const userAnswer = answers[question.id] || "";
//               const isCorrect =
//                 userAnswer.toLowerCase().trim() ===
//                 question.correctAnswer.toLowerCase().trim();

//               return (
//                 <div
//                   key={question.id}
//                   className="bg-gray-50 p-4 rounded-lg text-left"
//                 >
//                   <p className="font-semibold text-gray-800 mb-2">
//                     Question {index + 1}: {question.questionText}
//                   </p>
//                   <div className="space-y-1">
//                     <p className="text-sm">
//                       <span className="font-medium">Your answer:</span>{" "}
//                       <span
//                         className={
//                           isCorrect ? "text-green-600" : "text-red-600"
//                         }
//                       >
//                         {userAnswer || "No answer"}
//                       </span>
//                     </p>
//                     <p className="text-sm">
//                       <span className="font-medium">Correct answer:</span>{" "}
//                       <span className="text-green-600">
//                         {question.correctAnswer}
//                       </span>
//                     </p>
//                     <p className="text-sm">
//                       <span className="font-medium">Points:</span>{" "}
//                       <span
//                         className={
//                           isCorrect ? "text-green-600" : "text-red-600"
//                         }
//                       >
//                         {isCorrect ? question.points : 0} / {question.points}
//                       </span>
//                     </p>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const currentQuestion = questions[currentQuestionIndex];
//   if (!currentQuestion) return null;

//   return (
//     <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
//       {/* Timer display */}
//       {timeRemaining !== null && (
//         <div className="mb-4">
//           <div className={`text-center p-3 rounded-lg ${
//             timeRemaining <= 60 ? 'bg-red-100 text-red-800' : 
//             timeRemaining <= 300 ? 'bg-yellow-100 text-yellow-800' : 
//             'bg-blue-100 text-blue-800'
//           }`}>
//             <div className="text-lg font-semibold">
//               Time remaining: {formatTime(timeRemaining)}
//             </div>
//             {timeRemaining <= 60 && (
//               <div className="text-sm mt-1">⚠️ Less than 1 minute remaining!</div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Progress bar */}
//       <div className="mb-6">
//         <div className="flex justify-between text-sm text-gray-600 mb-2">
//           <span>
//             Question {currentQuestionIndex + 1} of {questions.length}
//           </span>
//           <span>{currentQuestion.points} points</span>
//         </div>
//         <div className="w-full bg-gray-200 rounded-full h-2">
//           <div
//             className="bg-blue-600 h-2 rounded-full transition-all duration-300"
//             style={{
//               width: `${
//                 ((currentQuestionIndex + 1) / questions.length) * 100
//               }%`,
//             }}
//           ></div>
//         </div>
//       </div>

//       {/* Question */}
//       <div className="mb-8">
//         <h2 className="text-xl font-bold text-gray-800 mb-6">
//           {currentQuestion.questionText}
//         </h2>

//         {/* Multiple choice */}
//         {currentQuestion.isMultiChoice && currentQuestion.options.length > 0 ? (
//           <div className="space-y-3">
//             {currentQuestion.options.map((option, index) => (
//               <label
//                 key={index}
//                 className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
//               >
//                 <input
//                   type="radio"
//                   name={`question-${currentQuestion.id}`}
//                   value={option}
//                   checked={answers[currentQuestion.id] === option}
//                   onChange={(e) =>
//                     handleAnswerChange(currentQuestion.id, e.target.value)
//                   }
//                   className="w-4 h-4 text-blue-600"
//                 />
//                 <span className="text-gray-700">{option}</span>
//               </label>
//             ))}
//           </div>
//         ) : (
//           /* Text input for non-multiple choice */
//           <div>
//             <input
//               type="text"
//               value={answers[currentQuestion.id] || ""}
//               onChange={(e) =>
//                 handleAnswerChange(currentQuestion.id, e.target.value)
//               }
//               placeholder="Type your answer here..."
//               className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             />
//           </div>
//         )}
//       </div>

//       {/* Navigation buttons */}
//       <div className="flex justify-between">
//         <button
//           onClick={handlePrevious}
//           disabled={currentQuestionIndex === 0}
//           className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
//             currentQuestionIndex === 0
//               ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//               : "bg-gray-600 hover:bg-gray-700 text-white"
//           }`}
//         >
//           Previous
//         </button>

//         <button
//           onClick={handleNext}
//           disabled={!answers[currentQuestion.id]}
//           className={`px-6 py-2 rounded-lg font-medium transition duration-200 ${
//             !answers[currentQuestion.id]
//               ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//               : currentQuestionIndex === questions.length - 1
//               ? "bg-green-600 hover:bg-green-700 text-white"
//               : "bg-blue-600 hover:bg-blue-700 text-white"
//           }`}
//         >
//           {currentQuestionIndex === questions.length - 1
//             ? "Finish Quiz"
//             : "Next"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default QuizTaker;

import { useState, useEffect, useRef, useMemo } from "react";
import {
  useGetQuizQuestions,
  useSubmitQuizAnswers,
  useRequirePublicKey,
} from "@vidbloq/react";
import { useStream } from "../hooks/useStream";

const QuizTaker = () => {
  const { getQuizQuestions, quiz, isLoading: quizLoading } = useGetQuizQuestions();
  const { submitQuizAnswers } = useSubmitQuizAnswers();
  const { publicKey } = useRequirePublicKey();
  const { 
    activeAgendaId, 
    activeAddonType,
    isParticipationAvailable 
  } = useStream();
  
  const questions = useMemo(() => quiz?.questions || [], [quiz]);

  // State management (simplified - no need to manage addon state here)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  console.log("QuizTaker - Global state:", {
    activeAgendaId,
    activeAddonType,
    isParticipationAvailable,
    quiz: !!quiz,
    questionsCount: questions.length
  });

  // Calculate total possible points
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

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

  // Fetch quiz data when activeAgendaId changes
  useEffect(() => {
    if (activeAgendaId) {
      fetchQuizData();
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
    setIsLoading(true);

    try {
      await getQuizQuestions(activeAgendaId);
      console.log("Quiz data fetched successfully");
    } catch (error) {
      console.error("Error fetching quiz data:", error);
    } finally {
      setIsLoading(false);
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
    questions.forEach((question) => {
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
    return questions.map((question) => {
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
  if (isLoading || quizLoading || (!quiz && activeAgendaId)) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <p className="text-gray-600">Loading quiz...</p>
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
            {questions.map((question, index) => {
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
            {currentQuestion.options.map((option, index) => (
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