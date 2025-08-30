



const PollTaker = () => {
  return (
    <div>PollTaker</div>
  )
}

export default PollTaker

// import { useState, useEffect, useCallback } from "react";
// import { useGetAgendaDetails, useSubmitPollVote, useRequirePublicKey } from "@vidbloq/react";
// import { FaVoteYea, FaCheckCircle, FaUsers, FaClock, FaLock, FaUnlock, FaEye } from "react-icons/fa";
// import { FiAlertTriangle, FiLoader } from "react-icons/fi";
// import { useStream } from "../../hooks";

// interface PollVoteResponse {
//   message: string;
//   selectedOption: string;
//   agendaId: string;
//   pollTitle: string | null;
// }

// const PollTaker = () => {
//   const { getAgenda, agenda, isLoading, refresh } = useGetAgendaDetails();
//   const { submitPollVote, isLoading: submitting } = useSubmitPollVote();
//   const { publicKey } = useRequirePublicKey();
//   const { 
//     activeAgendaId, 
//     activeAddonType,
//     isParticipationAvailable,
//     remainingTime,
//     isTimerRunning
//   } = useStream();

//   // State management
//   const [selectedOption, setSelectedOption] = useState<string>('');
//   const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
//   const [submissionResponse, setSubmissionResponse] = useState<PollVoteResponse | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
//   const [isPollExpired, setIsPollExpired] = useState<boolean>(false);
  
//   const pollContent = agenda?.pollContent;
//   const options = pollContent?.options || [];

//   console.log("PollTaker - State:", {
//     activeAgendaId,
//     activeAddonType,
//     isParticipationAvailable,
//     hasAgenda: !!agenda,
//     options: options.length
//   });

//   // Format time for display
//   const formatTime = useCallback((seconds: number) => {
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = seconds % 60;
//     return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
//   }, []);

//   // Fetch agenda data when activeAgendaId changes
//   useEffect(() => {
//     if (activeAgendaId && activeAddonType === 'Poll') {
//       getAgenda(activeAgendaId);
//     }
//   }, [activeAgendaId, activeAddonType, getAgenda]);

//   // Check if poll is expired
//   useEffect(() => {
//     if (remainingTime === 0 && !hasSubmitted) {
//       setIsPollExpired(true);
//       if (selectedOption) {
//         submitPoll();
//       }
//     }
//   }, [remainingTime, hasSubmitted, selectedOption]);

//   // Only render if poll addon is active
//   if (activeAddonType !== 'Poll' || !isParticipationAvailable) {
//     console.log("Poll not active or not available");
//     return null;
//   }

//   const handleOptionSelect = (option: string): void => {
//     if (isPollExpired || hasSubmitted) return;
//     setSelectedOption(option);
//     setError(null);
//     setShowConfirmation(false);
//   };

//   const handleSubmitClick = (): void => {
//     if (!selectedOption) {
//       setError('Please select an option before submitting your vote');
//       return;
//     }
//     setShowConfirmation(true);
//   };

//   const submitPoll = async (): Promise<void> => {
//     if (!publicKey || !activeAgendaId || !selectedOption) {
//       setError('Missing required data to submit vote');
//       return;
//     }

//     try {
//       const response = await submitPollVote({
//         agendaId: activeAgendaId,
//         selectedOption,
//         wallet: publicKey.toString()
//       });
      
