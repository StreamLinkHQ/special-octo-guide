// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useState, useEffect, useRef, useMemo } from "react";
// import {
//   useGetQuizQuestions,
//   useSubmitQuizAnswers,
//   useRequirePublicKey,
// } from "@vidbloq/react";
// import { useStream } from "../../hooks";

// // Quiz state that needs to be persisted
// interface QuizState {
//   currentQuestionIndex: number;
//   answers: { [key: string]: string };
//   showResults: boolean;
//   quizStarted: boolean;
//   timeRemaining: number | null;
//   quizCompleted: boolean;
//   submissionStatus: 'idle' | 'submitting' | 'success' | 'error';
//   submissionMessage: string;
// }

// // Store quiz states globally (outside component) to persist across mounts
// const quizStateStore: { [agendaId: string]: QuizState } = {};

// const QuizTaker = () => {
//   const { getQuizQuestions, quiz: fetchedQuiz, isLoading: quizLoading } = useGetQuizQuestions();
//   const { submitQuizAnswers } = useSubmitQuizAnswers();
//   const { publicKey } = useRequirePublicKey();
//   const { 
//     activeAgendaId, 
//     activeAddonType,
//     isParticipationAvailable,
//     preloadedQuizData,
//     isPreloadingQuiz
//   } = useStream();
  
//   // Use preloaded data if available, otherwise use fetched data
//   const quiz = preloadedQuizData || fetchedQuiz;
//   const isLoading = isPreloadingQuiz || quizLoading;
  
//   const questions = useMemo(() => quiz?.questions || [], [quiz]);

//   // Initialize state from persisted store or defaults
//   const getInitialState = (): QuizState => {
//     if (activeAgendaId && quizStateStore[activeAgendaId]) {
//       console.log("Restoring quiz state for agenda:", activeAgendaId);
//       return quizStateStore[activeAgendaId];
//     }
    
//     return {
//       currentQuestionIndex: 0,
//       answers: {},
//       showResults: false,
//       quizStarted: false,
//       timeRemaining: null,
//       quizCompleted: false,
//       submissionStatus: 'idle',
//       submissionMessage: '',
//     };
//   };

//   // State management with persistence
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => getInitialState().currentQuestionIndex);
//   const [answers, setAnswers] = useState<{ [key: string]: string }>(() => getInitialState().answers);
//   const [showResults, setShowResults] = useState(() => getInitialState().showResults);
//   const [quizStarted, setQuizStarted] = useState(() => getInitialState().quizStarted);
//   const [timeRemaining, setTimeRemaining] = useState<number | null>(() => getInitialState().timeRemaining);
//   const [quizCompleted, setQuizCompleted] = useState(() => getInitialState().quizCompleted);
//   const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>(() => getInitialState().submissionStatus);
//   const [submissionMessage, setSubmissionMessage] = useState(() => getInitialState().submissionMessage);
  
//   const [hasInitialized, setHasInitialized] = useState(false);
//   const [isTimerActive, setIsTimerActive] = useState(false);
//   const [showFeedback, setShowFeedback] = useState(false);
  
//   const timerRef = useRef<NodeJS.Timeout | null>(null);
//   const lastSaveTime = useRef<number>(Date.now());

//   console.log("QuizTaker - Global state:", {
//     activeAgendaId,
//     activeAddonType,
//     isParticipationAvailable,
//     quiz: !!quiz,
//     questionsCount: questions.length,
//     isUsingPreloadedData: !!preloadedQuizData,
//     quizStarted,
//     currentQuestionIndex,
//     timeRemaining,
//   });

//   // Calculate total possible points
//   const totalPoints = questions.reduce((sum: any, q:any) => sum + q.points, 0);

//   // Persist state whenever it changes
//   useEffect(() => {
//     if (activeAgendaId && quizStarted) {
//       // Throttle saves to every 500ms
//       const now = Date.now();
//       if (now - lastSaveTime.current < 500) return;
      
