//  /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useState, useEffect, useRef, useMemo } from "react";
// import { useParticipantList, useStreamContext, type ParticipantId, useContest } from "@vidbloq/react";
// import { TurnBasedContestPlugin } from "./turn-based-plugin";

// import { useContestConfig } from "../../hooks";
// import { isTurnBasedConfig } from "../../utils";

// export function TurnBased() {
//   const { participants } = useParticipantList();
//   const { identity, websocket, roomName } = useStreamContext();
//   const { config: contestConfig } = useContestConfig();

//   // Get turn-based specific values from config
//   const getTurnBasedValues = () => {
//     if (isTurnBasedConfig(contestConfig)) {
//       return {
//         turnDuration: contestConfig.plugin.turnDuration,
//         autoAdvance: contestConfig.plugin.autoAdvance,
//       };
//     }
//     return {
//       turnDuration: 120,
//       autoAdvance: false,
//     };
//   };

//   // State
//   const [currentPerformerId, setCurrentPerformerId] = useState<string | null>(null);
//   const [turnStartTime, setTurnStartTime] = useState<number | null>(null);
//   const [turnDuration, setTurnDuration] = useState(120);
//   const [timeRemaining, setTimeRemaining] = useState(0);
//   const [showSelection, setShowSelection] = useState(false);
//   const [selectedContestants, setSelectedContestants] = useState<Set<string>>(new Set());
//   const [eventLog, setEventLog] = useState<string[]>([]);
//   const [contestStarted, setContestStarted] = useState(false);
//   const [votingPhase, setVotingPhase] = useState(false);
//   const [votingTimeRemaining, setVotingTimeRemaining] = useState(0);
//   const [performanceQueue, setPerformanceQueue] = useState<string[]>([]);
//   const [criteriaScores, setCriteriaScores] = useState<Record<string, Record<string, number>>>({});
//   const [submittedVotes, setSubmittedVotes] = useState<Set<string>>(new Set());
//   const [showFinalResults, setShowFinalResults] = useState(false);
//   const [pluginInitialized, setPluginInitialized] = useState(false);
//   const [queueInitialized, setQueueInitialized] = useState(false);
//   const [showJudgeManagement, setShowJudgeManagement] = useState(false);

//   // Refs for handling auto-advance with current state
//   const plugin = useRef<TurnBasedContestPlugin | null>(null);
//   const pluginConfig = useRef({ turnDuration: 120, autoAdvance: false });
//   const nextQueueRef = useRef<string[]>([]);
//   const contestStateRef = useRef({ 
//     votingPhase: false, 
//     contestStarted: false,
//     currentPerformerId: null as string | null
//   });

//   // Keep contestStateRef synced with actual state
//   useEffect(() => {
//     contestStateRef.current = {
//       votingPhase,
//       contestStarted,
//       currentPerformerId
//     };
//   }, [votingPhase, contestStarted, currentPerformerId]);

//   // Log function
//   const addLog = (message: string) => {
//     const timestamp = new Date().toLocaleTimeString();
//     console.log(`[${timestamp}] ${message}`);
//     setEventLog((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 30));
//   };
  

//   // Initialize plugin ONCE
//   useEffect(() => {
//     if (!plugin.current) {
//       const values = getTurnBasedValues();
//       pluginConfig.current = { ...values };
//       plugin.current = new TurnBasedContestPlugin({
//         turnDuration: values.turnDuration,
//         autoAdvance: values.autoAdvance,
//       });
//       setPluginInitialized(true);
//       setTurnDuration(values.turnDuration);
//       addLog(`Plugin created - Duration: ${values.turnDuration}s, AutoAdvance: ${values.autoAdvance}`);
//     }
//   }, []);

//   // Update plugin properties when config changes
//   useEffect(() => {
//     if (plugin.current && pluginInitialized) {
//       const values = getTurnBasedValues();

//       if (
//         pluginConfig.current.turnDuration !== values.turnDuration ||
//         pluginConfig.current.autoAdvance !== values.autoAdvance
//       ) {
//         pluginConfig.current = { ...values };
//         setTurnDuration(values.turnDuration);
//         addLog(`Plugin updated - Duration: ${values.turnDuration}s, AutoAdvance: ${values.autoAdvance}`);
//       }
//     }
//   }, [contestConfig, pluginInitialized]);

//   // Get voting criteria
//   const getVotingCriteria = () => {
//     if (contestConfig.votingType === "criteria" && contestConfig.votingCriteria) {
//       return contestConfig.votingCriteria;
//     }
//     return [
//       {
//         id: "overall",
//         name: "Overall Score",
//         weight: 1,
//         description: "Rate the overall performance",
//       },
//     ];
//   };

//   const votingCriteria = getVotingCriteria();

//   // Contest config
//   const config = useMemo(
//     () => ({
//       mode: contestConfig.mode,
//       name: contestConfig.name,
//       features: {
//         voting: true,
//         elimination: false,
//         leaderboard: true,
//         timer: false,
//       },
//       rules: {
//         minContestants: 2,
//         votingPermissions: contestConfig.rules.votingPermissions,
//         votingDuration: contestConfig.rules.votingDuration,
//         selfVoting: false,
//       },
//       scoring: {
//         type: "average" as const,
//         scoreRange: { min: 1, max: 10 },
//       },
//     }),
//     [contestConfig]
//   );

//   // Create plugins array
//   const pluginsArray = useMemo(() => {
//     if (plugin.current && pluginInitialized) {
//       return [plugin.current];
//     }
//     return [];
//   }, [pluginInitialized]);

//   // Use contest with plugins
//   const contest = useContest(config, {
//     plugins: pluginsArray,
//   });

//   // Initialize queue ONLY for host when contest becomes active
//   useEffect(() => {
//     // Only initialize queue once when contest becomes active
//     if (
//       contest.state.status === "active" &&
//       contest.isHost &&
//       !queueInitialized &&
//       performanceQueue.length === 0
//     ) {
//       const contestants = Array.from(contest.state.contestants.values())
//         .filter((c: any) => !c.isEliminated)
//         .map((c: any) => c.participantId);

//       if (contestants.length > 0) {
//         // Shuffle and set queue - ONLY HOST DOES THIS, ONLY ONCE
//         const shuffled = [...contestants].sort(() => Math.random() - 0.5);
//         setPerformanceQueue(shuffled);
//         nextQueueRef.current = shuffled; // Also set the ref!
//         setQueueInitialized(true);
//         addLog(`Host initialized queue with ${shuffled.length} contestants`);

//         // Send the queue to all participants using the turnBasedReady event
//         if (websocket && roomName) {
//           websocket.sendMessage("turnBasedReady", {
//             roomName: roomName,
//             queueLength: shuffled.length,
//             queue: shuffled,
//           });

//           addLog(`Sent queue to all participants`);

//           // AUTO-START FIRST TURN if auto-advance is enabled
//           if (getTurnBasedValues().autoAdvance) {
//             addLog("Auto-starting first turn in 3 seconds...");
//             setTimeout(() => {
//               const firstPerformer = shuffled[0];
//               const remainingQueue = shuffled.slice(1);
//               const values = getTurnBasedValues();

//               addLog(`Auto-starting first turn for ${firstPerformer}`);

//               websocket.sendMessage("turnStart", {
//                 roomName: roomName,
//                 participantId: firstPerformer,
//                 duration: values.turnDuration,
//                 queue: remainingQueue,
//                 currentPerformer: firstPerformer,
//               });

//               // Update ref with remaining queue
//               nextQueueRef.current = remainingQueue;
//             }, 3000);
//           }
//         }
//       }
//     }

//     // Reset initialization flag when contest ends
//     if (contest.state.status !== "active") {
//       setQueueInitialized(false);
//       nextQueueRef.current = []; // Clear the ref too
//     }
//   }, [
//     contest.state.status,
//     contest.state.contestants,
//     contest.isHost,
//     queueInitialized,
//     performanceQueue.length,
//     websocket,
//     roomName,
//   ]);

//   // Log contest state changes
//   useEffect(() => {
//     if (contest && contest.state) {
//       addLog(
//         `Contest state: ${JSON.stringify({
//           status: contest.state.status,
//           contestants: contest.state.contestants?.size || 0,
//           hasPlugin: pluginsArray.length > 0,
//         })}`
//       );
//     }
//   }, [contest.state, pluginsArray.length]);

//   // WebSocket listeners
//   useEffect(() => {
//     if (!websocket) {
//       addLog("No websocket");
//       return;
//     }

//     const handleTurnStart = (data: any) => {
//       const duration = data.duration || turnDuration;
//       addLog(`TURN START: ${data.participantId} for ${duration}s`);
//       setCurrentPerformerId(data.participantId);
//       setTurnStartTime(Date.now());
//       setTurnDuration(duration);
//       setTimeRemaining(duration);

//       if (data.queue) {
//         setPerformanceQueue(data.queue);
//         nextQueueRef.current = data.queue; // Store in ref for immediate access
//         addLog(`Queue updated: ${data.queue.length} remaining`);
//       }
//     };

//     const handleTurnEnd = (data: any) => {
//       addLog(`TURN END: ${data.participantId || "unknown"}`);
//       setCurrentPerformerId(null);
//       setTurnStartTime(null);
//       setTimeRemaining(0);

//       // AUTO-ADVANCE LOGIC using refs for all state checks
//       if (contest.isHost && getTurnBasedValues().autoAdvance) {
//         const currentQueue = nextQueueRef.current;

//         if (currentQueue.length > 0) {
//           addLog(`Auto-advancing in 2 seconds... (${currentQueue.length} remaining)`);

//           setTimeout(() => {
//             // Use refs for current state values
//             const currentState = contestStateRef.current;
            