//       if (response) {
//         setSubmissionResponse(response);
//         setHasSubmitted(true);
//         setError(null);
//       }
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     } catch (error: any) {
//       console.error("Error submitting poll vote:", error);
//       setError(error.message || 'Failed to submit vote. Please try again.');
//     }
//   };

//   const confirmSubmission = async (): Promise<void> => {
//     await submitPoll();
//     setShowConfirmation(false);
//   };

//   const cancelSubmission = (): void => {
//     setShowConfirmation(false);
//   };

//   const handleRefresh = async () => {
//     if (activeAgendaId) {
//       await refresh(activeAgendaId);
//     }
//   };

//   // Show loading state
//   if (isLoading) {
//     return (
//       <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
//         <div className="text-center">
//           <FiLoader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
//           <p className="text-gray-600">Loading poll...</p>
//         </div>
//       </div>
//     );
//   }

//   // Show error state if no agenda data
//   if (!agenda || !pollContent || options.length === 0) {
//     return (
//       <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
//         <div className="text-center">
//           <FiAlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
//           <p className="text-red-600">No poll data available</p>
//           <button
//             onClick={handleRefresh}
//             className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Show expired state
//   if (isPollExpired && !hasSubmitted) {
//     return (
//       <div className="max-w-2xl mx-auto p-6">
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//           <div className="bg-red-50 border-b border-red-200 px-6 py-4">
//             <div className="flex items-center">
//               <FaLock className="w-6 h-6 text-red-600 mr-3" />
//               <div>
//                 <h2 className="text-lg font-semibold text-red-900">Poll Ended</h2>
//                 <p className="text-sm text-red-700 mt-1">Time has expired for this poll.</p>
//               </div>
//             </div>
//           </div>
//           <div className="p-6 text-center">
//             <h3 className="text-lg font-medium text-gray-900 mb-2">{agenda.title}</h3>
//             <p className="text-gray-600 mb-6">The voting period for this poll has ended.</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-2xl mx-auto p-6">
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
//         {/* Timer display */}
//         {isTimerRunning && remainingTime !== null && !hasSubmitted && (
//           <div className="mb-4">
//             <div className={`text-center p-3 rounded-lg ${
//               remainingTime <= 60 ? 'bg-red-100 text-red-800' : 
//               remainingTime <= 300 ? 'bg-yellow-100 text-yellow-800' : 
//               'bg-blue-100 text-blue-800'
//             }`}>
//               <div className="text-lg font-semibold">
//                 Time remaining: {formatTime(remainingTime)}
//               </div>
//               {remainingTime <= 60 && (
//                 <div className="text-sm mt-1">⚠️ Less than 1 minute remaining!</div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Poll Header */}
//         <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200 px-6 py-6">
//           <div className="flex items-start justify-between">
//             <div className="flex-1">
//               <div className="flex items-center mb-2">
//                 <FaVoteYea className="w-6 h-6 text-indigo-600 mr-3" />
//                 <h2 className="text-xl font-bold text-gray-900">{agenda.title || "Poll"}</h2>
//               </div>
//               {agenda.description && (
//                 <p className="text-gray-700 mb-4">{agenda.description}</p>
//               )}
              
//               {/* Poll Status Indicators */}
//               <div className="flex flex-wrap gap-4 text-sm">
//                 <div className="flex items-center gap-1">
//                   <FaEye className="w-4 h-4 text-blue-600" />
//                   <span className="text-blue-700 font-medium">Public Poll</span>
//                 </div>
                
//                 {agenda.duration && Number(agenda.duration) > 0 && (
//                   <div className="flex items-center gap-1">
//                     <FaClock className="w-4 h-4 text-orange-600" />
//                     <span className="text-orange-700 font-medium">
//                       {Number(agenda.duration)} minute{Number(agenda.duration) !== 1 ? 's' : ''} limit
//                     </span>
//                   </div>
//                 )}
                
//                 {hasSubmitted && (
//                   <div className="flex items-center gap-1">
//                     <FaCheckCircle className="w-4 h-4 text-green-600" />
//                     <span className="text-green-700 font-medium">Vote submitted</span>
//                   </div>
//                 )}
//               </div>
//             </div>
            
//             <div className="ml-4">
//               <FaUnlock className="w-8 h-8 text-indigo-500" />
//             </div>
//           </div>
//         </div>

//         {/* Poll Options */}
//         <div className="p-6">
//           <div className="space-y-4 mb-6">
//             {options.map((option: string, index: number) => {
//               const isSelected = selectedOption === option;
//               const isDisabled = hasSubmitted || isPollExpired;
              
//               return (
//                 <div
//                   key={index}
//                   onClick={() => handleOptionSelect(option)}
//                   className={`
//                     relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
//                     ${isSelected 
//                       ? 'border-indigo-500 bg-indigo-50 shadow-md' 
//                       : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
//                     }
//                     ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
//                   `}
//                 >
//                   <div className="flex items-center">
//                     <div className={`
//                       w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center transition-all
//                       ${isSelected 
//                         ? 'border-indigo-500 bg-indigo-500' 
//                         : 'border-gray-300'
//                       }
//                     `}>
//                       {isSelected && (
//                         <div className="w-2 h-2 rounded-full bg-white"></div>
//                       )}
//                     </div>
                    
//                     <div className="flex-1">
//                       <span className={`
//                         text-sm font-medium
//                         ${isSelected ? 'text-indigo-900' : 'text-gray-700'}
//                       `}>
//                         {option}
//                       </span>
//                     </div>
                    
//                     {isSelected && (
//                       <FaCheckCircle className="w-5 h-5 text-indigo-600 ml-2" />
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {/* Error Message */}
//           {error && (
//             <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
//               <div className="flex items-center">
//                 <FiAlertTriangle className="w-5 h-5 text-red-600 mr-3" />
//                 <span className="text-sm text-red-700">{error}</span>
//               </div>
//             </div>
//           )}

//           {/* Wallet Info */}
//           {publicKey && (
//             <div className="mb-6 p-4 bg-gray-50 rounded-lg">
//               <div className="flex items-center text-sm text-gray-600">
//                 <FaUsers className="w-4 h-4 mr-2" />
//                 <span>Voting as: {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-4)}</span>
//               </div>
//             </div>
//           )}

//           {/* Submit Button */}
//           {!hasSubmitted && (
//             <button
//               onClick={handleSubmitClick}
//               disabled={!selectedOption || submitting || isPollExpired}
//               className={`
//                 w-full flex items-center justify-center px-6 py-4 rounded-lg font-medium text-lg transition-all
//                 ${!selectedOption || submitting || isPollExpired
//                   ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
//                   : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
//                 }
//               `}
//             >
//               {submitting ? (
//                 <>
//                   <FiLoader className="w-5 h-5 mr-2 animate-spin" />
//                   Submitting Vote...
//                 </>
//               ) : (
//                 <>
//                   <FaVoteYea className="w-5 h-5 mr-2" />
//                   Cast Your Vote
//                 </>
//               )}
//             </button>
//           )}

//           {/* Confirmation Dialog */}
//           {showConfirmation && (
//             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//               <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
//                 <div className="p-6">
//                   <div className="flex items-center mb-4">
//                     <FaVoteYea className="w-6 h-6 text-indigo-600 mr-3" />
//                     <h3 className="text-lg font-semibold text-gray-900">
//                       Confirm Your Vote
//                     </h3>
//                   </div>
                  
//                   <div className="mb-6">
//                     <p className="text-gray-700 mb-3">You are about to vote for:</p>
//                     <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
//                       <p className="font-medium text-indigo-900">{selectedOption}</p>
//                     </div>
                    
//                     <p className="text-sm text-amber-600 mt-3 flex items-center">
//                       <FiAlertTriangle className="w-4 h-4 mr-1" />
//                       This vote cannot be changed once submitted.
//                     </p>
//                   </div>
                  
//                   <div className="flex gap-3">
//                     <button
//                       onClick={cancelSubmission}
//                       className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       onClick={confirmSubmission}
//                       className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
//                     >
//                       Confirm Vote
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Success Message */}
//           {hasSubmitted && submissionResponse && (
//             <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
//               <div className="flex items-center">
//                 <FaCheckCircle className="w-5 h-5 text-green-600 mr-3" />
//                 <div>
//                   <p className="text-sm font-medium text-green-900">
//                     {submissionResponse.message}
//                   </p>
//                   <p className="text-xs text-green-700 mt-1">
//                     Your vote for "{submissionResponse.selectedOption}" has been recorded.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PollTaker;