//       lastSaveTime.current = now;
      
//       const currentState: QuizState = {
//         currentQuestionIndex,
//         answers,
//         showResults,
//         quizStarted,
//         timeRemaining,
//         quizCompleted,
//         submissionStatus,
//         submissionMessage,
//       };
      
//       quizStateStore[activeAgendaId] = currentState;
//       console.log("Persisted quiz state for agenda:", activeAgendaId);
//     }
//   }, [
//     activeAgendaId,
//     currentQuestionIndex,
//     answers,
//     showResults,
//     quizStarted,
//     timeRemaining,
//     quizCompleted,
//     submissionStatus,
//     submissionMessage,
//   ]);

//   // Timer effect - continues from persisted state
//   useEffect(() => {
//     // Reactivate timer if quiz was in progress
//     if (quizStarted && timeRemaining !== null && timeRemaining > 0 && !showResults) {
//       setIsTimerActive(true);
//     }
//   }, []); // Only on mount

//   useEffect(() => {
//     if (isTimerActive && timeRemaining !== null && timeRemaining > 0) {
//       timerRef.current = setTimeout(() => {
//         setTimeRemaining(prev => {
//           if (prev === null || prev <= 1) {
//             // Time's up - auto submit
//             setIsTimerActive(false);
//             handleAutoSubmit();
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

//   // Auto-hide feedback after 5 seconds
//   useEffect(() => {
//     if (showFeedback && submissionStatus === 'success') {
//       const timer = setTimeout(() => {
//         setShowFeedback(false);
//       }, 5000);
//       return () => clearTimeout(timer);
//     }
//   }, [showFeedback, submissionStatus]);

//   // Format time for display
//   const formatTime = (seconds: number) => {
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = seconds % 60;
//     return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
//   };

//   // Fetch quiz data when activeAgendaId changes and no preloaded data exists
//   useEffect(() => {
//     if (activeAgendaId && !preloadedQuizData && !hasInitialized) {
//       fetchQuizData();
//       setHasInitialized(true);
//     }
//   }, [activeAgendaId, preloadedQuizData, hasInitialized]);

//   // Reset initialization flag when agenda changes
//   useEffect(() => {
//     if (!activeAgendaId) {
//       setHasInitialized(false);
//       // Don't reset quiz state here - let it persist
//     }
//   }, [activeAgendaId]);

//   // Clear state when addon changes to something else
//   useEffect(() => {
//     if (activeAddonType !== 'Quiz' && activeAgendaId && quizStateStore[activeAgendaId]) {
//       // If addon changed but quiz wasn't completed, preserve the state
//       if (!quizStateStore[activeAgendaId].quizCompleted) {
//         console.log("Quiz addon stopped but quiz not completed - preserving state");
//       }
//     }
//   }, [activeAddonType, activeAgendaId]);

//   // Only render if quiz addon is active - check after all hooks
//   if (activeAddonType !== 'Quiz' || !isParticipationAvailable) {
//     console.log("Quiz not active or not available");
//     return null;
//   }

//   const fetchQuizData = async () => {
//     if (!activeAgendaId) return;

//     console.log("Fetching quiz data for agenda:", activeAgendaId);

//     try {
//       await getQuizQuestions(activeAgendaId);
//       console.log("Quiz data fetched successfully");
//     } catch (error) {
//       console.error("Error fetching quiz data:", error);
//     }
//   };

//   const handleAnswerChange = (questionId: string, answer: string) => {
//     setAnswers((prev) => ({
//       ...prev,
//       [questionId]: answer,
//     }));
//   };

//   const handleAutoSubmit = async () => {
//     setShowResults(true);
//     await submitQuiz();
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
//     questions.forEach((question: any) => {
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
//     return questions.map((question: any) => {
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
//       console.error("No public key or active agenda ID found, unable to submit quiz");
//       setSubmissionStatus('error');
//       setSubmissionMessage('Unable to submit quiz: Missing wallet connection');
//       setShowFeedback(true);
//       return;
//     }