//             // Check: not in voting, no active performer, contest still running
//             if (!currentState.votingPhase && !currentState.currentPerformerId && currentState.contestStarted) {
//               const nextPerformer = currentQueue[0];
//               const remainingQueue = currentQueue.slice(1);
//               const values = getTurnBasedValues();

//               addLog(`Auto-starting turn for ${nextPerformer}`);

//               if (websocket && roomName) {
//                 websocket.sendMessage("turnStart", {
//                   roomName: roomName,
//                   participantId: nextPerformer,
//                   duration: values.turnDuration,
//                   queue: remainingQueue,
//                   currentPerformer: nextPerformer,
//                 });
//               }

//               // Update the ref for next iteration
//               nextQueueRef.current = remainingQueue;
//             } else {
//               addLog(`Auto-advance blocked: voting=${currentState.votingPhase}, performer=${currentState.currentPerformerId}, contest=${currentState.contestStarted}`);
//             }
//           }, 2000);
//         } else {
//           // Queue is empty, auto-start voting
//           addLog("All turns complete, auto-starting voting in 2 seconds...");
//           setTimeout(() => {
//             const currentState = contestStateRef.current;
//             if (!currentState.votingPhase && currentState.contestStarted) {
//               addLog(`Auto-starting voting (${contestConfig.rules.votingDuration}s)`);
//               if (websocket && roomName) {
//                 websocket.sendMessage("startVoting", {
//                   roomName: roomName,
//                   duration: contestConfig.rules.votingDuration,
//                 });
//               }
//             }
//           }, 2000);
//         }
//       }
//     };

//     const handleContestStart = (data: any) => {
//       addLog("CONTEST STARTED");
//       setContestStarted(true);
//       setShowFinalResults(false);
//       setCriteriaScores({});
//       setSubmittedVotes(new Set());
//       setPerformanceQueue([]); // Clear queue on start

//       if (data?.contestants) {
//         addLog(`Contestants: ${data.contestants.length}`);
//       }

//       // AUTO-START FIRST TURN if auto-advance is enabled and we're the host
//       if (contest.isHost && getTurnBasedValues().autoAdvance) {
//         addLog("Auto-advance enabled, will start first turn automatically when ready");
//         // The queue initialization in another useEffect will trigger the first turn
//       }
//     };

//     const handleContestEnd = () => {
//       addLog("CONTEST ENDED");
//       setContestStarted(false);
//       setCurrentPerformerId(null);
//       setVotingPhase(false);
//       setShowFinalResults(false);
//       setCriteriaScores({});
//       setSubmittedVotes(new Set());
//       setPerformanceQueue([]);
//       setQueueInitialized(false); // Reset the flag when contest ends
//       nextQueueRef.current = []; // Clear the ref
//     };

//     const handleTurnBasedReady = (data: any) => {
//       addLog(`TURN BASED READY: ${data.queueLength} in queue`);
//       if (data.queue && !contest.isHost) {
//         // Non-hosts sync the queue from host
//         setPerformanceQueue(data.queue);
//         nextQueueRef.current = data.queue; // Sync ref for non-hosts too
//         addLog(`Queue synced from host: ${data.queue.join(", ")}`);
//       }
//     };

//     const handleAllTurnsComplete = () => {
//       addLog("ALL TURNS COMPLETE");
//       setCurrentPerformerId(null);
//       setPerformanceQueue([]);

//       // AUTO-START VOTING if auto-advance is enabled
//       if (contest.isHost && getTurnBasedValues().autoAdvance && !votingPhase) {
//         addLog("Auto-starting voting phase in 2 seconds...");
//         setTimeout(() => {
//           const currentState = contestStateRef.current;
//           if (!currentState.votingPhase && currentState.contestStarted) {
//             addLog(`Auto-starting voting (${contestConfig.rules.votingDuration}s)`);
//             if (websocket && roomName) {
//               websocket.sendMessage("startVoting", {
//                 roomName: roomName,
//                 duration: contestConfig.rules.votingDuration,
//               });
//             }
//           }
//         }, 2000);
//       }
//     };

//     const handleVotingStart = (data: any) => {
//       addLog(`VOTING START: ${data.duration}s`);
//       setCurrentPerformerId(null);
//       setTurnStartTime(null);
//       setTimeRemaining(0);
//       setVotingPhase(true);
//       setVotingTimeRemaining(data.duration || contestConfig.rules.votingDuration);
//     };

//     const handleVotingEnd = () => {
//       addLog("VOTING END");
//       setVotingPhase(false);
//       setVotingTimeRemaining(0);
//       setShowFinalResults(true);
//     };

//     // Handle broadcast messages
//     const handleBroadcast = (data: any) => {
//       if (data.event === "turnBasedReady") {
//         handleTurnBasedReady(data.data);
//       } else if (data.event === "turnStart") {
//         handleTurnStart(data.data);
//       } else if (data.event === "turnEnd") {
//         handleTurnEnd(data.data);
//       }
//     };

//     websocket.addEventListener("turnStart", handleTurnStart);
//     websocket.addEventListener("turnEnd", handleTurnEnd);
//     websocket.addEventListener("turnTimeout", handleTurnEnd);
//     websocket.addEventListener("contestStart", handleContestStart);
//     websocket.addEventListener("contestEnd", handleContestEnd);
//     websocket.addEventListener("turnBasedReady", handleTurnBasedReady);
//     websocket.addEventListener("allTurnsComplete", handleAllTurnsComplete);
//     websocket.addEventListener("votingStart", handleVotingStart);
//     websocket.addEventListener("votingEnd", handleVotingEnd);
//     websocket.addEventListener("broadcast", handleBroadcast);

//     addLog("WebSocket listeners attached");

//     return () => {
//       websocket.removeEventListener("turnStart", handleTurnStart);
//       websocket.removeEventListener("turnEnd", handleTurnEnd);
//       websocket.removeEventListener("turnTimeout", handleTurnEnd);
//       websocket.removeEventListener("contestStart", handleContestStart);
//       websocket.removeEventListener("contestEnd", handleContestEnd);
//       websocket.removeEventListener("turnBasedReady", handleTurnBasedReady);
//       websocket.removeEventListener("allTurnsComplete", handleAllTurnsComplete);
//       websocket.removeEventListener("votingStart", handleVotingStart);
//       websocket.removeEventListener("votingEnd", handleVotingEnd);
//       websocket.removeEventListener("broadcast", handleBroadcast);
//     };
//   }, [
//     websocket,
//     turnDuration,
//     contestConfig.rules.votingDuration,
//     contest.isHost,
//     votingPhase,
//     roomName,
//   ]);

//   useEffect(() => {
//     if (!turnStartTime || votingPhase) return;

//     const interval = setInterval(() => {
//       const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
//       const remaining = Math.max(0, turnDuration - elapsed);
//       setTimeRemaining(remaining);
      
//       // AUTO-END TURN when timer reaches 0
//       if (remaining === 0 && currentPerformerId && contest.isHost && getTurnBasedValues().autoAdvance) {
//         addLog("Timer expired - auto-ending turn");
        
//         // Clear the current performer immediately to prevent multiple triggers
//         setCurrentPerformerId(null);
        
//         // Send turn end message
//         if (websocket && roomName) {
//           websocket.sendMessage("turnEnd", {
//             roomName: roomName,
//             participantId: currentPerformerId,
//           });
          
//           addLog(`Auto-ended turn for ${currentPerformerId}`);
//         }
//       }
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [turnStartTime, turnDuration, votingPhase, currentPerformerId, contest.isHost, websocket, roomName]);

//   // Voting countdown
//   useEffect(() => {
//     if (votingTimeRemaining <= 0) return;

//     const interval = setInterval(() => {
//       setVotingTimeRemaining((prev) => Math.max(0, prev - 1));
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [votingTimeRemaining]);

//   const isMyTurn = currentPerformerId === identity && !votingPhase;
//   const isJudge = contest.judges.includes(identity as ParticipantId);

//   console.log('Judge check:', {
//   identity,
//   judges: contest.judges,
//   isJudge: contest.judges.includes(identity as ParticipantId),
//   votingPermissions: contestConfig.rules.votingPermissions
// });

//   // Contest functions
//   const startContest = async () => {
//     if (selectedContestants.size < 2) {
//       addLog("Need at least 2 contestants");
//       return;
//     }

//     const selected = participants.filter((p) => selectedContestants.has(p.id));
//     addLog(`Starting contest with: ${selected.map((p) => p.userName).join(", ")}`);

//     await contest.startContest(selected);
//     setShowSelection(false);
//   };

//   // Direct broadcast approach for starting turns
//   const startFirstTurn = () => {
//     if (!contest.isHost) {
//       addLog("ERROR: Only host can start turns");
//       return;
//     }

//     if (performanceQueue.length === 0) {
//       addLog("ERROR: Queue is empty");
//       return;
//     }

//     const firstPerformer = performanceQueue[0];
//     const remainingQueue = performanceQueue.slice(1);
//     const values = getTurnBasedValues();

//     addLog(`Starting turn for ${firstPerformer} (${values.turnDuration}s)`);

//     // Send the turnStart event directly
//     if (websocket && roomName) {
//       websocket.sendMessage("turnStart", {
//         roomName: roomName,
//         participantId: firstPerformer,
//         duration: values.turnDuration,
//         queue: remainingQueue,
//         currentPerformer: firstPerformer,
//       });

//       nextQueueRef.current = remainingQueue; // Update ref
//       addLog(`Sent turn start for ${firstPerformer}`);
//     }
//   };

//   const endCurrentTurn = () => {
//     if (!contest.isHost) {
//       addLog("ERROR: Only host can end turns");
//       return;
//     }

//     if (!currentPerformerId) {
//       addLog("ERROR: No active turn");
//       return;
//     }

//     addLog("Ending turn");

