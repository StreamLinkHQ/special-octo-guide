// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useState, useEffect } from "react";
// import {
//   useParticipantList,
//   useStreamContext,
//   useRequirePublicKey,
//   useContest,
//   type ParticipantId,
// } from "@vidbloq/react";
// import { useContestConfig } from "../../hooks";
// import { isSimultaneousConfig } from "../../utils";
// import { Icon } from "../icons";

// function Simultaneous() {
//   const [showContestMode, setShowContestMode] = useState(false);
//   const [selectedContestants, setSelectedContestants] = useState<Set<string>>(new Set());
//   const [voteStatus, setVoteStatus] = useState<{ [key: string]: string }>({});
//   const [showQuickResults, setShowQuickResults] = useState(false);
//   const [criteriaScores, setCriteriaScores] = useState<Record<string, Record<string, number>>>({});
//   const [showJudgeManagement, setShowJudgeManagement] = useState(false);
//   const { participants } = useParticipantList();

//   const { config: contestConfig } = useContestConfig();
  
//   // Type-safe access to simultaneous-specific properties
//   const getSimultaneousValues = () => {
//     if (isSimultaneousConfig(contestConfig)) {
//       return {
//         maxDuration: contestConfig.rules.maxDuration,
//         roundsCount: contestConfig.rules.roundsCount,
//       };
//     }
//     // Default values for turn-based mode
//     return {
//       maxDuration: 180,
//       roundsCount: 3,
//     };
//   };

//   const { maxDuration, roundsCount } = getSimultaneousValues();

//   // Get voting criteria
//   const getVotingCriteria = () => {
//     if (contestConfig.votingType === 'criteria' && contestConfig.votingCriteria) {
//       return contestConfig.votingCriteria;
//     }
//     return [{
//       id: 'overall',
//       name: 'Overall Score',
//       weight: 1,
//       description: 'Rate the overall performance'
//     }];
//   };

//   const votingCriteria = getVotingCriteria();

//   // Contest config
//   const config = {
//     mode: contestConfig.mode,
//     name: contestConfig.name,
//     features: {
//       voting: true,
//       elimination: contestConfig.features.elimination,
//       leaderboard: true,
//       timer: true,
//     },
//     rules: {
//       maxDuration,
//       votingDuration: contestConfig.rules.votingDuration,
//       roundsCount, 
//       minContestants: 2,
//       votingPermissions: contestConfig.rules.votingPermissions,
//       selfVoting: false,
//     },
//     scoring: {
//       type: "average" as const,
//       scoreRange: { min: 1, max: 10 },
//       aggregation: {
//         rounds: "latest" as const,
//         categories: "average" as const,
//       },
//     },
//   };

//   const contest = useContest(config);

//   useEffect(() => {
//     contest.events.on("state:change", ({ from, to }) => {
//       console.log(`Contest state changed from ${from} to ${to}`);
//       if (to === "ended") {
//         console.log("Contest has ended, timer should stop");
//       }
//     });
//   }, [contest.events]);

//   const {
//     streamMetadata: { creatorWallet },
//     identity,
//   } = useStreamContext();

//   const [submittedVotesByRound, setSubmittedVotesByRound] = useState<Map<number, Set<string>>>(new Map());

//   const { publicKey } = useRequirePublicKey();
//   const isHost = publicKey?.toString() === creatorWallet;

//   useEffect(() => {
//     if (contest.votingTimeRemaining > 0) {
//       const interval = setInterval(() => {
//         // The countdown is handled by the hook
//       }, 1000);
//       return () => clearInterval(interval);
//     }
//   }, [contest.votingTimeRemaining]);

//   // Clear submitted votes when a new voting phase starts
//   useEffect(() => {
//     if (contest.contestState === "voting") {
//       setVoteStatus({});
//       setCriteriaScores({});
//     }
//   }, [contest.contestState, contest.currentRound]);

//     console.log('Judge check:', {
//   identity,
//   judges: contest.judges,
//   isJudge: contest.judges.includes(identity as ParticipantId),
//   votingPermissions: contestConfig.rules.votingPermissions
// });

//   // Initialize contestants from selected participants
//   const handleStartContest = () => {
//     if (selectedContestants.size < 2) {
//       alert("Select at least 2 participants for the contest");
//       return;
//     }

//     // Convert selected participants to contestants
//     const contestantsList = Array.from(selectedContestants).map((id) =>
//       participants.find((p) => p.id === id)
//     ).filter((p): p is any => p !== undefined);

//     console.log({ contestantsList });

//     // Start contest with selected participants
//     contest.startContest(contestantsList);
//     setShowContestMode(false);
//   };

//   const handleQuickVote = (participantId: string, score: number) => {
//     contest.submitVote(participantId, score);
//     // Show quick feedback
//     const el = document.getElementById(`vote-${participantId}`);
//     if (el) {
//       el.classList.add("vote-submitted");
//       setTimeout(() => el.classList.remove("vote-submitted"), 1000);
//     }
//   };

//   const ContestIndicator = () => {
//     if (contest.contestState === "idle") return null;

//     return (
//       <div className="absolute top-4 left-4 z-10">
//         <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-2">
//           <Icon name="calendar" />
//           <span className="text-sm text-white">
//             Contest: Round {contest.currentRound}
//             {contest.contestState === "paused" && " (PAUSED)"}
//           </span>
//           {contest.timeRemaining > 0 &&
//             !contest.isEliminated &&
//             contest.contestState !== "paused" && (
//               <span className="text-xs text-gray-300">
//                 {Math.floor(contest.timeRemaining / 60)}:
//                 {(contest.timeRemaining % 60).toString().padStart(2, "0")}
//               </span>
//             )}
//           {isHost && contest.contestState === "active" && (
//             <button
//               onClick={() => contest.pauseContest()}
//               className="p-1 hover:bg-white/10 rounded text-white"
//             >
//               Pause
//             </button>
//           )}
//           {isHost && contest.contestState === "paused" && (
//             <button
//               onClick={() => contest.resumeContest()}
//               className="p-1 hover:bg-green-500/20 rounded text-white"
//             >
//               Resume
//             </button>
//           )}
//         </div>
//       </div>
//     );
//   };