//     // Prevent duplicate submissions
//     if (submissionStatus === 'submitting' || quizCompleted) {
//       console.log("Quiz already submitted or submitting");
//       return;
//     }

//     setSubmissionStatus('submitting');
//     setSubmissionMessage('Submitting your quiz answers...');
//     setShowFeedback(true);

//     try {
//       const quizAnswers = prepareAnswersForSubmission();
//       const totalScore = calculateScore();

//       const submitRequest = {
//         wallet: publicKey.toString(),
//         answers: quizAnswers,
//         totalScore: totalScore,
//       };
      
//       await submitQuizAnswers(activeAgendaId, submitRequest);
      
//       setSubmissionStatus('success');
//       setSubmissionMessage(`Quiz submitted successfully! Your score: ${totalScore}/${totalPoints}`);
//       setQuizCompleted(true);
//       setShowFeedback(true);
      
//       console.log("Quiz submitted successfully");
//     } catch (error) {
//       console.error("Error submitting quiz:", error);
//       setSubmissionStatus('error');
//       setSubmissionMessage('Failed to submit quiz. Please try again.');
//       setShowFeedback(true);
//     }
//   };

//   const startQuiz = () => {
//     setQuizStarted(true);
    
//     // Check if we're resuming with existing time
//     if (timeRemaining === null) {
//       // Initialize timer if quiz has duration (convert minutes to seconds)
//       const durationInMinutes = Number(quiz?.duration);
//       if (durationInMinutes && durationInMinutes > 0) {
//         const durationInSeconds = durationInMinutes * 60;
//         setTimeRemaining(durationInSeconds);
//         setIsTimerActive(true);
//       }
//     } else {
//       // Resume timer from where it left off
//       setIsTimerActive(true);
//     }
//   };

//   const resetQuiz = () => {
//     if (activeAgendaId) {
//       delete quizStateStore[activeAgendaId];
//     }
//     setCurrentQuestionIndex(0);
//     setAnswers({});
//     setShowResults(false);
//     setQuizStarted(false);
//     setTimeRemaining(null);
//     setIsTimerActive(false);
//     setQuizCompleted(false);
//     setSubmissionStatus('idle');
//     setSubmissionMessage('');
//     setShowFeedback(false);
//   };

//   // Show loading state
//   if (isLoading || (!quiz && activeAgendaId)) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8 relative overflow-hidden">
//         <div className="absolute inset-0 overflow-hidden">
//           <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-purple-200 rounded-full opacity-20 blur-3xl animate-pulse"></div>
//           <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-purple-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
//         </div>
        