//     if (websocket && roomName) {
//       websocket.sendMessage("turnEnd", {
//         roomName: roomName,
//         participantId: currentPerformerId,
//       });

//       addLog(`Sent turn end for ${currentPerformerId}`);
//     }
//   };

//   const startNextTurn = () => {
//     if (!contest.isHost) {
//       addLog("ERROR: Only host can start turns");
//       return;
//     }

//     if (performanceQueue.length === 0) {
//       addLog("ERROR: No more performers in queue");
//       return;
//     }

//     const nextPerformer = performanceQueue[0];
//     const remainingQueue = performanceQueue.slice(1);
//     const values = getTurnBasedValues();

//     addLog(`Starting next turn for ${nextPerformer}`);

//     if (websocket && roomName) {
//       websocket.sendMessage("turnStart", {
//         roomName: roomName,
//         participantId: nextPerformer,
//         duration: values.turnDuration,
//         queue: remainingQueue,
//         currentPerformer: nextPerformer,
//       });

//       nextQueueRef.current = remainingQueue; // Update ref
//       addLog(`Sent next turn for ${nextPerformer}`);
//     }
//   };

//   const startVoting = () => {
//     addLog(`Starting voting (${contestConfig.rules.votingDuration}s)`);
//     if (websocket && roomName) {
//       websocket.sendMessage("startVoting", {
//         roomName: roomName,
//         duration: contestConfig.rules.votingDuration,
//       });
//     }
//   };

//   // Voting functions
//   const handleCriteriaScore = (contestantId: string, criterionId: string, score: number) => {
//     setCriteriaScores((prev) => ({
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

//     const allScored = votingCriteria.every((c) => scores[c.id] > 0);
//     if (!allScored) {
//       addLog("Rate all criteria first");
//       return;
//     }

//     for (const criterion of votingCriteria) {
//       if (scores[criterion.id]) {
//         await contest.submitVote(contestantId, scores[criterion.id], criterion.id);
//       }
//     }

//     setSubmittedVotes((prev) => new Set([...prev, contestantId]));
//     addLog(`Voted for ${contest.getContestant(contestantId)?.name}`);
//   };

//   // Selection UI
//   if (showSelection && contest.isHost) {
//     return (
//       <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center">
//         <div className="bg-gray-900 p-6 rounded-xl max-w-md w-full">
//           <h2 className="text-white text-xl mb-4">Select Contestants</h2>
//           <div className="space-y-2 max-h-60 overflow-y-auto">
//             {participants.map((p) => (
//               <label
//                 key={p.id}
//                 className="flex items-center p-2 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer"
//               >
//                 <input
//                   type="checkbox"
//                   checked={selectedContestants.has(p.id)}
//                   onChange={(e) => {
//                     const newSet = new Set(selectedContestants);
//                     if (e.target.checked) {
//                       newSet.add(p.id);
//                     } else {
//                       newSet.delete(p.id);
//                     }
//                     setSelectedContestants(newSet);
//                   }}
//                   className="mr-3"
//                 />
//                 <span className="text-white">{p.userName || p.id}</span>
//               </label>
//             ))}
//           </div>
//           <div className="flex justify-between mt-4">
//             <button
//               onClick={() => setShowSelection(false)}
//               className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={startContest}
//               disabled={selectedContestants.size < 2}
//               className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50"
//             >
//               Start ({selectedContestants.size})
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Judge Management Panel
//   const JudgeManagementPanel = () => {
//     if (!showJudgeManagement || !contest.isHost) return null;

//     return (
//       <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-lg rounded-xl p-4 w-80 max-h-96 overflow-y-auto z-[150] pointer-events-auto">
//         <div className="flex justify-between items-center mb-3">
//           <h3 className="text-white font-semibold">Manage Judges</h3>
//           <button
//             onClick={() => setShowJudgeManagement(false)}
//             className="text-gray-400 hover:text-white p-1"
//           >
//             ×
//           </button>
//         </div>
//         <div className="space-y-2">
//           {participants.map(participant => {
//             const isParticipantJudge = contest.judges.includes(participant.id as ParticipantId);
//             return (
//               <div
//                 key={participant.id}
//                 className="flex items-center justify-between p-2 bg-gray-800 rounded"
//               >
//                 <span className="text-white text-sm">{participant.userName || participant.id}</span>
//                 <button
//                   onClick={() => {
//                     if (isParticipantJudge) {
//                       contest.removeJudge(participant.id);
//                     } else {
//                       contest.addJudge(participant.id);
//                     }
//                   }}
//                   className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
//                     isParticipantJudge
//                       ? 'bg-yellow-600 text-white hover:bg-red-600'
//                       : 'bg-gray-700 text-gray-300 hover:bg-yellow-600 hover:text-white'
//                   }`}
//                 >
//                   {isParticipantJudge ? 'Remove' : 'Add Judge'}
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

//   // Main UI
//   return (
//     <div className="fixed inset-0 pointer-events-none">
//       {/* Debug Panel */}
//       <div className="absolute top-4 right-4 w-96 bg-black/90 text-white text-xs p-4 rounded-lg pointer-events-auto max-h-[500px] overflow-y-auto">
//         <div className="text-green-400 font-bold mb-2">TURN-BASED DEBUG</div>
//         <div className="space-y-1 mb-3">
//           <div className={pluginInitialized ? "text-green-400" : "text-red-400"}>
//             Plugin: {pluginInitialized ? "Ready" : "Not Ready"}
//           </div>
//           <div>Identity: {identity?.slice(0, 20)}...</div>
//           <div>Performer: {currentPerformerId?.slice(0, 20) || "None"}</div>
//           <div className={isMyTurn ? "text-yellow-400 font-bold" : ""}>
//             My Turn: {isMyTurn ? "YES" : "No"}
//           </div>
//           <div className={isJudge ? "text-yellow-400 font-bold" : ""}>
//             Judge: {isJudge ? "YES" : "No"}
//           </div>
//           <div>
//             Duration: {turnDuration}s (Config: {getTurnBasedValues().turnDuration}s)
//           </div>
//           <div>Time: {timeRemaining}s</div>
//           <div>Contest: {contestStarted ? "Active" : "Idle"}</div>
//           <div>Voting: {votingPhase ? `Active (${votingTimeRemaining}s)` : "No"}</div>
//           <div className="text-yellow-300">Queue: {performanceQueue.length}</div>
//           <div className="text-orange-400">
//             Queue Order: {performanceQueue.slice(0, 3).map((id) => id.slice(-4)).join(", ")}...
//           </div>
//           <div>Host: {contest.isHost ? "YES" : "No"}</div>
//           <div className={getTurnBasedValues().autoAdvance ? "text-green-400 font-bold" : ""}>
//             AutoAdvance: {getTurnBasedValues().autoAdvance ? "ON" : "OFF"}
//           </div>
//         </div>
//         <div className="border-t border-gray-700 pt-2">
//           <div className="text-blue-400 font-bold mb-1">Event Log:</div>
//           {eventLog.map((log, i) => (
//             <div
//               key={i}
//               className={`text-[10px] ${
//                 log.includes("ERROR")
//                   ? "text-red-400 font-bold"
//                   : log.includes("Auto-")
//                   ? "text-yellow-400"
//                   : log.includes("TURN")
//                   ? "text-green-400"
//                   : log.includes("CONTEST")
//                   ? "text-purple-400"
//                   : log.includes("Broadcast")
//                   ? "text-cyan-400"
//                   : log.includes("READY")
//                   ? "text-yellow-400 font-bold"
//                   : "text-gray-300"
//               }`}
//             >
//               {log}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Host Controls */}
//       {contest.isHost && (
//         <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 pointer-events-auto">
//           <div className="bg-black/90 rounded-lg p-4">
//             <div className="text-white text-sm mb-2 font-bold">Host Controls</div>
//             <div className="flex flex-wrap gap-2">
//               {!contestStarted && (
//                 <button
//                   onClick={() => setShowSelection(true)}
//                   className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
//                 >
//                   Select Contestants
//                 </button>
//               )}

//               {contestStarted && !currentPerformerId && performanceQueue.length > 0 && !votingPhase && 
//                 !getTurnBasedValues().autoAdvance && (
//                   <button
//                     onClick={startFirstTurn}
//                     className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded animate-pulse"
//                   >
//                     Start First Turn
//                   </button>
//               )}

//               {currentPerformerId && (
//                 <>
//                   <button
//                     onClick={endCurrentTurn}
//                     className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded"
//                   >
//                     End Turn
//                   </button>
//                   {!getTurnBasedValues().autoAdvance && (
//                     <button
//                       onClick={startNextTurn}
//                       className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
//                     >
//                       Next Turn
//                     </button>
//                   )}
//                 </>
//               )}

//               {contestStarted && !currentPerformerId && !votingPhase && performanceQueue.length === 0 && 
//                 !getTurnBasedValues().autoAdvance && (
//                   <button
//                     onClick={startVoting}
//                     className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded animate-pulse"
//                   >
//                     Start Voting
//                   </button>
//               )}

//               {contestConfig.rules.votingPermissions === "judges" && contestStarted && (
//                 <button
//                   onClick={() => setShowJudgeManagement(!showJudgeManagement)}
//                   className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
//                 >
//                   Judges ({contest.judges.length})
//                 </button>
//               )}

//               {contestStarted && (
//                 <button
//                   onClick={() => contest.endContest()}
//                   className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
//                 >
//                   End Contest
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Judge Management Panel */}
//       <JudgeManagementPanel />

//       {/* Performance Display */}
//       {currentPerformerId && !votingPhase && (
//         <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
//           <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl px-8 py-4">
//             <div className="text-white text-center">
//               <p className="text-sm opacity-80">Now Performing</p>
//               <p className="text-2xl font-bold">
//                 {contest.getContestant(currentPerformerId)?.name || currentPerformerId.slice(0, 8)}
//               </p>
//               <div className="text-4xl font-bold mt-2">
//                 {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Performance Queue */}
//       {performanceQueue.length > 0 && !votingPhase && (
//         <div className="absolute left-4 top-24 w-72 pointer-events-auto">
//           <div className="bg-gray-900/90 backdrop-blur-lg rounded-xl p-4">
//             <h3 className="text-white font-semibold mb-3">Queue ({performanceQueue.length})</h3>
//             <div className="space-y-2">
//               {performanceQueue.slice(0, 5).map((id, idx) => {
//                 const contestant = contest.getContestant(id);
//                 return (
//                   <div
//                     key={id}
//                     className={`flex items-center justify-between bg-gray-800 rounded-lg p-2 ${
//                       idx === 0 ? "ring-2 ring-purple-500" : ""
//                     }`}
//                   >
//                     <div className="flex items-center space-x-2">
//                       <span className="text-gray-400 text-sm">#{idx + 1}</span>
//                       <span className="text-white">{contestant?.name || "Unknown"}</span>
//                     </div>
//                     {idx === 0 && (
//                       <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Next</span>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Leaderboard */}
//       {!votingPhase && !showFinalResults && contest.leaderboard.length > 0 && !currentPerformerId && (
//         <div className="absolute left-4 top-[400px] w-80 pointer-events-auto">
//           <div className="bg-gray-900/90 backdrop-blur-lg rounded-xl p-4">
//             <h3 className="text-white font-semibold mb-3">Standings</h3>
//             <div className="space-y-2">
//               {contest.leaderboard.slice(0, 5).map((entry: any, index: number) => (
//                 <div
//                   key={entry.participantId}
//                   className="flex items-center justify-between bg-gray-800 rounded p-2"
//                 >
//                   <div className="flex items-center space-x-2">
//                     <span
//                       className={`font-bold ${
//                         index === 0
//                           ? "text-yellow-400"
//                           : index === 1
//                           ? "text-gray-300"
//                           : index === 2
//                           ? "text-orange-400"
//                           : "text-gray-500"
//                       }`}
//                     >
//                       #{index + 1}
//                     </span>
//                     <span className="text-white">{entry.name}</span>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-white font-bold">{entry.score.toFixed(1)}</div>
//                     <div className="text-gray-400 text-xs">{entry.votes}v</div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* YOUR TURN overlay - Non-blocking version */}
//       {isMyTurn && currentPerformerId && !votingPhase && (
//         <div className="absolute top-20 left-1/2 transform -translate-x-1/2 pointer-events-auto z-50 animate-bounce">
//           <div className="bg-gradient-to-br from-purple-900 to-pink-900 p-6 rounded-2xl shadow-2xl border-2 border-purple-400">
//             <div className="text-center">
//               <h2 className="text-3xl font-bold text-white mb-3">🎤 YOUR TURN! 🎤</h2>
//               <div className="text-4xl font-bold text-white mb-4">
//                 {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
//               </div>
//               {contest.isHost && (
//                 <button
//                   onClick={endCurrentTurn}
//                   className="px-6 py-2 bg-white text-purple-900 rounded-lg text-lg font-bold hover:bg-gray-100 transition-colors"
//                 >
//                   End My Turn
//                 </button>
//               )}
//             </div>
//           </div>
//           <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-50 animate-pulse" />
//         </div>
//       )}

//       {/* VOTING PHASE UI */}
//       {votingPhase && (
//         <div className="absolute inset-0 bg-black/90 flex items-center justify-center pointer-events-auto overflow-y-auto">
//           <div className="max-w-6xl w-full p-8">
//             <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl p-6 mb-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h2 className="text-3xl font-bold text-white mb-2">Voting Phase</h2>
//                   {isJudge && (
//                     <span className="px-3 py-1 bg-yellow-600/30 text-yellow-300 text-sm rounded-full font-medium">
//                       JUDGE VOTING
//                     </span>
//                   )}
//                 </div>
//                 <div className="text-center text-white">
//                   <div className="text-4xl font-bold">
//                     {Math.floor(votingTimeRemaining / 60)}:
//                     {(votingTimeRemaining % 60).toString().padStart(2, "0")}
//                   </div>
//                   <p className="text-purple-200 mt-2">
//                     {contestConfig.votingType === "criteria"
//                       ? `Rate on ${votingCriteria.length} criteria`
//                       : "Rate each performer"}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             {/* Check if user can vote - judges can always vote in judge-only mode */}
//             {(contestConfig.rules.votingPermissions === "judges" && !isJudge) || 
//              (contestConfig.rules.votingPermissions !== "judges" && !contest.canVote) ? (
//               <div className="bg-gray-800 rounded-lg p-8 text-center">
//                 <p className="text-white text-xl">
//                   {contestConfig.rules.votingPermissions === "judges" && !isJudge
//                     ? "Voting is restricted to judges only"
//                     : "You are not eligible to vote"}
//                 </p>
//                 <p className="text-gray-400 mt-2">
//                   Watch the results update in real-time
//                 </p>
//               </div>
//             ) : (
//               <div className="flex gap-6">
//                 <div className="flex-1 space-y-4 max-h-[60vh] overflow-y-auto">
//                   {contest.contestants
//                     .filter((c: any) => c.participantId !== identity)
//                     .map((contestant: any) => {
//                       const hasSubmitted = submittedVotes.has(contestant.participantId);
//                       const scores = criteriaScores[contestant.participantId] || {};

//                       return (
//                         <div key={contestant.participantId} className="bg-gray-800 rounded-lg p-4">
//                           <h3 className="text-white font-bold mb-3">{contestant.name}</h3>

//                           {hasSubmitted ? (
//                             <div className="text-green-400 text-center py-4">Submitted</div>
//                           ) : (
//                             <>
//                               <div className="space-y-3">
//                                 {votingCriteria.map((criterion) => (
//                                   <div key={criterion.id}>
//                                     <div className="flex justify-between mb-1">
//                                       <span className="text-white text-sm">{criterion.name}</span>
//                                       {contestConfig.votingType === "criteria" && (
//                                         <span className="text-gray-400 text-xs">
//                                           {Math.round(criterion.weight * 100)}%
//                                         </span>
//                                       )}
//                                     </div>
//                                     <div className="flex gap-1">
//                                       {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
//                                         <button
//                                           key={score}
//                                           onClick={() =>
//                                             handleCriteriaScore(contestant.participantId, criterion.id, score)
//                                           }
//                                           className={`flex-1 py-2 text-xs rounded ${
//                                             scores[criterion.id] === score
//                                               ? "bg-purple-600 text-white"
//                                               : "bg-gray-700 hover:bg-gray-600 text-gray-300"
//                                           }`}
//                                         >
//                                           {score}
//                                         </button>
//                                       ))}
//                                     </div>
//                                   </div>
//                                 ))}
//                               </div>

//                               <button
//                                 onClick={() => submitVotesForContestant(contestant.participantId)}
//                                 disabled={!votingCriteria.every((c) => scores[c.id] > 0)}
//                                 className={`w-full mt-4 py-2 rounded font-semibold ${
//                                   votingCriteria.every((c) => scores[c.id] > 0)
//                                     ? "bg-purple-600 text-white hover:bg-purple-700"
//                                     : "bg-gray-700 text-gray-400 cursor-not-allowed"
//                                 }`}
//                               >
//                                 Submit Vote
//                               </button>
//                             </>
//                           )}
//                         </div>
//                       );
//                     })}
//                 </div>

//                 <div className="w-96">
//                   <div className="bg-gray-900 rounded-lg p-4 sticky top-0">
//                     <h3 className="text-white font-bold mb-4">Live Leaderboard</h3>
//                     {contest.leaderboard.length > 0 ? (
//                       <div className="space-y-2">
//                         {contest.leaderboard.map((entry: any, index: number) => (
//                           <div
//                             key={entry.participantId}
//                             className={`flex items-center justify-between p-3 rounded-lg ${
//                               index === 0
//                                 ? "bg-yellow-900/30 border border-yellow-600/50"
//                                 : index === 1
//                                 ? "bg-gray-700/50 border border-gray-600/50"
//                                 : index === 2
//                                 ? "bg-orange-900/30 border border-orange-600/50"
//                                 : "bg-gray-800"
//                             }`}
//                           >
//                             <div className="flex items-center space-x-3">
//                               <div className="text-2xl font-bold">{index + 1}</div>
//                               <div>
//                                 <div className="text-white font-medium">{entry.name}</div>
//                                 <div className="text-gray-400 text-xs">{entry.votes} votes</div>
//                               </div>
//                             </div>
//                             <div className="text-right">
//                               <div className="text-white font-bold text-lg">{entry.score.toFixed(1)}</div>
//                               <div className="text-gray-400 text-xs">/ 10</div>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     ) : (
//                       <div className="text-gray-400 text-center py-8">No votes yet</div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* FINAL RESULTS */}
//       {showFinalResults && !votingPhase && contest.leaderboard.length > 0 && (
//         <div className="absolute inset-0 bg-black/90 flex items-center justify-center pointer-events-auto">
//           <div className="max-w-4xl w-full p-8">
//             <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl p-8">
//               <h2 className="text-4xl font-bold text-white text-center mb-8">Contest Results</h2>
//               <div className="space-y-3">
//                 {contest.leaderboard.map((entry: any, index: number) => (
//                   <div
//                     key={entry.participantId}
//                     className={`flex items-center justify-between p-4 rounded-lg ${
//                       index === 0
//                         ? "bg-gradient-to-r from-yellow-600/30 to-yellow-500/30 border-2 border-yellow-400 scale-105"
//                         : index === 1
//                         ? "bg-gradient-to-r from-gray-600/30 to-gray-500/30 border border-gray-400"
//                         : index === 2
//                         ? "bg-gradient-to-r from-orange-600/30 to-orange-500/30 border border-orange-400"
//                         : "bg-gray-800/50"
//                     }`}
//                   >
//                     <div className="flex items-center space-x-4">
//                       <div className="text-3xl font-bold w-12 text-center">{index + 1}</div>
//                       <div>
//                         <div className="text-white font-bold text-lg">{entry.name}</div>
//                         <div className="text-gray-300 text-sm">{entry.votes} votes</div>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <div className="text-white font-bold text-2xl">{entry.score.toFixed(2)}</div>
//                       <div className="text-gray-400 text-sm">out of 10</div>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {contest.isHost && (
//                 <button
//                   onClick={() => {
//                     setShowFinalResults(false);
//                     contest.endContest();
//                   }}
//                   className="w-full mt-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-lg"
//                 >
//                   Close Results
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo } from "react";
import { useParticipantList, useStreamContext, type ParticipantId, useContest } from "@vidbloq/react";
import { TurnBasedContestPlugin } from "./turn-based-plugin";
import { useContestConfig } from "../../hooks";
import { isTurnBasedConfig } from "../../utils";
import { Users, Clock, Trophy, ChevronDown, ChevronUp, X, Mic, Play, Medal, Crown, Award, CheckCircle, User, BarChart3 } from "lucide-react";

export function TurnBased() {
  const { participants } = useParticipantList();
  const { identity, websocket, roomName } = useStreamContext();
  const { config: contestConfig } = useContestConfig();

  const getTurnBasedValues = () => {
    if (isTurnBasedConfig(contestConfig)) {
      return {
        turnDuration: contestConfig.plugin.turnDuration,
        autoAdvance: contestConfig.plugin.autoAdvance,
      };
    }
    return {
      turnDuration: 120,
      autoAdvance: false,
    };
  };

  // State
  const [currentPerformerId, setCurrentPerformerId] = useState<string | null>(null);
  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);
  const [turnDuration, setTurnDuration] = useState(120);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSelection, setShowSelection] = useState(false);
  const [selectedContestants, setSelectedContestants] = useState<Set<string>>(new Set());
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [contestStarted, setContestStarted] = useState(false);
  const [votingPhase, setVotingPhase] = useState(false);
  const [votingTimeRemaining, setVotingTimeRemaining] = useState(0);
  const [performanceQueue, setPerformanceQueue] = useState<string[]>([]);
  const [criteriaScores, setCriteriaScores] = useState<Record<string, Record<string, number>>>({});
  const [submittedVotes, setSubmittedVotes] = useState<Set<string>>(new Set());
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [pluginInitialized, setPluginInitialized] = useState(false);
  const [queueInitialized, setQueueInitialized] = useState(false);
  const [showJudgeManagement, setShowJudgeManagement] = useState(false);
  const [expandedContestant, setExpandedContestant] = useState<string | null>(null);
  // const [showDebug, setShowDebug] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showStandings, setShowStandings] = useState(false);

  // Refs for handling auto-advance with current state
  const plugin = useRef<TurnBasedContestPlugin | null>(null);
  const pluginConfig = useRef({ turnDuration: 120, autoAdvance: false });
  const nextQueueRef = useRef<string[]>([]);
  const contestStateRef = useRef({ 
    votingPhase: false, 
    contestStarted: false,
    currentPerformerId: null as string | null
  });
  console.log(eventLog)

  // Keep contestStateRef synced with actual state
  useEffect(() => {
    contestStateRef.current = {
      votingPhase,
      contestStarted,
      currentPerformerId
    };
  }, [votingPhase, contestStarted, currentPerformerId]);

  // Log function
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
    setEventLog((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 30));
  };

  // Initialize plugin ONCE
  useEffect(() => {
    if (!plugin.current) {
      const values = getTurnBasedValues();
      pluginConfig.current = { ...values };
      plugin.current = new TurnBasedContestPlugin({
        turnDuration: values.turnDuration,
        autoAdvance: values.autoAdvance,
      });
      setPluginInitialized(true);
      setTurnDuration(values.turnDuration);
      addLog(`Plugin created - Duration: ${values.turnDuration}s, AutoAdvance: ${values.autoAdvance}`);
    }
  }, []);

  // Update plugin properties when config changes
  useEffect(() => {
    if (plugin.current && pluginInitialized) {
      const values = getTurnBasedValues();

      if (
        pluginConfig.current.turnDuration !== values.turnDuration ||
        pluginConfig.current.autoAdvance !== values.autoAdvance
      ) {
        pluginConfig.current = { ...values };
        setTurnDuration(values.turnDuration);
        addLog(`Plugin updated - Duration: ${values.turnDuration}s, AutoAdvance: ${values.autoAdvance}`);
      }
    }
  }, [contestConfig, pluginInitialized]);

  // Get voting criteria
  const getVotingCriteria = () => {
    if (contestConfig.votingType === "criteria" && contestConfig.votingCriteria) {
      return contestConfig.votingCriteria;
    }
    return [
      {
        id: "overall",
        name: "Overall Score",
        weight: 1,
        description: "Rate the overall performance",
      },
    ];
  };

  const votingCriteria = getVotingCriteria();

  // Contest config
  const config = useMemo(
    () => ({
      mode: contestConfig.mode,
      name: contestConfig.name,
      features: {
        voting: true,
        elimination: false,
        leaderboard: true,
        timer: false,
      },
      rules: {
        minContestants: 2,
        votingPermissions: contestConfig.rules.votingPermissions,
        votingDuration: contestConfig.rules.votingDuration,
        selfVoting: false,
      },
      scoring: {
        type: "average" as const,
        scoreRange: { min: 1, max: 10 },
      },
    }),
    [contestConfig]
  );

  // Create plugins array
  const pluginsArray = useMemo(() => {
    if (plugin.current && pluginInitialized) {
      return [plugin.current];
    }
    return [];
  }, [pluginInitialized]);

  // Use contest with plugins
  const contest = useContest(config, {
    plugins: pluginsArray,
  });

  // Initialize queue ONLY for host when contest becomes active
  useEffect(() => {
    if (
      contest.state.status === "active" &&
      contest.isHost &&
      !queueInitialized &&
      performanceQueue.length === 0
    ) {
      const contestants = Array.from(contest.state.contestants.values())
        .filter((c: any) => !c.isEliminated)
        .map((c: any) => c.participantId);

      if (contestants.length > 0) {
        const shuffled = [...contestants].sort(() => Math.random() - 0.5);
        setPerformanceQueue(shuffled);
        nextQueueRef.current = shuffled;
        setQueueInitialized(true);
        addLog(`Host initialized queue with ${shuffled.length} contestants`);

        if (websocket && roomName) {
          websocket.sendMessage("turnBasedReady", {
            roomName: roomName,
            queueLength: shuffled.length,
            queue: shuffled,
          });

          addLog(`Sent queue to all participants`);

          if (getTurnBasedValues().autoAdvance) {
            addLog("Auto-starting first turn in 3 seconds...");
            setTimeout(() => {
              const firstPerformer = shuffled[0];
              const remainingQueue = shuffled.slice(1);
              const values = getTurnBasedValues();

              addLog(`Auto-starting first turn for ${firstPerformer}`);

              websocket.sendMessage("turnStart", {
                roomName: roomName,
                participantId: firstPerformer,
                duration: values.turnDuration,
                queue: remainingQueue,
                currentPerformer: firstPerformer,
              });

              nextQueueRef.current = remainingQueue;
            }, 3000);
          }
        }
      }
    }

    if (contest.state.status !== "active") {
      setQueueInitialized(false);
      nextQueueRef.current = [];
    }
  }, [
    contest.state.status,
    contest.state.contestants,
    contest.isHost,
    queueInitialized,
    performanceQueue.length,
    websocket,
    roomName,
  ]);

  // WebSocket listeners (keeping your existing logic)
  useEffect(() => {
    if (!websocket) {
      addLog("No websocket");
      return;
    }

    const handleTurnStart = (data: any) => {
      const duration = data.duration || turnDuration;
      addLog(`TURN START: ${data.participantId} for ${duration}s`);
      setCurrentPerformerId(data.participantId);
      setTurnStartTime(Date.now());
      setTurnDuration(duration);
      setTimeRemaining(duration);

      if (data.queue) {
        setPerformanceQueue(data.queue);
        nextQueueRef.current = data.queue;
        addLog(`Queue updated: ${data.queue.length} remaining`);
      }
    };

    const handleTurnEnd = (data: any) => {
      addLog(`TURN END: ${data.participantId || "unknown"}`);
      setCurrentPerformerId(null);
      setTurnStartTime(null);
      setTimeRemaining(0);

      if (contest.isHost && getTurnBasedValues().autoAdvance) {
        const currentQueue = nextQueueRef.current;

        if (currentQueue.length > 0) {
          addLog(`Auto-advancing in 2 seconds... (${currentQueue.length} remaining)`);

          setTimeout(() => {
            const currentState = contestStateRef.current;
            
            if (!currentState.votingPhase && !currentState.currentPerformerId && currentState.contestStarted) {
              const nextPerformer = currentQueue[0];
              const remainingQueue = currentQueue.slice(1);
              const values = getTurnBasedValues();

              addLog(`Auto-starting turn for ${nextPerformer}`);

              if (websocket && roomName) {
                websocket.sendMessage("turnStart", {
                  roomName: roomName,
                  participantId: nextPerformer,
                  duration: values.turnDuration,
                  queue: remainingQueue,
                  currentPerformer: nextPerformer,
                });
              }

              nextQueueRef.current = remainingQueue;
            } else {
              addLog(`Auto-advance blocked: voting=${currentState.votingPhase}, performer=${currentState.currentPerformerId}, contest=${currentState.contestStarted}`);
            }
          }, 2000);
        } else {
          addLog("All turns complete, auto-starting voting in 2 seconds...");
          setTimeout(() => {
            const currentState = contestStateRef.current;
            if (!currentState.votingPhase && currentState.contestStarted) {
              addLog(`Auto-starting voting (${contestConfig.rules.votingDuration}s)`);
              if (websocket && roomName) {
                websocket.sendMessage("startVoting", {
                  roomName: roomName,
                  duration: contestConfig.rules.votingDuration,
                });
              }
            }
          }, 2000);
        }
      }
    };

    const handleContestStart = (data: any) => {
      addLog("CONTEST STARTED");
      setContestStarted(true);
      setShowFinalResults(false);
      setCriteriaScores({});
      setSubmittedVotes(new Set());
      setPerformanceQueue([]);

      if (data?.contestants) {
        addLog(`Contestants: ${data.contestants.length}`);
      }

      if (contest.isHost && getTurnBasedValues().autoAdvance) {
        addLog("Auto-advance enabled, will start first turn automatically when ready");
      }
    };

    const handleContestEnd = () => {
      addLog("CONTEST ENDED");
      setContestStarted(false);
      setCurrentPerformerId(null);
      setVotingPhase(false);
      setShowFinalResults(false);
      setCriteriaScores({});
      setSubmittedVotes(new Set());
      setPerformanceQueue([]);
      setQueueInitialized(false);
      nextQueueRef.current = [];
    };

    const handleTurnBasedReady = (data: any) => {
      addLog(`TURN BASED READY: ${data.queueLength} in queue`);
      if (data.queue && !contest.isHost) {
        setPerformanceQueue(data.queue);
        nextQueueRef.current = data.queue;
        addLog(`Queue synced from host: ${data.queue.join(", ")}`);
      }
    };

    const handleAllTurnsComplete = () => {
      addLog("ALL TURNS COMPLETE");
      setCurrentPerformerId(null);
      setPerformanceQueue([]);

      if (contest.isHost && getTurnBasedValues().autoAdvance && !votingPhase) {
        addLog("Auto-starting voting phase in 2 seconds...");
        setTimeout(() => {
          const currentState = contestStateRef.current;
          if (!currentState.votingPhase && currentState.contestStarted) {
            addLog(`Auto-starting voting (${contestConfig.rules.votingDuration}s)`);
            if (websocket && roomName) {
              websocket.sendMessage("startVoting", {
                roomName: roomName,
                duration: contestConfig.rules.votingDuration,
              });
            }
          }
        }, 2000);
      }
    };

    const handleVotingStart = (data: any) => {
      addLog(`VOTING START: ${data.duration}s`);
      setCurrentPerformerId(null);
      setTurnStartTime(null);
      setTimeRemaining(0);
      setVotingPhase(true);
      setVotingTimeRemaining(data.duration || contestConfig.rules.votingDuration);
    };

    const handleVotingEnd = () => {
      addLog("VOTING END");
      setVotingPhase(false);
      setVotingTimeRemaining(0);
      setShowFinalResults(true);
    };

    const handleBroadcast = (data: any) => {
      if (data.event === "turnBasedReady") {
        handleTurnBasedReady(data.data);
      } else if (data.event === "turnStart") {
        handleTurnStart(data.data);
      } else if (data.event === "turnEnd") {
        handleTurnEnd(data.data);
      }
    };

    websocket.addEventListener("turnStart", handleTurnStart);
    websocket.addEventListener("turnEnd", handleTurnEnd);
    websocket.addEventListener("turnTimeout", handleTurnEnd);
    websocket.addEventListener("contestStart", handleContestStart);
    websocket.addEventListener("contestEnd", handleContestEnd);
    websocket.addEventListener("turnBasedReady", handleTurnBasedReady);
    websocket.addEventListener("allTurnsComplete", handleAllTurnsComplete);
    websocket.addEventListener("votingStart", handleVotingStart);
    websocket.addEventListener("votingEnd", handleVotingEnd);
    websocket.addEventListener("broadcast", handleBroadcast);

    addLog("WebSocket listeners attached");

    return () => {
      websocket.removeEventListener("turnStart", handleTurnStart);
      websocket.removeEventListener("turnEnd", handleTurnEnd);
      websocket.removeEventListener("turnTimeout", handleTurnEnd);
      websocket.removeEventListener("contestStart", handleContestStart);
      websocket.removeEventListener("contestEnd", handleContestEnd);
      websocket.removeEventListener("turnBasedReady", handleTurnBasedReady);
      websocket.removeEventListener("allTurnsComplete", handleAllTurnsComplete);
      websocket.removeEventListener("votingStart", handleVotingStart);
      websocket.removeEventListener("votingEnd", handleVotingEnd);
      websocket.removeEventListener("broadcast", handleBroadcast);
    };
  }, [
    websocket,
    turnDuration,
    contestConfig.rules.votingDuration,
    contest.isHost,
    votingPhase,
    roomName,
  ]);

  useEffect(() => {
    if (!turnStartTime || votingPhase) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
      const remaining = Math.max(0, turnDuration - elapsed);
      setTimeRemaining(remaining);
      
      if (remaining === 0 && currentPerformerId && contest.isHost && getTurnBasedValues().autoAdvance) {
        addLog("Timer expired - auto-ending turn");
        setCurrentPerformerId(null);
        
        if (websocket && roomName) {
          websocket.sendMessage("turnEnd", {
            roomName: roomName,
            participantId: currentPerformerId,
          });
          
          addLog(`Auto-ended turn for ${currentPerformerId}`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [turnStartTime, turnDuration, votingPhase, currentPerformerId, contest.isHost, websocket, roomName]);

  // Voting countdown
  useEffect(() => {
    if (votingTimeRemaining <= 0) return;

    const interval = setInterval(() => {
      setVotingTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [votingTimeRemaining]);

  const isMyTurn = currentPerformerId === identity && !votingPhase;
  const isJudge = contest.judges.includes(identity as ParticipantId);

  // Contest functions
  const startContest = async () => {
    if (selectedContestants.size < 2) {
      addLog("Need at least 2 contestants");
      return;
    }

    const selected = participants.filter((p) => selectedContestants.has(p.id));
    addLog(`Starting contest with: ${selected.map((p) => p.userName).join(", ")}`);

    await contest.startContest(selected);
    setShowSelection(false);
  };

  const startFirstTurn = () => {
    if (!contest.isHost) {
      addLog("ERROR: Only host can start turns");
      return;
    }

    if (performanceQueue.length === 0) {
      addLog("ERROR: Queue is empty");
      return;
    }

    const firstPerformer = performanceQueue[0];
    const remainingQueue = performanceQueue.slice(1);
    const values = getTurnBasedValues();

    addLog(`Starting turn for ${firstPerformer} (${values.turnDuration}s)`);

    if (websocket && roomName) {
      websocket.sendMessage("turnStart", {
        roomName: roomName,
        participantId: firstPerformer,
        duration: values.turnDuration,
        queue: remainingQueue,
        currentPerformer: firstPerformer,
      });

      nextQueueRef.current = remainingQueue;
      addLog(`Sent turn start for ${firstPerformer}`);
    }
  };

  const endCurrentTurn = () => {
    if (!contest.isHost) {
      addLog("ERROR: Only host can end turns");
      return;
    }

    if (!currentPerformerId) {
      addLog("ERROR: No active turn");
      return;
    }

    addLog("Ending turn");

    if (websocket && roomName) {
      websocket.sendMessage("turnEnd", {
        roomName: roomName,
        participantId: currentPerformerId,
      });

      addLog(`Sent turn end for ${currentPerformerId}`);
    }
  };

  const startNextTurn = () => {
    if (!contest.isHost) {
      addLog("ERROR: Only host can start turns");
      return;
    }

    if (performanceQueue.length === 0) {
      addLog("ERROR: No more performers in queue");
      return;
    }

    const nextPerformer = performanceQueue[0];
    const remainingQueue = performanceQueue.slice(1);
    const values = getTurnBasedValues();

    addLog(`Starting next turn for ${nextPerformer}`);

    if (websocket && roomName) {
      websocket.sendMessage("turnStart", {
        roomName: roomName,
        participantId: nextPerformer,
        duration: values.turnDuration,
        queue: remainingQueue,
        currentPerformer: nextPerformer,
      });

      nextQueueRef.current = remainingQueue;
      addLog(`Sent next turn for ${nextPerformer}`);
    }
  };

  const startVoting = () => {
    addLog(`Starting voting (${contestConfig.rules.votingDuration}s)`);
    if (websocket && roomName) {
      websocket.sendMessage("startVoting", {
        roomName: roomName,
        duration: contestConfig.rules.votingDuration,
      });
    }
  };

  // Voting functions
  const handleCriteriaScore = (contestantId: string, criterionId: string, score: number) => {
    setCriteriaScores((prev) => ({
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

    const allScored = votingCriteria.every((c) => scores[c.id] > 0);
    if (!allScored) {
      addLog("Rate all criteria first");
      return;
    }

    for (const criterion of votingCriteria) {
      if (scores[criterion.id]) {
        await contest.submitVote(contestantId, scores[criterion.id], criterion.id);
      }
    }

    setSubmittedVotes((prev) => new Set([...prev, contestantId]));
    addLog(`Voted for ${contest.getContestant(contestantId)?.name}`);
  };

  // Selection UI - Cleaner design
  if (showSelection && contest.isHost) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl max-w-md w-full border border-gray-800">
          <div className="p-6">
            <h2 className="text-white text-xl font-semibold mb-4">Select Contest Participants</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {participants.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedContestants.has(p.id)}
                    onChange={(e) => {
                      const newSet = new Set(selectedContestants);
                      if (e.target.checked) {
                        newSet.add(p.id);
                      } else {
                        newSet.delete(p.id);
                      }
                      setSelectedContestants(newSet);
                    }}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-white text-sm">{p.userName || p.id}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-800/20 border-t border-gray-800 flex items-center justify-between">
            <span className="text-sm text-gray-400">
              {selectedContestants.size} of {participants.length} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSelection(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startContest}
                disabled={selectedContestants.size < 2}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
      </div>
    );
  }

  // Judge Management Panel - Cleaner design
  const JudgeManagementPanel = () => {
    if (!showJudgeManagement || !contest.isHost) return null;

    return (
      <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 bg-gray-900 rounded-xl w-96 max-h-96 overflow-hidden z-[150] pointer-events-auto border border-gray-800 shadow-xl">
        <div className="p-4 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Manage Judges
            </h3>
            <button
              onClick={() => setShowJudgeManagement(false)}
              className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="p-4 space-y-2 overflow-y-auto max-h-72">
          {participants.map(participant => {
            const isParticipantJudge = contest.judges.includes(participant.id as ParticipantId);
            return (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isParticipantJudge ? 'bg-purple-400' : 'bg-gray-600'}`} />
                  <span className="text-white text-sm">{participant.userName || participant.id}</span>
                </div>
                <button
                  onClick={() => {
                    if (isParticipantJudge) {
                      contest.removeJudge(participant.id);
                    } else {
                      contest.addJudge(participant.id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isParticipantJudge
                      ? 'bg-gray-700 text-gray-300 hover:bg-red-600/20 hover:text-red-400'
                      : 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30'
                  }`}
                >
                  {isParticipantJudge ? 'Remove' : 'Add as Judge'}
                </button>
              </div>
            );
          })}
        </div>
        {contestConfig.rules.votingPermissions === "judges" && contest.judges.length === 0 && (
          <div className="p-4 bg-yellow-900/10 border-t border-yellow-900/20">
            <p className="text-xs text-yellow-600">
              ⚠️ No judges assigned. Add judges to enable voting in judge-only mode.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Main UI
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Debug Panel Toggle - Minimal design */}
      {/* {contest.isHost && (
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="fixed top-4 right-4 z-30 pointer-events-auto px-3 py-1.5 bg-gray-900 hover:bg-gray-800 rounded-lg text-xs text-gray-400 transition-colors border border-gray-800"
        >
          {showDebug ? 'Hide' : 'Show'} Debug
        </button>
      )} */}

      {/* Debug Panel - Cleaner design */}
      {/* {showDebug && (
        <div className="fixed top-14 right-4 w-80 bg-gray-900 text-white text-xs rounded-lg pointer-events-auto max-h-96 overflow-hidden border border-gray-800 shadow-xl">
          <div className="p-3 border-b border-gray-800 bg-purple-600/10">
            <div className="text-purple-400 font-semibold">Debug Information</div>
          </div>
          <div className="p-3 space-y-1.5 overflow-y-auto max-h-80">
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="text-gray-400">Plugin Status:</div>
              <div className={pluginInitialized ? "text-green-400" : "text-red-400"}>
                {pluginInitialized ? "Active" : "Inactive"}
              </div>
              <div className="text-gray-400">Contest:</div>
              <div className={contestStarted ? "text-green-400" : "text-gray-500"}>
                {contestStarted ? "Running" : "Idle"}
              </div>
              <div className="text-gray-400">Phase:</div>
              <div className="text-purple-400">
                {votingPhase ? `Voting (${votingTimeRemaining}s)` : currentPerformerId ? "Performance" : "Waiting"}
              </div>
              <div className="text-gray-400">Queue:</div>
              <div className="text-yellow-400">{performanceQueue.length} remaining</div>
              <div className="text-gray-400">Auto-Advance:</div>
              <div className={getTurnBasedValues().autoAdvance ? "text-green-400" : "text-gray-500"}>
                {getTurnBasedValues().autoAdvance ? "ON" : "OFF"}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-800">
              <div className="text-[10px] text-gray-400 mb-1">Recent Events</div>
              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {eventLog.slice(0, 10).map((log, i) => (
                  <div key={i} className="text-[10px] text-gray-500 truncate">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Host Controls - Refined minimal design */}
      {contest.isHost && (
        <div className="fixed bottom-14 sm:!bottom-12 left-1/2 transform -translate-x-1/2 pointer-events-auto w-auto px-2 sm:!w-auto">
          <div className="bg-gray-900 rounded-lg px-3 sm:px-4 py-2 sm:py-3 border border-gray-800 shadow-xl">
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              {!contestStarted && (
                <button
                  onClick={() => setShowSelection(true)}
                  className="px-3 sm:!px-4 py-1.5 sm:!py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:!text-sm rounded-lg transition-colors flex items-center gap-1.5 sm:!gap-2"
                >
                  <Users className="w-3 sm:!w-4 h-3 sm:!h-4" />
                  <span className="hidden sm:!inline">Start Contest</span>
                  <span className="sm:!hidden">Start</span>
                </button>
              )}

              {contestStarted && !currentPerformerId && performanceQueue.length > 0 && !votingPhase && 
                !getTurnBasedValues().autoAdvance && (
                  <button
                    onClick={startFirstTurn}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2"
                  >
                    <Play className="w-3 sm:w-4 h-3 sm:h-4" />
                    <span className="hidden sm:!inline">Start First Turn</span>
                    <span className="sm:!hidden">Start</span>
                  </button>
              )}

              {currentPerformerId && (
                <>
                  <button
                    onClick={endCurrentTurn}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm rounded-lg transition-colors"
                  >
                    End Turn
                  </button>
                  {!getTurnBasedValues().autoAdvance && (
                    <button
                      onClick={startNextTurn}
                      className="px-3 sm:!px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:!text-sm rounded-lg transition-colors"
                    >
                      Next Turn
                    </button>
                  )}
                </>
              )}

              {contestStarted && !currentPerformerId && !votingPhase && performanceQueue.length === 0 && 
                !getTurnBasedValues().autoAdvance && (
                  <button
                    onClick={startVoting}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm rounded-lg transition-colors"
                  >
                    Start Voting
                  </button>
              )}

              {contestConfig.rules.votingPermissions === "judges" && contestStarted && (
                <button
                  onClick={() => setShowJudgeManagement(!showJudgeManagement)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2"
                >
                  <Users className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span>Judges ({contest.judges.length})</span>
                </button>
              )}

              {contestStarted && (
                <button
                  onClick={() => contest.endContest()}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 text-xs sm:text-sm rounded-lg transition-colors border border-red-600/20"
                >
                  End
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Judge Management Panel */}
      <JudgeManagementPanel />

      {/* Performance Display - Minimal, non-intrusive */}
      {currentPerformerId && !votingPhase && (
        <div className="fixed top-16 sm:top-20 left-1/2 transform -translate-x-1/2 pointer-events-auto z-20 w-[90vw] sm:w-auto">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg px-3 sm:px-5 py-2 sm:py-2.5 border border-gray-800">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400 uppercase tracking-wider hidden sm:inline">Live</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-white">
                <Mic className="w-3 sm:w-4 h-3 sm:h-4 text-purple-400" />
                <span className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                  {contest.getContestant(currentPerformerId)?.name || "Performer"}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 text-white">
                <Clock className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400" />
                <span className="font-mono text-xs sm:text-sm font-semibold">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Buttons for Queue and Standings */}
      {performanceQueue.length > 0 && !votingPhase && (
        <button
          onClick={() => setShowQueue(!showQueue)}
          className="fixed left-4 top-32 pointer-events-auto bg-gray-900/95 backdrop-blur-sm p-2.5 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors z-20"
          title="Performance Queue"
        >
          <Users className="w-4 h-4 text-purple-400" />
        </button>
      )}
      
      {!votingPhase && !showFinalResults && contest.leaderboard.length > 0 && !currentPerformerId && (
        <button
          onClick={() => setShowStandings(!showStandings)}
          className="fixed right-4 top-32 pointer-events-auto bg-gray-900/95 backdrop-blur-sm p-2.5 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors z-20"
          title="Standings"
        >
          <Trophy className="w-4 h-4 text-purple-400" />
        </button>
      )}

      {/* Performance Queue Panel */}
      {showQueue && performanceQueue.length > 0 && !votingPhase && (
        <div className="fixed left-4 top-44 w-64 pointer-events-auto z-30">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-800 shadow-xl">
            <div className="p-3 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  Queue
                  <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">
                    {performanceQueue.length}
                  </span>
                </h3>
                <button
                  onClick={() => setShowQueue(false)}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
              {performanceQueue.slice(0, 5).map((id, idx) => {
                const contestant = contest.getContestant(id);
                return (
                  <div
                    key={id}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                      idx === 0 ? "bg-purple-600/10 border border-purple-600/20" : "bg-gray-800/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${
                        idx === 0 ? "text-purple-400" : "text-gray-500"
                      }`}>
                        #{idx + 1}
                      </span>
                      <span className="text-white text-sm">{contestant?.name || "Performer"}</span>
                    </div>
                    {idx === 0 && (
                      <span className="text-[10px] bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full">
                        NEXT
                      </span>
                    )}
                  </div>
                );
              })}
              {performanceQueue.length > 5 && (
                <div className="text-xs text-gray-500 text-center pt-1">
                  +{performanceQueue.length - 5} more
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Standings Panel */}
      {showStandings && !votingPhase && !showFinalResults && contest.leaderboard.length > 0 && !currentPerformerId && (
        <div className="fixed right-4 top-44 w-72 pointer-events-auto z-30">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-800 shadow-xl">
            <div className="p-3 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-purple-400" />
                  Current Standings
                </h3>
                <button
                  onClick={() => setShowStandings(false)}
                  className="p-1 hover:bg-gray-800 rounded transition-colors"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
              {contest.leaderboard.slice(0, 5).map((entry: any, index: number) => (
                <div
                  key={entry.participantId}
                  className="flex items-center justify-between p-2.5 bg-gray-800/30 rounded-lg"
                >
                  <div className="flex items-center gap-2.5">
                    {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                    {index === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                    {index === 2 && <Award className="w-4 h-4 text-orange-500" />}
                    {index > 2 && <span className="w-4 text-center text-xs text-gray-500">{index + 1}</span>}
                    <span className="text-white text-sm">{entry.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold text-sm">{entry.score.toFixed(1)}</div>
                    <div className="text-gray-500 text-[10px]">{entry.votes} votes</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* YOUR TURN overlay - Compact and non-intrusive */}
      {isMyTurn && currentPerformerId && !votingPhase && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 pointer-events-auto z-50">
          <div className="bg-purple-600 rounded-lg px-6 py-3 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="font-semibold text-sm uppercase tracking-wider">Your Turn</span>
              </div>
              <div className="text-white font-mono text-lg font-bold">
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
              </div>
              {contest.isHost && (
                <button
                  onClick={endCurrentTurn}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded text-sm font-medium transition-colors"
                >
                  End Turn
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VOTING PHASE UI - Clean accordion design */}
      {votingPhase && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto overflow-y-auto p-2 sm:p-4">
          <div className="max-w-5xl w-full">
            {/* Header */}
            <div className="bg-gray-900 rounded-xl p-3 sm:p-5 mb-3 sm:mb-4 border border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h2 className="text-lg sm:text-2xl font-semibold text-white">Voting Phase</h2>
                  {isJudge && (
                    <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full font-medium">
                      JUDGE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-purple-400" />
                  <span className="text-xl sm:text-2xl font-mono font-bold">
                    {Math.floor(votingTimeRemaining / 60)}:{(votingTimeRemaining % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
              {contestConfig.votingType === "criteria" && (
                <p className="text-gray-400 text-xs sm:text-sm mt-2">
                  Rate each performer on {votingCriteria.length} criteria
                </p>
              )}
            </div>

            {/* Voting Content */}
            {(contestConfig.rules.votingPermissions === "judges" && !isJudge) || 
             (contestConfig.rules.votingPermissions !== "judges" && !contest.canVote) ? (
              <div className="bg-gray-900 rounded-xl p-6 sm:p-8 text-center border border-gray-800">
                <p className="text-white text-base sm:text-lg mb-2">
                  {contestConfig.rules.votingPermissions === "judges" && !isJudge
                    ? "Voting is restricted to judges"
                    : "You are not eligible to vote"}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm">Watch the results update in real-time</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Voting Cards */}
                <div className="lg:col-span-2 space-y-2 sm:space-y-3 max-h-[60vh] overflow-y-auto pr-0 sm:pr-2">
                  {contest.contestants
                    .filter((c: any) => c.participantId !== identity)
                    .map((contestant: any) => {
                      const hasSubmitted = submittedVotes.has(contestant.participantId);
                      const scores = criteriaScores[contestant.participantId] || {};
                      const isExpanded = expandedContestant === contestant.participantId;

                      return (
                        <div 
                          key={contestant.participantId} 
                          className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden"
                        >
                          {/* Contestant Header */}
                          <div className="p-3 sm:p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 sm:w-10 h-8 sm:h-10 bg-purple-600/20 rounded-full flex items-center justify-center">
                                  <User className="w-4 sm:w-5 h-4 sm:h-5 text-purple-400" />
                                </div>
                                <h3 className="text-white font-medium text-sm sm:text-base truncate">{contestant.name}</h3>
                              </div>
                              {hasSubmitted ? (
                                <div className="flex items-center gap-1.5 sm:gap-2 text-green-500 text-xs sm:text-sm">
                                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4" />
                                  <span className="hidden sm:inline">Voted</span>
                                </div>
                              ) : contestConfig.votingType === "criteria" ? (
                                <button
                                  onClick={() => setExpandedContestant(isExpanded ? null : contestant.participantId)}
                                  className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                  {isExpanded ? 
                                    <ChevronUp className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400" /> : 
                                    <ChevronDown className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400" />
                                  }
                                </button>
                              ) : null}
                            </div>

                            {/* Simple voting */}
                            {!hasSubmitted && contestConfig.votingType !== "criteria" && (
                              <div className="grid grid-cols-10 gap-0.5 sm:gap-1 mt-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                  <button
                                    key={score}
                                    onClick={async () => {
                                      await contest.submitVote(contestant.participantId, score);
                                      setSubmittedVotes((prev) => new Set([...prev, contestant.participantId]));
                                    }}
                                    className="py-1.5 sm:py-2 text-[10px] sm:text-xs rounded bg-gray-800 hover:bg-purple-600 text-white transition-all hover:scale-105"
                                  >
                                    {score}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Collapsed state for criteria */}
                            {!hasSubmitted && contestConfig.votingType === "criteria" && !isExpanded && (
                              <button
                                onClick={() => setExpandedContestant(contestant.participantId)}
                                className="w-full mt-3 py-1.5 sm:py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 rounded-lg transition-colors text-xs sm:text-sm"
                              >
                                Click to Rate
                              </button>
                            )}
                          </div>

                          {/* Expanded Criteria Section */}
                          {contestConfig.votingType === "criteria" && isExpanded && !hasSubmitted && (
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 bg-gray-800/20 border-t border-gray-800">
                              <div className="pt-3 sm:pt-4 space-y-2 sm:space-y-3">
                                {votingCriteria.map((criterion) => (
                                  <div key={criterion.id}>
                                    <div className="flex justify-between mb-1.5 sm:mb-2">
                                      <span className="text-white text-xs sm:text-sm">{criterion.name}</span>
                                      <span className="text-gray-500 text-[10px] sm:text-xs">
                                        {Math.round(criterion.weight * 100)}% weight
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-10 gap-0.5 sm:gap-1">
                                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                        <button
                                          key={score}
                                          onClick={() => handleCriteriaScore(contestant.participantId, criterion.id, score)}
                                          className={`py-1 sm:py-1.5 text-[10px] sm:text-xs rounded transition-all ${
                                            scores[criterion.id] === score
                                              ? "bg-purple-600 text-white scale-105"
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
                                disabled={!votingCriteria.every((c) => scores[c.id] > 0)}
                                className={`w-full mt-3 sm:mt-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                                  votingCriteria.every((c) => scores[c.id] > 0)
                                    ? "bg-purple-600 text-white hover:bg-purple-700"
                                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                                }`}
                              >
                                Submit Vote
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Live Leaderboard Sidebar */}
                <div className="lg:col-span-1 mt-4 lg:mt-0">
                  <div className="bg-gray-900 rounded-lg p-3 sm:p-4 border border-gray-800 sticky top-4">
                    <h3 className="text-white font-medium text-sm sm:text-base mb-3 flex items-center gap-2">
                      <BarChart3 className="w-3 sm:w-4 h-3 sm:h-4 text-purple-400" />
                      Live Results
                    </h3>
                    {contest.leaderboard.length > 0 ? (
                      <div className="space-y-1.5 sm:space-y-2">
                        {contest.leaderboard.map((entry: any, index: number) => (
                          <div
                            key={entry.participantId}
                            className={`p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm ${
                              index === 0 ? "bg-yellow-900/10 border border-yellow-900/20" :
                              index === 1 ? "bg-gray-700/20 border border-gray-700/30" :
                              index === 2 ? "bg-orange-900/10 border border-orange-900/20" :
                              "bg-gray-800/30"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                {index === 0 && <Crown className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-yellow-500" />}
                                {index === 1 && <Medal className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-gray-400" />}
                                {index === 2 && <Award className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-orange-500" />}
                                {index > 2 && <span className="w-3 sm:w-3.5 text-center text-[10px] sm:text-xs text-gray-500">{index + 1}</span>}
                                <span className="text-white truncate max-w-[80px] sm:max-w-[100px]">{entry.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-white font-semibold text-xs sm:text-sm">{entry.score.toFixed(1)}</div>
                                <div className="text-gray-500 text-[9px] sm:text-[10px]">{entry.votes}v</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-xs sm:text-sm text-center py-4">No votes yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FINAL RESULTS - Clean design */}
      {showFinalResults && !votingPhase && contest.leaderboard.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto p-4">
          <div className="max-w-3xl w-full">
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
              <h2 className="text-3xl font-bold text-white text-center mb-8">Final Results</h2>
              
              <div className="space-y-3">
                {contest.leaderboard.map((entry: any, index: number) => (
                  <div
                    key={entry.participantId}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      index === 0 ? "bg-yellow-900/10 border border-yellow-600/30" :
                      index === 1 ? "bg-gray-700/10 border border-gray-600/30" :
                      index === 2 ? "bg-orange-900/10 border border-orange-600/30" :
                      "bg-gray-800/30"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {index === 0 && <Crown className="w-8 h-8 text-yellow-500" />}
                        {index === 1 && <Medal className="w-7 h-7 text-gray-400" />}
                        {index === 2 && <Award className="w-6 h-6 text-orange-500" />}
                        {index > 2 && <span className="text-gray-500 w-8 text-center font-bold">{index + 1}</span>}
                      </div>
                      <div>
                        <div className="text-white font-semibold text-lg">{entry.name}</div>
                        <div className="text-gray-400 text-sm">{entry.votes} votes received</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold text-2xl">{entry.score.toFixed(2)}</div>
                      <div className="text-gray-500 text-xs">out of 10.00</div>
                    </div>
                  </div>
                ))}
              </div>

              {contest.isHost && (
                <button
                  onClick={() => {
                    setShowFinalResults(false);
                    contest.endContest();
                  }}
                  className="w-full mt-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Close Contest
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