//   // Floating vote buttons on participant videos
//   const ParticipantVoteOverlay = ({ participant }: { participant: any }) => {
//     if (contest.contestState !== "active" || !contest.canVote) return null;
//     if (participant.isEliminated) return null;

//     return (
//       <div
//         id={`vote-${participant.id}`}
//         className="absolute bottom-2 right-2 opacity-0 hover:opacity-100 transition-opacity"
//       >
//         <div className="flex space-x-1">
//           {[5, 7, 10].map((score) => (
//             <button
//               key={score}
//               onClick={() => handleQuickVote(participant.id, score)}
//               className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded hover:bg-purple-600 transition-colors"
//             >
//               {score}
//             </button>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   const handleVote = async (contestantId: string, score: number, criterionId?: string) => {
//     try {
//       setVoteStatus((prev) => ({ ...prev, [contestantId]: "submitting" }));
      
//       await contest.submitVote(contestantId, score, criterionId);

//       // Track votes for current round
//       setSubmittedVotesByRound((prev) => {
//         const newMap = new Map(prev);
//         const roundVotes = newMap.get(contest.currentRound) || new Set();
//         roundVotes.add(contestantId);
//         newMap.set(contest.currentRound, roundVotes);
//         return newMap;
//       });

//       setVoteStatus((prev) => ({ ...prev, [contestantId]: "submitted" }));

//       setTimeout(() => {
//         setVoteStatus((prev) => {
//           const newStatus = { ...prev };
//           delete newStatus[contestantId];
//           return newStatus;
//         });
//       }, 2000);
//     } catch (error) {
//       console.error("Failed to submit vote:", error);
//       setVoteStatus((prev) => ({ ...prev, [contestantId]: "error" }));
//     }
//   };

//   const handleCriteriaScore = (contestantId: string, criterionId: string, score: number) => {
//     setCriteriaScores(prev => ({
//       ...prev,
//       [contestantId]: {
//         ...prev[contestantId],
//         [criterionId]: score,
//       },
//     }));
//   };

//   const submitVotesForContestant = async (contestantId: string) => {
//     const scores = criteriaScores[contestantId];
//     if (!scores) return;

//     const allScored = votingCriteria.every(c => scores[c.id] && scores[c.id] > 0);
//     if (!allScored) {
//       alert('Please rate all criteria first');
//       return;
//     }

//     for (const criterion of votingCriteria) {
//       if (scores[criterion.id]) {
//         await handleVote(contestantId, scores[criterion.id], criterion.id);
//       }
//     }
//   };

//   const currentRoundVotes =
//     submittedVotesByRound.get(contest.currentRound) || new Set();

//   const VotingInterface = () => {
//     if (contest.contestState !== "voting") return null;

//     // Check if user is a judge
//     const isJudge = contest.judges.includes(identity as ParticipantId);
//     const isJudgeOnlyMode = contestConfig.rules.votingPermissions === "judges";
    
//     // Determine if user can vote - judges can always vote in judge-only mode
//     const userCanVote = isJudgeOnlyMode ? isJudge : contest.canVote;

//     if (!userCanVote) {
//       return (
//         <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center">
//           <div className="bg-gray-900 rounded-xl p-4">
//             <p className="text-white">
//               {isJudgeOnlyMode && !isJudge 
//                 ? "Voting is restricted to judges only" 
//                 : "Voting in progress (view only)"}
//             </p>
//             <p className="text-sm text-gray-400 mt-2">
//               Time remaining: {contest.votingTimeRemaining}s
//             </p>
//           </div>
//         </div>
//       );
//     }

//     return (
//       <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center">
//         <div className="bg-gray-900 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
//           <div className="flex items-center justify-between mb-4">
//             <div className="flex items-center gap-3">
//               <h2 className="text-xl font-semibold text-white">
//                 Vote for Contestants
//               </h2>
//               {isJudge && (
//                 <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded-full font-medium">
//                   JUDGE
//                 </span>
//               )}
//             </div>
//             <span className="text-sm text-gray-400">
//               Time remaining: {contest.votingTimeRemaining}s
//             </span>
//           </div>

//           <div className="flex gap-6 flex-1 overflow-hidden">
//             {/* Voting Section */}
//             <div className="flex-1 overflow-y-auto">
//               <h3 className="text-sm text-gray-400 mb-3">
//                 {contestConfig.votingType === 'criteria' 
//                   ? 'Rate each contestant on all criteria' 
//                   : 'Select a score for each contestant'}
//               </h3>
//               <div className="space-y-4">
//                 {contest.contestants
//                   .filter(
//                     (c: any) => !c.isEliminated && c.participantId !== identity
//                   )
//                   .map((contestant: any) => {
//                     const hasSubmitted = currentRoundVotes.has(contestant.participantId);
//                     const scores = criteriaScores[contestant.participantId] || {};

//                     return (
//                       <div
//                         key={contestant.participantId}
//                         className={`bg-gray-800 rounded-lg p-4 transition-all ${
//                           hasSubmitted
//                             ? "ring-2 ring-green-500"
//                             : ""
//                         }`}
//                       >
//                         <div className="flex items-center justify-between mb-3">
//                           <div className="flex items-center space-x-3">
//                             <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
//                               {contestant.name ? contestant.name.charAt(0) : "?"}
//                             </div>
//                             <div>
//                               <p className="text-white font-medium">
//                                 {contestant.name}
//                               </p>
//                               <p className="text-xs text-gray-400">
//                                 Current Score: {contestant.score.toFixed(1)} | Votes:{" "}
//                                 {contest.getVoteCount(contestant.participantId)}
//                               </p>
//                             </div>
//                           </div>
//                           {voteStatus[contestant.participantId] && (
//                             <span
//                               className={`text-xs px-2 py-1 rounded ${
//                                 voteStatus[contestant.participantId] ===
//                                 "submitted"
//                                   ? "bg-green-600 text-white"
//                                   : voteStatus[contestant.participantId] ===
//                                     "submitting"
//                                   ? "bg-yellow-600 text-white"
//                                   : "bg-red-600 text-white"
//                               }`}
//                             >
//                               {voteStatus[contestant.participantId] ===
//                               "submitted"
//                                 ? "✓ Voted"
//                                 : voteStatus[contestant.participantId] ===
//                                   "submitting"
//                                 ? "Submitting..."
//                                 : "Error"}
//                             </span>
//                           )}
//                         </div>

//                         {hasSubmitted ? (
//                           <div className="text-green-400 text-center py-4">
//                             ✓ Vote Submitted
//                           </div>
//                         ) : contestConfig.votingType === 'criteria' ? (
//                           <>
//                             <div className="space-y-3">
//                               {votingCriteria.map(criterion => (
//                                 <div key={criterion.id}>
//                                   <div className="flex justify-between mb-1">
//                                     <span className="text-white text-sm">{criterion.name}</span>
//                                     <span className="text-gray-400 text-xs">
//                                       {Math.round(criterion.weight * 100)}%
//                                     </span>
//                                   </div>
//                                   <div className="grid grid-cols-10 gap-1">
//                                     {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
//                                       <button
//                                         key={score}
//                                         onClick={() => handleCriteriaScore(contestant.participantId, criterion.id, score)}
//                                         className={`py-2 text-xs rounded transition-all ${
//                                           scores[criterion.id] === score
//                                             ? "bg-purple-600 text-white"
//                                             : "bg-gray-700 hover:bg-gray-600 text-gray-300"
//                                         }`}
//                                       >
//                                         {score}
//                                       </button>
//                                     ))}
//                                   </div>
//                                 </div>
//                               ))}
//                             </div>
//                             <button
//                               onClick={() => submitVotesForContestant(contestant.participantId)}
//                               disabled={!votingCriteria.every(c => scores[c.id] > 0)}
//                               className={`w-full mt-4 py-2 rounded font-semibold ${
//                                 votingCriteria.every(c => scores[c.id] > 0)
//                                   ? "bg-purple-600 text-white hover:bg-purple-700"
//                                   : "bg-gray-700 text-gray-400 cursor-not-allowed"
//                               }`}
//                             >
//                               Submit Votes
//                             </button>
//                           </>
//                         ) : (
//                           <div className="grid grid-cols-10 gap-1">
//                             {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
//                               <button
//                                 key={score}
//                                 onClick={() => handleVote(contestant.participantId, score)}
//                                 disabled={hasSubmitted}
//                                 className={`py-2 text-xs rounded transition-all ${
//                                   hasSubmitted
//                                     ? "bg-gray-700 text-gray-500 cursor-not-allowed"
//                                     : "bg-gray-700 hover:bg-purple-600 text-white"
//                                 }`}
//                               >
//                                 {score}
//                               </button>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })}
//               </div>
//             </div>

//             {/* Live Leaderboard */}
//             <div className="w-80 bg-gray-800 rounded-lg p-4">
//               <h3 className="text-white font-semibold mb-3">
//                 Live Leaderboard
//               </h3>
//               <div className="space-y-2">
//                 {contest.leaderboard.length > 0 ? (
//                   contest.leaderboard.map((entry: any, idx: number) => (
//                     <div
//                       key={entry.participantId}
//                       className="flex items-center justify-between p-2 bg-gray-700 rounded"
//                     >
//                       <div className="flex items-center space-x-2">
//                         <span
//                           className={`text-sm font-bold ${
//                             idx === 0
//                               ? "text-yellow-400"
//                               : idx === 1
//                               ? "text-gray-300"
//                               : idx === 2
//                               ? "text-orange-400"
//                               : "text-gray-500"
//                           }`}
//                         >
//                           #{idx + 1}
//                         </span>
//                         <span className="text-white text-sm">{entry.name}</span>
//                       </div>
//                       <div className="text-right">
//                         <p className="text-white font-semibold">
//                           {entry.score.toFixed(1)}
//                         </p>
//                         <p className="text-xs text-gray-400">
//                           {entry.votes} votes
//                         </p>
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="text-gray-400 text-sm">No votes yet</p>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const HostControlBar = () => {
//     if (!isHost) return null;

//     return (
//       <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20">
//         <div className="bg-black/70 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-3">
//           {contest.contestState === "idle" && (
//             <button
//               onClick={() => setShowContestMode(true)}
//               className="flex items-center space-x-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-full text-sm transition-colors text-white"
//             >
//               <Icon name="calendar" />
//               <span>Start Contest</span>
//             </button>
//           )}

//           {contest.contestState === "active" && (
//             <>
//               <button
//                 onClick={() => contest.nextRound()}
//                 className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-full text-sm transition-colors text-white"
//               >
//                 <Icon name="calendar" />
//                 <span>Next Round</span>
//               </button>
//               <button
//                 onClick={() => setShowQuickResults(true)}
//                 className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-full text-sm transition-colors text-white"
//               >
//                 <Icon name="calendar" />
//                 <span>Scores</span>
//               </button>
//               {contestConfig.rules.votingPermissions === "judges" && (
//                 <button
//                   onClick={() => setShowJudgeManagement(!showJudgeManagement)}
//                   className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded-full text-sm transition-colors text-white"
//                 >
//                   <Icon name="calendar" />
//                   <span>Judges ({contest.judges.length})</span>
//                 </button>
//               )}
//             </>
//           )}

//           {contest.contestState === "active" && (
//             <button
//               onClick={() => contest.endContest()}
//               className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-full text-sm transition-colors text-white"
//             >
//               End
//             </button>
//           )}
//         </div>
//       </div>
//     );
//   };

//   // Judge Management Panel
//   const JudgeManagementPanel = () => {
//     if (!showJudgeManagement || !isHost) return null;

//     return (
//       <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2 bg-gray-900 rounded-xl p-4 w-80 max-h-96 overflow-y-auto z-30">
//         <div className="flex justify-between items-center mb-3">
//           <h3 className="text-white font-semibold">Manage Judges</h3>
//           <button
//             onClick={() => setShowJudgeManagement(false)}
//             className="text-gray-400 hover:text-white"
//           >
//             <Icon name="close" />
//           </button>
//         </div>
//         <div className="space-y-2">
//           {participants.map(participant => {
//             const isJudge = contest.judges.includes(participant.id as ParticipantId);
//             return (
//               <div
//                 key={participant.id}
//                 className="flex items-center justify-between p-2 bg-gray-800 rounded"
//               >
//                 <span className="text-white text-sm">{participant.userName}</span>
//                 <button
//                   onClick={() => {
//                     if (isJudge) {
//                       contest.removeJudge(participant.id);
//                     } else {
//                       contest.addJudge(participant.id);
//                     }
//                   }}
//                   className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
//                     isJudge
//                       ? 'bg-yellow-600 text-white hover:bg-red-600'
//                       : 'bg-gray-700 text-gray-300 hover:bg-yellow-600 hover:text-white'
//                   }`}
//                 >
//                   {isJudge ? 'Remove' : 'Add Judge'}
//                 </button>
//               </div>
//             );
//           })}
//         </div>
//         {contestConfig.rules.votingPermissions === "judges" && contest.judges.length === 0 && (
//           <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded">
//             <p className="text-xs text-yellow-200">
//               No judges assigned. Add judges to enable voting.
//             </p>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const ParticipantSelectionModal = () => {
//     if (!showContestMode) return null;

//     return (
//       <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center">
//         <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-xl font-semibold text-white">
//               Select Contest Participants
//             </h2>
//             <button
//               onClick={() => setShowContestMode(false)}
//               className="p-1 hover:bg-gray-800 rounded"
//             >
//               <Icon name="close" />
//             </button>
//           </div>

//           <div className="flex-1 overflow-y-auto mb-4">
//             <div className="space-y-2">
//               {participants.map((participant) => (
//                 <label
//                   key={participant.id}
//                   className="flex items-center space-x-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
//                 >
//                   <input
//                     type="checkbox"
//                     checked={selectedContestants.has(participant.id)}
//                     onChange={(e) => {
//                       const newSet = new Set(selectedContestants);
//                       if (e.target.checked) {
//                         newSet.add(participant.id);
//                       } else {
//                         newSet.delete(participant.id);
//                       }
//                       setSelectedContestants(newSet);
//                     }}
//                     className="w-4 h-4 text-purple-600"
//                   />
//                   <div className="flex-1 flex items-center space-x-3">
//                     <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-semibold text-white">
//                       {participant.userName.charAt(0)}
//                     </div>
//                     <span className="text-white">{participant.userName}</span>
//                   </div>
//                 </label>
//               ))}
//             </div>
//           </div>

//           <div className="flex items-center justify-between pt-4 border-t border-gray-800">
//             <span className="text-sm text-gray-400">
//               {selectedContestants.size} selected
//             </span>
//             <button
//               onClick={handleStartContest}
//               disabled={selectedContestants.size < 2}
//               className={`px-4 py-2 rounded-lg font-medium transition-colors ${
//                 selectedContestants.size >= 2
//                   ? "bg-purple-600 hover:bg-purple-700 text-white"
//                   : "bg-gray-700 text-gray-400 cursor-not-allowed"
//               }`}
//             >
//               Start Contest
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const QuickResultsOverlay = () => {
//     if (!showQuickResults) return null;

//     const sortedContestants = [...contest.contestants].sort(
//       (a: any, b: any) => b.score - a.score
//     );

//     return (
//       <div className="absolute top-20 right-4 z-20 bg-black/80 backdrop-blur-sm rounded-lg p-4 w-64">
//         <div className="flex items-center justify-between mb-3">
//           <h3 className="text-sm font-semibold text-white">Live Scores</h3>
//           <button
//             onClick={() => setShowQuickResults(false)}
//             className="p-1 hover:bg-white/10 rounded"
//           >
//             <Icon name="close" />
//           </button>
//         </div>

//         <div className="space-y-2">
//           {sortedContestants.slice(0, 5).map((contestant: any, idx: number) => (
//             <div
//               key={contestant.participantId}
//               className="flex items-center justify-between"
//             >
//               <div className="flex items-center space-x-2">
//                 <span
//                   className={`text-xs font-bold ${
//                     idx === 0
//                       ? "text-yellow-400"
//                       : idx === 1
//                       ? "text-gray-300"
//                       : idx === 2
//                       ? "text-orange-400"
//                       : "text-gray-500"
//                   }`}
//                 >
//                   {idx + 1}
//                 </span>
//                 <span className="text-sm text-white truncate max-w-[120px]">
//                   {contestant.name}
//                 </span>
//               </div>
//               <span className="text-sm font-semibold text-purple-400">
//                 {contestant.score.toFixed(1)}
//               </span>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   const ParticipantContestBadge = ({ participant }: { participant: any }) => {
//     const contestant = contest.contestants.find(
//       (c: any) => c.participantId === participant.id
//     );
//     if (!contestant || contest.contestState !== "active") return null;

//     return (
//       <div className="absolute top-2 left-2 flex items-center space-x-2">
//         {contestant.isEliminated ? (
//           <span className="bg-red-600/80 backdrop-blur-sm text-xs px-2 py-1 rounded text-white">
//             Eliminated
//           </span>
//         ) : (
//           <span className="bg-purple-600/80 backdrop-blur-sm text-xs px-2 py-1 rounded flex items-center space-x-1 text-white">
//             <Icon name="calendar" />
//             <span>{contestant.score.toFixed(1)}</span>
//           </span>
//         )}
//       </div>
//     );
//   };

//   return (
//     <>
//       <ContestIndicator />
//       <HostControlBar />
//       <JudgeManagementPanel />
//       <ParticipantSelectionModal />
//       <QuickResultsOverlay />

//       <div className="hidden">
//         {participants.map((participant) => (
//           <div key={participant.id} className="relative">
//             <ParticipantContestBadge participant={participant} />
//             <ParticipantVoteOverlay participant={participant} />
//           </div>
//         ))}
//       </div>
//       <VotingInterface />
//     </>
//   );
// }

// export default Simultaneous;
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  useParticipantList,
  useStreamContext,
  useRequirePublicKey,
  useContest,
  type ParticipantId,
} from "@vidbloq/react";
import { useContestConfig } from "../../hooks";
import { isSimultaneousConfig } from "../../utils";
import { Icon } from "../icons";
import { ChevronDown, ChevronUp, X, Trophy, Users, Clock, Crown, Medal, Award, BarChart3 } from "lucide-react";

function Simultaneous() {
  const [showContestMode, setShowContestMode] = useState(false);
  const [selectedContestants, setSelectedContestants] = useState<Set<string>>(new Set());
  const [voteStatus, setVoteStatus] = useState<{ [key: string]: string }>({});
  const [showQuickResults, setShowQuickResults] = useState(false);
  const [criteriaScores, setCriteriaScores] = useState<Record<string, Record<string, number>>>({});
  const [showJudgeManagement, setShowJudgeManagement] = useState(false);
  const [expandedContestant, setExpandedContestant] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { participants } = useParticipantList();

  const { config: contestConfig } = useContestConfig();
  
  const getSimultaneousValues = () => {
    if (isSimultaneousConfig(contestConfig)) {
      return {
        maxDuration: contestConfig.rules.maxDuration,
        roundsCount: contestConfig.rules.roundsCount,
      };
    }
    return {
      maxDuration: 180,
      roundsCount: 3,
    };
  };

  const { maxDuration, roundsCount } = getSimultaneousValues();

  const getVotingCriteria = () => {
    if (contestConfig.votingType === 'criteria' && contestConfig.votingCriteria) {
      return contestConfig.votingCriteria;
    }
    return [{
      id: 'overall',
      name: 'Overall Score',
      weight: 1,
      description: 'Rate the overall performance'
    }];
  };

  const votingCriteria = getVotingCriteria();

  const config = {
    mode: contestConfig.mode,
    name: contestConfig.name,
    features: {
      voting: true,
      elimination: contestConfig.features.elimination,
      leaderboard: true,
      timer: true,
    },
    rules: {
      maxDuration,
      votingDuration: contestConfig.rules.votingDuration,
      roundsCount, 
      minContestants: 2,
      votingPermissions: contestConfig.rules.votingPermissions,
      selfVoting: false,
    },
    scoring: {
      type: "average" as const,
      scoreRange: { min: 1, max: 10 },
      aggregation: {
        rounds: "latest" as const,
        categories: "average" as const,
      },
    },
  };

  const contest = useContest(config);

  useEffect(() => {
    contest.events.on("state:change", ({ from, to }) => {
      console.log(`Contest state changed from ${from} to ${to}`);
      if (to === "ended") {
        console.log("Contest has ended, timer should stop");
      }
    });
  }, [contest.events]);

  const {
    streamMetadata: { creatorWallet },
    identity,
  } = useStreamContext();

  const [submittedVotesByRound, setSubmittedVotesByRound] = useState<Map<number, Set<string>>>(new Map());

  const { publicKey } = useRequirePublicKey();
  const isHost = publicKey?.toString() === creatorWallet;

  useEffect(() => {
    if (contest.votingTimeRemaining > 0) {
      const interval = setInterval(() => {}, 1000);
      return () => clearInterval(interval);
    }
  }, [contest.votingTimeRemaining]);

  useEffect(() => {
    if (contest.contestState === "voting") {
      setVoteStatus({});
      setCriteriaScores({});
    }
  }, [contest.contestState, contest.currentRound]);

  const handleStartContest = () => {
    if (selectedContestants.size < 2) {
      alert("Select at least 2 participants for the contest");
      return;
    }

    const contestantsList = Array.from(selectedContestants).map((id) =>
      participants.find((p) => p.id === id)
    ).filter((p): p is any => p !== undefined);

    contest.startContest(contestantsList);
    setShowContestMode(false);
  };

  const handleQuickVote = (participantId: string, score: number) => {
    contest.submitVote(participantId, score);
    const el = document.getElementById(`vote-${participantId}`);
    if (el) {
      el.classList.add("vote-submitted");
      setTimeout(() => el.classList.remove("vote-submitted"), 1000);
    }
  };

  const ContestIndicator = () => {
    if (contest.contestState === "idle") return null;

    return (
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg px-2 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3 border border-gray-800">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <span className="text-xs sm:text-sm font-medium text-white">
            Round {contest.currentRound}
            {contest.contestState === "paused" && " • Paused"}
          </span>
          {contest.timeRemaining > 0 && !contest.isEliminated && contest.contestState !== "paused" && (
            <div className="flex items-center gap-1 text-xs text-gray-300">
              <Clock className="w-3 h-3 hidden sm:block" />
              <span>
                {Math.floor(contest.timeRemaining / 60)}:
                {(contest.timeRemaining % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}
          {isHost && (
            <>
              {contest.contestState === "active" && (
                <button
                  onClick={() => contest.pauseContest()}
                  className="px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded text-white transition-colors"
                >
                  Pause
                </button>
              )}
              {contest.contestState === "paused" && (
                <button
                  onClick={() => contest.resumeContest()}
                  className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors"
                >
                  Resume
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const ParticipantVoteOverlay = ({ participant }: { participant: any }) => {
    if (contest.contestState !== "active" || !contest.canVote) return null;
    if (participant.isEliminated) return null;

    return (
      <div
        id={`vote-${participant.id}`}
        className="absolute bottom-2 right-2 opacity-0 hover:opacity-100 transition-opacity"
      >
        <div className="flex gap-1">
          {[5, 7, 10].map((score) => (
            <button
              key={score}
              onClick={() => handleQuickVote(participant.id, score)}
              className="bg-gray-900/90 backdrop-blur text-white text-xs px-2.5 py-1.5 rounded hover:bg-purple-600 transition-all hover:scale-105"
            >
              {score}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const handleVote = async (contestantId: string, score: number, criterionId?: string) => {
    try {
      setVoteStatus((prev) => ({ ...prev, [contestantId]: "submitting" }));
      
      await contest.submitVote(contestantId, score, criterionId);

      setSubmittedVotesByRound((prev) => {
        const newMap = new Map(prev);
        const roundVotes = newMap.get(contest.currentRound) || new Set();
        roundVotes.add(contestantId);
        newMap.set(contest.currentRound, roundVotes);
        return newMap;
      });

      setVoteStatus((prev) => ({ ...prev, [contestantId]: "submitted" }));

      setTimeout(() => {
        setVoteStatus((prev) => {
          const newStatus = { ...prev };
          delete newStatus[contestantId];
          return newStatus;
        });
      }, 2000);
    } catch (error) {
      console.error("Failed to submit vote:", error);
      setVoteStatus((prev) => ({ ...prev, [contestantId]: "error" }));
    }
  };

  const handleCriteriaScore = (contestantId: string, criterionId: string, score: number) => {
    setCriteriaScores(prev => ({
      ...prev,
      [contestantId]: {
        ...prev[contestantId],
        [criterionId]: score,
      },
    }));
  };

  const submitVotesForContestant = async (contestantId: string) => {
    const scores = criteriaScores[contestantId];
    if (!scores) return;

    const allScored = votingCriteria.every(c => scores[c.id] && scores[c.id] > 0);
    if (!allScored) {
      alert('Please rate all criteria first');
      return;
    }

    for (const criterion of votingCriteria) {
      if (scores[criterion.id]) {
        await handleVote(contestantId, scores[criterion.id], criterion.id);
      }
    }
  };

  const currentRoundVotes = submittedVotesByRound.get(contest.currentRound) || new Set();
  
  const isJudge = contest.judges.includes(identity as ParticipantId);

  const VotingInterface = () => {
    if (contest.contestState !== "voting") return null;

    const isJudgeOnlyMode = contestConfig.rules.votingPermissions === "judges";
    const userCanVote = isJudgeOnlyMode ? isJudge : contest.canVote;

    if (!userCanVote) {
      return (
        <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-white text-lg mb-2">
              {isJudgeOnlyMode && !isJudge 
                ? "Voting is restricted to judges only" 
                : "Voting in progress (view only)"}
            </p>
            <p className="text-sm text-gray-400">
              Time remaining: {contest.votingTimeRemaining}s
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
        <div className="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-gray-800">
          {/* Header */}
          <div className="px-3 sm:px-6 py-2.5 sm:py-4 border-b border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-base sm:text-xl font-semibold text-white">Vote</h2>
                {isJudge && (
                  <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-[10px] sm:text-xs rounded-full font-medium">
                    JUDGE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-400">
                <Clock className="w-3 sm:w-4 h-3 sm:h-4" />
                <span>{contest.votingTimeRemaining}s</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 sm:gap-6 flex-1 overflow-hidden p-3 sm:p-6">
            {/* Voting Section */}
            <div className="flex-1 overflow-y-auto pr-0 sm:pr-2">
              <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                {contestConfig.votingType === 'criteria' 
                  ? 'Rate each contestant on all criteria' 
                  : 'Select a score for each contestant'}
              </p>
              
              <div className="space-y-2 sm:space-y-3">
                {contest.contestants
                  .filter((c: any) => !c.isEliminated && c.participantId !== identity)
                  .map((contestant: any) => {
                    const hasSubmitted = currentRoundVotes.has(contestant.participantId);
                    const scores = criteriaScores[contestant.participantId] || {};
                    const isExpanded = expandedContestant === contestant.participantId;

                    return (
                      <div
                        key={contestant.participantId}
                        className={`bg-gray-800/50 rounded-lg transition-all ${
                          hasSubmitted ? "ring-1 ring-purple-500/50" : ""
                        }`}
                      >
                        {/* Contestant Header */}
                        <div className="p-3 sm:p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 sm:w-10 h-8 sm:h-10 bg-purple-600 rounded-full flex items-center justify-center font-semibold text-white text-xs sm:text-base">
                                {contestant.name ? contestant.name.charAt(0) : "?"}
                              </div>
                              <div>
                                <p className="text-white font-medium text-sm sm:text-base">{contestant.name}</p>
                                <p className="text-[10px] sm:text-xs text-gray-400">
                                  Score: {contestant.score.toFixed(1)} • Votes: {contest.getVoteCount(contestant.participantId)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              {voteStatus[contestant.participantId] && (
                                <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${
                                  voteStatus[contestant.participantId] === "submitted"
                                    ? "bg-purple-600/20 text-purple-400"
                                    : voteStatus[contestant.participantId] === "submitting"
                                    ? "bg-yellow-600/20 text-yellow-400"
                                    : "bg-red-600/20 text-red-400"
                                }`}>
                                  {voteStatus[contestant.participantId] === "submitted"
                                    ? "✓"
                                    : voteStatus[contestant.participantId] === "submitting"
                                    ? "..."
                                    : "!"}
                                </span>
                              )}
                              {contestConfig.votingType === 'criteria' && !hasSubmitted && (
                                <button
                                  onClick={() => setExpandedContestant(isExpanded ? null : contestant.participantId)}
                                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                                >
                                  {isExpanded ? <ChevronUp className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400" /> : <ChevronDown className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400" />}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Voting Content */}
                          {hasSubmitted ? (
                            <div className="mt-3 sm:mt-4 text-center text-purple-400 text-xs sm:text-sm">
                              ✓ Vote Submitted
                            </div>
                          ) : contestConfig.votingType === 'criteria' ? (
                            <>
                              {!isExpanded && (
                                <button
                                  onClick={() => setExpandedContestant(contestant.participantId)}
                                  className="w-full mt-2 sm:mt-3 py-1.5 sm:py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded transition-colors text-xs sm:text-sm"
                                >
                                  Click to Rate
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="grid grid-cols-10 gap-0.5 sm:gap-1 mt-3 sm:mt-4">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                <button
                                  key={score}
                                  onClick={() => handleVote(contestant.participantId, score)}
                                  disabled={hasSubmitted}
                                  className={`py-1.5 sm:py-2 text-[10px] sm:text-xs rounded transition-all ${
                                    hasSubmitted
                                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                      : "bg-gray-700 hover:bg-purple-600 text-white hover:scale-105"
                                  }`}
                                >
                                  {score}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Expanded Criteria Section */}
                        {contestConfig.votingType === 'criteria' && isExpanded && !hasSubmitted && (
                          <div className="px-3 sm:px-4 pb-3 sm:pb-4 space-y-2 sm:space-y-3 border-t border-gray-700/50">
                            <div className="pt-2 sm:pt-3">
                              {votingCriteria.map(criterion => (
                                <div key={criterion.id} className="mb-2 sm:mb-3">
                                  <div className="flex justify-between mb-1 sm:mb-1.5">
                                    <span className="text-white text-xs sm:text-sm">{criterion.name}</span>
                                    <span className="text-gray-400 text-[10px] sm:text-xs">
                                      Weight: {Math.round(criterion.weight * 100)}%
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-10 gap-0.5 sm:gap-1">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                      <button
                                        key={score}
                                        onClick={() => handleCriteriaScore(contestant.participantId, criterion.id, score)}
                                        className={`py-1 sm:py-1.5 text-[10px] sm:text-xs rounded transition-all ${
                                          scores[criterion.id] === score
                                            ? "bg-purple-600 text-white"
                                            : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                                        }`}
                                      >
                                        {score}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => submitVotesForContestant(contestant.participantId)}
                              disabled={!votingCriteria.every(c => scores[c.id] > 0)}
                              className={`w-full py-1.5 sm:py-2 rounded font-medium text-xs sm:text-sm transition-colors ${
                                votingCriteria.every(c => scores[c.id] > 0)
                                  ? "bg-purple-600 text-white hover:bg-purple-700"
                                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              Submit Votes
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Leaderboard Toggle Button for Mobile */}
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="lg:hidden fixed bottom-4 right-4 z-40 bg-purple-600 hover:bg-purple-700 p-3 rounded-full shadow-lg transition-colors"
            >
              <BarChart3 className="w-5 h-5 text-white" />
            </button>

            {/* Live Leaderboard - Hidden on mobile unless toggled */}
            <div className={`${showLeaderboard ? 'fixed inset-x-4 bottom-16 z-40' : 'hidden'} lg:block lg:relative lg:inset-auto lg:z-auto w-auto lg:w-80 mt-4 lg:mt-0`}>
              <div className="bg-gray-800/95 lg:bg-gray-800/50 rounded-lg p-3 sm:p-4 backdrop-blur-lg lg:backdrop-blur-none lg:sticky lg:top-0">
                {/* Mobile close button */}
                <div className="lg:hidden flex justify-between items-center mb-3">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-purple-400" />
                    Leaderboard
                  </h3>
                  <button
                    onClick={() => setShowLeaderboard(false)}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                {/* Desktop header */}
                <h3 className="hidden lg:flex text-white font-semibold mb-3 sm:mb-4 items-center gap-2 text-sm sm:text-base">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  Live Leaderboard
                </h3>
                <div className="space-y-1.5 sm:space-y-2 max-h-60 lg:max-h-none overflow-y-auto">
                  {contest.leaderboard.length > 0 ? (
                    contest.leaderboard.map((entry: any, idx: number) => (
                      <div
                        key={entry.participantId}
                        className="flex items-center justify-between p-2 sm:p-2.5 bg-gray-900/50 rounded-lg"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {idx === 0 && <Crown className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-400" />}
                          {idx === 1 && <Medal className="w-3 sm:w-4 h-3 sm:h-4 text-gray-300" />}
                          {idx === 2 && <Award className="w-3 sm:w-4 h-3 sm:h-4 text-orange-400" />}
                          {idx > 2 && <span className="w-3 sm:w-4 text-center text-[10px] sm:text-xs text-gray-500">{idx + 1}</span>}
                          <span className="text-white text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[120px]">{entry.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold text-xs sm:text-sm">{entry.score.toFixed(1)}</p>
                          <p className="text-[10px] sm:text-xs text-gray-400">{entry.votes}v</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-xs sm:text-sm text-center py-4">No votes yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const HostControlBar = () => {
    if (!isHost) return null;

    return (
      <div className="fixed bottom-10 sm:!bottom-20 left-1/2 transform -translate-x-1/2 z-20 w-auto px-4 sm:!w-auto">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg px-3 sm:!px-4 py-2 sm:!py-2.5 border border-gray-800">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {contest.contestState === "idle" && (
              <button
                onClick={() => setShowContestMode(true)}
                className="flex items-center gap-1.5 sm:!gap-2 px-2 sm:!px-3 py-1 sm:!py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-xs sm:text-sm transition-colors text-white"
              >
                <Users className="w-3 sm:!w-4 h-3 sm:!h-4" />
                <span>Start Contest</span>
              </button>
            )}

            {contest.contestState === "active" && (
              <>
                <button
                  onClick={() => contest.nextRound()}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-purple-600 hover:bg-purple-700 rounded text-xs sm:text-sm transition-colors text-white"
                >
                  <Icon name="arrow" size={12} className="transform -scale-x-100"/>
                  <span className="hidden sm:!inline">Next Round</span>
                  <span className="sm:!hidden">Next</span>
                </button>
                <button
                  onClick={() => setShowQuickResults(true)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs sm:text-sm transition-colors text-white"
                >
                  <Trophy className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span>Scores</span>
                </button>
                {contestConfig.rules.votingPermissions === "judges" && (
                  <button
                    onClick={() => setShowJudgeManagement(!showJudgeManagement)}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded text-xs sm:text-sm transition-colors text-white"
                  >
                    <Users className="w-3 sm:w-4 h-3 sm:h-4" />
                    <span>Judges ({contest.judges.length})</span>
                  </button>
                )}
              </>
            )}

            {contest.contestState === "active" && (
              <button
                onClick={() => contest.endContest()}
                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs sm:text-sm transition-colors"
              >
                End
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const JudgeManagementPanel = () => {
    if (!showJudgeManagement || !isHost) return null;

    return (
      <div className="fixed bottom-20 sm:bottom-36 left-1/2 transform -translate-x-1/2 bg-gray-900 rounded-xl p-3 sm:p-4 w-[90vw] sm:w-80 max-h-96 overflow-y-auto z-30 border border-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold text-sm sm:text-base">Manage Judges</h3>
          <button
            onClick={() => setShowJudgeManagement(false)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="space-y-2">
          {participants.map(participant => {
            const isParticipantJudge = contest.judges.includes(participant.id as ParticipantId);
            return (
              <div
                key={participant.id}
                className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
              >
                <span className="text-white text-xs sm:text-sm truncate mr-2">{participant.userName}</span>
                <button
                  onClick={() => {
                    if (isParticipantJudge) {
                      contest.removeJudge(participant.id);
                    } else {
                      contest.addJudge(participant.id);
                    }
                  }}
                  className={`px-2 sm:px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                    isParticipantJudge
                      ? 'bg-yellow-600/20 text-yellow-400 hover:bg-red-600/20 hover:text-red-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-purple-600/20 hover:text-purple-400'
                  }`}
                >
                  {isParticipantJudge ? 'Remove' : 'Add'}
                </button>
              </div>
            );
          })}
        </div>
        {contestConfig.rules.votingPermissions === "judges" && contest.judges.length === 0 && (
          <div className="mt-4 p-2 sm:p-3 bg-yellow-900/20 border border-yellow-700/30 rounded">
            <p className="text-xs text-yellow-200">
              No judges assigned. Add judges to enable voting.
            </p>
          </div>
        )}
      </div>
    );
  };

  const ParticipantSelectionModal = () => {
    if (!showContestMode) return null;

    return (
      <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-white">Select Participants</h2>
            <button
              onClick={() => setShowContestMode(false)}
              className="p-1 sm:p-1.5 hover:bg-gray-800 rounded transition-colors"
            >
              <X className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mb-4">
            <div className="space-y-2">
              {participants.map((participant) => (
                <label
                  key={participant.id}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedContestants.has(participant.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedContestants);
                      if (e.target.checked) {
                        newSet.add(participant.id);
                      } else {
                        newSet.delete(participant.id);
                      }
                      setSelectedContestants(newSet);
                    }}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1 flex items-center gap-2 sm:gap-3">
                    <div className="w-6 sm:w-8 h-6 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold text-white">
                      {participant.userName.charAt(0)}
                    </div>
                    <span className="text-white text-sm sm:text-base truncate">{participant.userName}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <span className="text-xs sm:text-sm text-gray-400">
              {selectedContestants.size} selected
            </span>
            <button
              onClick={handleStartContest}
              disabled={selectedContestants.size < 2}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                selectedContestants.size >= 2
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              Start Contest
            </button>
          </div>
        </div>
      </div>
    );
  };

  const QuickResultsOverlay = () => {
    if (!showQuickResults) return null;

    const sortedContestants = [...contest.contestants].sort(
      (a: any, b: any) => b.score - a.score
    );

    return (
      <div className="absolute top-20 right-4 z-20 bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 w-64 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-400" />
            Live Scores
          </h3>
          <button
            onClick={() => setShowQuickResults(false)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="space-y-2">
          {sortedContestants.slice(0, 5).map((contestant: any, idx: number) => (
            <div
              key={contestant.participantId}
              className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
            >
              <div className="flex items-center gap-2">
                {idx === 0 && <Crown className="w-3.5 h-3.5 text-yellow-400" />}
                {idx === 1 && <Medal className="w-3.5 h-3.5 text-gray-300" />}
                {idx === 2 && <Award className="w-3.5 h-3.5 text-orange-400" />}
                {idx > 2 && <span className="w-3.5 text-center text-xs text-gray-500">{idx + 1}</span>}
                <span className="text-sm text-white truncate max-w-[120px]">{contestant.name}</span>
              </div>
              <span className="text-sm font-semibold text-purple-400">
                {contestant.score.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ParticipantContestBadge = ({ participant }: { participant: any }) => {
    const contestant = contest.contestants.find(
      (c: any) => c.participantId === participant.id
    );
    if (!contestant || contest.contestState !== "active") return null;

    return (
      <div className="absolute top-2 left-2 flex items-center gap-2">
        {contestant.isEliminated ? (
          <span className="bg-red-600/20 backdrop-blur-sm text-xs px-2 py-1 rounded text-red-400 border border-red-600/30">
            Eliminated
          </span>
        ) : (
          <span className="bg-purple-600/20 backdrop-blur-sm text-xs px-2 py-1 rounded flex items-center gap-1.5 text-purple-400 border border-purple-600/30">
            <Trophy className="w-3 h-3" />
            <span>{contestant.score.toFixed(1)}</span>
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <ContestIndicator />
      <HostControlBar />
      <JudgeManagementPanel />
      <ParticipantSelectionModal />
      <QuickResultsOverlay />

      <div className="hidden">
        {participants.map((participant) => (
          <div key={participant.id} className="relative">
            <ParticipantContestBadge participant={participant} />
            <ParticipantVoteOverlay participant={participant} />
          </div>
        ))}
      </div>
      <VotingInterface />
    </>
  );
}

export default Simultaneous;