//         <div className="max-w-2xl mx-auto relative">
//           <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
//             <div className="text-center">
//               <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
//               <p className="text-gray-600">
//                 {isPreloadingQuiz ? "Preparing quiz..." : "Loading quiz..."}
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Show error state if no quiz data after loading
//   if (!quiz || !quiz.questions || quiz.questions.length === 0) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8">
//         <div className="max-w-2xl mx-auto">
//           <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
//             <div className="text-center">
//               <p className="text-red-500 mb-4">No quiz data available</p>
//               <div className="space-x-2">
//                 <button
//                   onClick={fetchQuizData}
//                   className="bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
//                 >
//                   Retry Fetch
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!quizStarted) {
//     const hasProgress = Object.keys(answers).length > 0 || currentQuestionIndex > 0;
    
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8 relative overflow-hidden">
//         <div className="absolute inset-0 overflow-hidden">
//           <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
//           <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
//         </div>

//         <div className="max-w-2xl mx-auto relative">
//           <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
//             <div className="text-center">
//               <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent mb-4">
//                 {quiz?.title || "Quiz"}
//               </h1>
//               {quiz?.description && (
//                 <p className="text-gray-600 mb-8 leading-relaxed">{quiz.description}</p>
//               )}
              
//               {hasProgress && (
//                 <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
//                   <p className="text-yellow-800 font-medium mb-2">
//                     ðŸ“ You have progress saved from a previous session
//                   </p>
//                   <p className="text-yellow-700 text-sm">
//                     Questions answered: {Object.keys(answers).length} / {quiz.questions.length}
//                   </p>
//                   {timeRemaining !== null && (
//                     <p className="text-yellow-700 text-sm mt-1">
//                       Time remaining: {formatTime(timeRemaining)}
//                     </p>
//                   )}
//                 </div>
//               )}
              
//               <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 mb-8">
//                 <p className="text-lg text-gray-700 mb-2">
//                   <span className="font-semibold">{quiz.questions.length}</span>{" "}
//                   questions
//                 </p>
//                 <p className="text-lg text-gray-700 mb-2">
//                   Total points: <span className="font-semibold">{totalPoints}</span>
//                 </p>
//                 {quiz?.duration && Number(quiz.duration) > 0 && (
//                   <p className="text-lg text-gray-700">
//                     Time limit: <span className="font-semibold">{Number(quiz.duration)} minutes</span>
//                   </p>
//                 )}
//               </div>
              
//               <div className="flex justify-center gap-4">
//                 <button
//                   onClick={startQuiz}
//                   className="bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-4 px-12 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
//                 >
//                   {hasProgress ? "Resume Quiz" : "Start Quiz"}
//                 </button>
                
//                 {hasProgress && (
//                   <button
//                     onClick={resetQuiz}
//                     className="bg-white text-purple-600 border-2 border-purple-600 font-semibold py-4 px-8 rounded-xl hover:bg-purple-50 transform hover:-translate-y-0.5 transition-all duration-200"
//                   >
//                     Start Over
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (showResults) {
//     const score = calculateScore();
//     const percentage = Math.round((score / totalPoints) * 100);

//     return (
//       <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8 relative overflow-hidden">
//         <div className="absolute inset-0 overflow-hidden">
//           <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
//           <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
//         </div>

//         {/* Submission Feedback Toast */}
//         {showFeedback && (
//           <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
//             showFeedback ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
//           }`}>
//             <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
//               submissionStatus === 'submitting' ? 'bg-blue-500 text-white' :
//               submissionStatus === 'success' ? 'bg-green-500 text-white' :
//               submissionStatus === 'error' ? 'bg-red-500 text-white' :
//               'bg-gray-500 text-white'
//             }`}>
//               {submissionStatus === 'submitting' && (
//                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//               )}
//               {submissionStatus === 'success' && (
//                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                 </svg>
//               )}
//               {submissionStatus === 'error' && (
//                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                 </svg>
//               )}
//               <span>{submissionMessage}</span>
//             </div>
//           </div>
//         )}

//         <div className="max-w-2xl mx-auto relative">
//           <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
//             <div className="text-center">
//               <h2 className="text-5xl font-bold bg-gradient-to-r from-purple-500 to-purple-700 bg-clip-text text-transparent mb-8">
//                 Quiz Complete!
//               </h2>

//               <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white p-8 rounded-2xl mb-8 shadow-lg">
//                 <div className="text-5xl font-bold mb-2">
//                   {score} / {totalPoints}
//                 </div>
//                 <div className="text-2xl opacity-90">{percentage}%</div>
//               </div>

//               {/* Quiz submission status */}
//               {quizCompleted && (
//                 <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
//                   <p className="text-green-800 font-medium flex items-center justify-center gap-2">
//                     <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                     </svg>
//                     Quiz successfully submitted to the host
//                   </p>
//                 </div>
//               )}

//               <div className="space-y-4">
//                 {questions.map((question: any, index: number) => {
//                   const userAnswer = answers[question.id] || "";
//                   const isCorrect =
//                     userAnswer.toLowerCase().trim() ===
//                     question.correctAnswer.toLowerCase().trim();

//                   return (
//                     <div
//                       key={question.id}
//                       className={`p-5 rounded-xl text-left border-l-4 ${
//                         isCorrect 
//                           ? 'bg-green-50 border-green-500' 
//                           : 'bg-red-50 border-red-500'
//                       }`}
//                     >
//                       <p className="font-semibold text-gray-800 mb-3">
//                         Question {index + 1}: {question.questionText}
//                       </p>
//                       <div className="space-y-1 text-sm">
//                         <p>
//                           <span className="font-medium text-gray-600">Your answer:</span>{" "}
//                           <span
//                             className={
//                               isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"
//                             }
//                           >
//                             {userAnswer || "No answer"}
//                           </span>
//                         </p>
//                         <p>
//                           <span className="font-medium text-gray-600">Correct answer:</span>{" "}
//                           <span className="text-green-600 font-medium">
//                             {question.correctAnswer}
//                           </span>
//                         </p>
//                         <p>
//                           <span className="font-medium text-gray-600">Points:</span>{" "}
//                           <span
//                             className={
//                               isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"
//                             }
//                           >
//                             {isCorrect ? question.points : 0} / {question.points}
//                           </span>
//                         </p>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>

//               {/* Retry button if submission failed */}
//               {submissionStatus === 'error' && !quizCompleted && (
//                 <button
//                   onClick={submitQuiz}
//                   className="mt-6 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
//                 >
//                   Retry Submission
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const currentQuestion = questions[currentQuestionIndex];
//   if (!currentQuestion) return null;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8 relative overflow-hidden">
//       <div className="absolute inset-0 overflow-hidden">
//         <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
//         <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
//       </div>

//       <div className="max-w-2xl mx-auto relative">
//         <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
//           {/* Timer display */}
//           {timeRemaining !== null && (
//             <div className={`mb-6 p-4 rounded-xl text-center font-semibold transition-all duration-300 ${
//               timeRemaining <= 60 
//                 ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' 
//                 : timeRemaining <= 300
//                 ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
//                 : 'bg-purple-50 text-purple-600 border border-purple-200'
//             }`}>
//               <div className="text-lg">
//                 Time remaining: {formatTime(timeRemaining)}
//               </div>
//               {timeRemaining <= 60 && (
//                 <div className="text-sm mt-1">âš ï¸ Less than 1 minute remaining!</div>
//               )}
//             </div>
//           )}

//           {/* Progress bar */}
//           <div className="mb-6">
//             <div className="flex justify-between text-sm text-gray-600 mb-3">
//               <span>
//                 Question {currentQuestionIndex + 1} of {questions.length}
//               </span>
//               <span className="font-medium text-purple-600">{currentQuestion.points} points</span>
//             </div>
//             <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
//               <div
//                 className="h-full bg-gradient-to-r from-purple-500 to-purple-700 rounded-full transition-all duration-500"
//                 style={{
//                   width: `${
//                     ((currentQuestionIndex + 1) / questions.length) * 100
//                   }%`,
//                 }}
//               ></div>
//             </div>
//           </div>

//           {/* Question */}
//           <div className="mb-8">
//             <h2 className="text-xl font-semibold text-gray-800 mb-6 leading-relaxed">
//               {currentQuestion.questionText}
//             </h2>

//             {/* Multiple choice */}
//             {currentQuestion.isMultiChoice && currentQuestion.options.length > 0 ? (
//               <div className="space-y-3">
//                 {currentQuestion.options.map((option: string, index: number) => (
//                   <label
//                     key={index}
//                     className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
//                       answers[currentQuestion.id] === option
//                         ? 'bg-purple-50 border-purple-400 shadow-md'
//                         : 'bg-white border-gray-200 hover:bg-purple-50 hover:border-purple-300 hover:translate-x-1'
//                     }`}
//                   >
//                     <input
//                       type="radio"
//                       name={`question-${currentQuestion.id}`}
//                       value={option}
//                       checked={answers[currentQuestion.id] === option}
//                       onChange={(e) =>
//                         handleAnswerChange(currentQuestion.id, e.target.value)
//                       }
//                       className="w-5 h-5 text-purple-600 focus:ring-purple-500"
//                     />
//                     <span className="text-gray-700">{option}</span>
//                   </label>
//                 ))}
//               </div>
//             ) : (
//               /* Text input for non-multiple choice */
//               <div>
//                 <input
//                   type="text"
//                   value={answers[currentQuestion.id] || ""}
//                   onChange={(e) =>
//                     handleAnswerChange(currentQuestion.id, e.target.value)
//                   }
//                   placeholder="Type your answer here..."
//                   className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-200"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Navigation buttons */}
//           <div className="flex justify-between items-center pt-6 border-t border-gray-100">
//             <button
//               onClick={handlePrevious}
//               disabled={currentQuestionIndex === 0}
//               className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
//                 currentQuestionIndex === 0
//                   ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                   : "bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50 hover:-translate-y-0.5"
//               }`}
//             >
//               Previous
//             </button>

//             <button
//               onClick={handleNext}
//               disabled={!answers[currentQuestion.id]}
//               className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
//                 !answers[currentQuestion.id]
//                   ? "bg-gray-200 text-gray-400 cursor-not-allowed"
//                   : currentQuestionIndex === questions.length - 1
//                   ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg hover:-translate-y-0.5"
//                   : "bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:shadow-lg hover:-translate-y-0.5"
//               }`}
//             >
//               {currentQuestionIndex === questions.length - 1
//                 ? "Finish Quiz"
//                 : "Next"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default QuizTaker;

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import {
  useGetQuizQuestions,
  useSubmitQuizAnswers,
  useRequirePublicKey,
} from "@vidbloq/react";
import { useStream } from "../../hooks";

const QuizTaker = () => {
  const { getQuizQuestions, quiz, isLoading, refresh } = useGetQuizQuestions();
  const { submitQuizAnswers, isLoading: submitting } = useSubmitQuizAnswers();
  const { publicKey } = useRequirePublicKey();
  const { 
    activeAgendaId, 
    activeAddonType,
    isParticipationAvailable,
    remainingTime,
    isTimerRunning
  } = useStream();
  
  const questions = quiz?.questions || [];

  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  console.log("QuizTaker - State:", {
    activeAgendaId,
    activeAddonType,
    isParticipationAvailable,
    hasQuiz: !!quiz,
    questionsCount: questions.length,
    quizStarted,
    currentQuestionIndex,
  });

  // Calculate total possible points
  const totalPoints = questions.reduce((sum: number, q: any) => sum + q.points, 0);

  // Format time for display
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Auto-hide feedback
  useEffect(() => {
    if (showFeedback && submissionStatus === 'success') {
      const timer = setTimeout(() => {
        setShowFeedback(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showFeedback, submissionStatus]);

  // Fetch quiz data when activeAgendaId changes
  useEffect(() => {
    if (activeAgendaId && activeAddonType === 'Quiz') {
      getQuizQuestions(activeAgendaId);
    }
  }, [activeAgendaId, activeAddonType, getQuizQuestions]);

  // Handle timer expiry
  useEffect(() => {
    if (remainingTime === 0 && quizStarted && !showResults) {
      handleAutoSubmit();
    }
  }, [remainingTime, quizStarted, showResults]);

  // Only render if quiz addon is active
  if (activeAddonType !== 'Quiz' || !isParticipationAvailable) {
    console.log("Quiz not active or not available");
    return null;
  }

  const handleRefresh = async () => {
    if (activeAgendaId) {
      await refresh(activeAgendaId);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleAutoSubmit = async () => {
    setShowResults(true);
    await submitQuiz();
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
      submitQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
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
      console.error("No public key or active agenda ID found");
      setSubmissionStatus('error');
      setSubmissionMessage('Unable to submit quiz: Missing wallet connection');
      setShowFeedback(true);
      return;
    }

    if (submissionStatus === 'submitting' || quizCompleted) {
      console.log("Quiz already submitted or submitting");
      return;
    }

    setSubmissionStatus('submitting');
    setSubmissionMessage('Submitting your quiz answers...');
    setShowFeedback(true);

    try {
      const quizAnswers = prepareAnswersForSubmission();
      const totalScore = calculateScore();

      const response = await submitQuizAnswers(activeAgendaId, {
        wallet: publicKey.toString(),
        answers: quizAnswers,
        totalScore: totalScore,
      });
      
      if (response) {
        setSubmissionStatus('success');
        setSubmissionMessage(`Quiz submitted successfully! Your score: ${totalScore}/${totalPoints}`);
        setQuizCompleted(true);
        setShowFeedback(true);
        console.log("Quiz submitted successfully");
      }
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      setSubmissionStatus('error');
      setSubmissionMessage(error.message || 'Failed to submit quiz. Please try again.');
      setShowFeedback(true);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
  };

  // const resetQuiz = () => {
  //   setCurrentQuestionIndex(0);
  //   setAnswers({});
  //   setShowResults(false);
  //   setQuizStarted(false);
  //   setQuizCompleted(false);
  //   setSubmissionStatus('idle');
  //   setSubmissionMessage('');
  //   setShowFeedback(false);
  // };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8 relative overflow-hidden">
        <div className="max-w-2xl mx-auto relative">
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading quiz...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no quiz data
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
            <div className="text-center">
              <p className="text-red-500 mb-4">No quiz data available</p>
              <button
                onClick={handleRefresh}
                className="bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 p-8 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
        </div>

        <div className="max-w-2xl mx-auto relative">
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-clip-text text-bg-primary mb-4">
                {quiz?.title || "Quiz"}
              </h1>
              {quiz?.description && (
                <p className="text-gray-600 mb-8 leading-relaxed">{quiz.description}</p>
              )}
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 mb-8">
                <p className="text-lg text-gray-700 mb-2">
                  <span className="font-semibold">{quiz.questions.length}</span> questions
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
                className="bg-purple-500 text-white font-semibold py-4 px-12 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
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
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
        </div>

        {/* Submission Feedback Toast */}
        {showFeedback && (
          <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
            showFeedback ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}>
            <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
              submissionStatus === 'submitting' ? 'bg-blue-500 text-white' :
              submissionStatus === 'success' ? 'bg-green-500 text-white' :
              submissionStatus === 'error' ? 'bg-red-500 text-white' :
              'bg-gray-500 text-white'
            }`}>
              {submissionStatus === 'submitting' && (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{submissionMessage}</span>
            </div>
          </div>
        )}

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

              {quizCompleted && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                  <p className="text-green-800 font-medium flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Quiz successfully submitted to the host
                  </p>
                </div>
              )}

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
                          <span className={isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
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
                          <span className={isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {isCorrect ? question.points : 0} / {question.points}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {submissionStatus === 'error' && !quizCompleted && (
                <button
                  onClick={submitQuiz}
                  disabled={submitting}
                  className="mt-6 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Retry Submission'}
                </button>
              )}
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
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-purple-300 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="max-w-2xl mx-auto relative">
        <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
          {/* Timer display */}
          {isTimerRunning && remainingTime !== null && (
            <div className={`mb-6 p-4 rounded-xl text-center font-semibold transition-all duration-300 ${
              remainingTime <= 60 
                ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' 
                : remainingTime <= 300
                ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                : 'bg-purple-50 text-purple-600 border border-purple-200'
            }`}>
              <div className="text-lg">
                Time remaining: {formatTime(remainingTime)}
              </div>
              {remainingTime <= 60 && (
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
                  width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
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
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
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
              {currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTaker;