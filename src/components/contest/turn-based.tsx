/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  useParticipantList,
  type ParticipantId,
  useTurnBasedContest,
} from "@vidbloq/react";
import { useContestConfig } from "../../hooks";
import { isTurnBasedConfig } from "../../utils";
import { VotingInterface } from "./voting";
import {
  Users,
  Clock,
  Trophy,
  X,
  Mic,
  Play,
  Crown,
  Medal,
  Award,
  User,
  ThumbsUp,
} from "lucide-react";

export function TurnBased() {
  const { participants } = useParticipantList();
  const { config: contextConfig } = useContestConfig();

  // UI State
  const [showSelection, setShowSelection] = useState(false);
  const [selectedContestants, setSelectedContestants] = useState<Set<string>>(
    new Set()
  );
  const [showJudgeManagement, setShowJudgeManagement] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showRealtimeVoting, setShowRealtimeVoting] = useState(false);
  
  // NEW: Persistent leaderboard state
  const [showPersistentLeaderboard, setShowPersistentLeaderboard] = useState(true);

  // Criteria scores for realtime voting
  const [realtimeCriteriaScores, setRealtimeCriteriaScores] = useState<
    Record<string, number>
  >({});

  const getTurnBasedConfig = () => {
    if (!isTurnBasedConfig(contextConfig)) {
      return {
        mode: contextConfig.mode,
        name: contextConfig.name,
        turnDuration: 120,
        autoAdvance: false,
        votingMode: "final-only" as const,
        features: contextConfig.features,
        rules: contextConfig.rules,
        scoring: contextConfig.scoring as any,
      };
    }

    const votingMode = (contextConfig.plugin as any).votingMode || "final-only";
    const turnVotingDuration = contextConfig.rules.votingDuration;
    const finalVotingDuration =
      votingMode === "both"
        ? (contextConfig.plugin as any).turnVotingDuration || 60
        : contextConfig.rules.votingDuration;

    return {
      mode: contextConfig.mode,
      name: contextConfig.name,
      turnDuration: contextConfig.plugin.turnDuration,
      autoAdvance: contextConfig.plugin.autoAdvance,
      votingMode: votingMode as any,
      turnVotingDuration: turnVotingDuration,
      features: contextConfig.features,
      rules: {
        ...contextConfig.rules,
        votingDuration: finalVotingDuration,
      },
      scoring: contextConfig.scoring as any,
    };
  };

  const {
    contest,
    turnState,
    votingState,
    realtimeVotingState,
    contestStarted,
    showFinalResults,
    startFirstTurn,
    endCurrentTurn,
    startNextTurn,
    startVotingPhase,
    startTurnVoting,
    closeFinalVoting,
    submitVote,
    submitRealtimeVote,
    hasRealtimeVotedFor,
    canStartFirstTurn,
    canEndTurn,
    canStartVoting,
    canStartTurnVoting,
    canUserVote,
    resumeTurn,
    pauseTurn,
    restartTurn,
  } = useTurnBasedContest(getTurnBasedConfig());

  const getVotingCriteria = () => {
    if (
      contextConfig.votingType === "criteria" &&
      contextConfig.votingCriteria
    ) {
      return contextConfig.votingCriteria;
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
  const isCriteriaVoting = contextConfig.votingType === "criteria";

  const startContest = async () => {
    if (selectedContestants.size < 2) {
      return;
    }

    const selected = participants.filter((p) => selectedContestants.has(p.id));
    await contest.startContest(selected);
    setShowSelection(false);
  };

  // Handle criteria score for realtime voting
  const handleRealtimeCriteriaScore = (criterionId: string, score: number) => {
    setRealtimeCriteriaScores((prev) => ({
      ...prev,
      [criterionId]: score,
    }));
  };

  // Submit realtime votes (simple or criteria)
  const submitRealtimeVotes = async () => {
    if (!turnState.currentPerformerId) return;

    if (isCriteriaVoting) {
      // Submit all criteria votes
      const allScored = votingCriteria.every(
        (c) => realtimeCriteriaScores[c.id] && realtimeCriteriaScores[c.id] > 0
      );
      if (!allScored) return;

      for (const criterion of votingCriteria) {
        if (realtimeCriteriaScores[criterion.id]) {
          await submitRealtimeVote(
            turnState.currentPerformerId,
            realtimeCriteriaScores[criterion.id],
            criterion.id
          );
        }
      }
      setRealtimeCriteriaScores({});
    }

    setShowRealtimeVoting(false);
  };

  // Simple realtime vote (non-criteria)
  const handleSimpleRealtimeVote = async (score: number) => {
    if (!turnState.currentPerformerId) return;
    await submitRealtimeVote(turnState.currentPerformerId, score);
    setShowRealtimeVoting(false);
  };

// NEW: Persistent Leaderboard Component
const PersistentLeaderboard = () => {
  if (!showPersistentLeaderboard || !contestStarted) {
    return null;
  }

  if (contest.leaderboard.length === 0) {
    return (
      <div className="fixed right-4 top-32 w-72 pointer-events-auto z-20">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-800 shadow-xl">
          <div className="p-3 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-purple-400" />
                Live Standings
              </h3>
              <button
                onClick={() => setShowPersistentLeaderboard(false)}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>
          <div className="p-4 text-center">
            <p className="text-gray-400 text-sm">No contestants yet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-4 top-32 w-72 pointer-events-auto z-20">
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-800 shadow-xl">
        <div className="p-3 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-white text-sm font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-400" />
              Live Standings
            </h3>
            <button
              onClick={() => setShowPersistentLeaderboard(false)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>
        <div className="p-3 space-y-2 max-h-96 overflow-y-auto">
          {contest.leaderboard.map((entry: any, index: number) => {
            // FIXED: Check if they have ANY votes at all (from any voting mode)
            // Get the actual vote data for this contestant
            const contestantVotes = contest.votes.get(entry.participantId) || [];
            const hasActualVotes = contestantVotes.length > 0;
            const hasPerformed = hasActualVotes || entry.score > 0;
            
            return (
              <div
                key={entry.participantId}
                className={`flex items-center justify-between p-2.5 rounded-lg transition-all ${
                  !hasPerformed ? "opacity-50" : ""
                } ${
                  index === 0 && hasPerformed ? "bg-yellow-900/10 border border-yellow-600/20" :
                  index === 1 && hasPerformed ? "bg-gray-700/10 border border-gray-600/20" :
                  index === 2 && hasPerformed ? "bg-orange-900/10 border border-orange-600/20" :
                  "bg-gray-800/30"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {index === 0 && hasPerformed && <Crown className="w-4 h-4 text-yellow-500" />}
                  {index === 1 && hasPerformed && <Medal className="w-4 h-4 text-gray-400" />}
                  {index === 2 && hasPerformed && <Award className="w-4 h-4 text-orange-500" />}
                  {(index > 2 || !hasPerformed) && (
                    <span className="w-4 text-center text-xs text-gray-500">{index + 1}</span>
                  )}
                  <span className="text-white text-sm truncate max-w-[140px]">
                    {entry.name}
                  </span>
                  {!hasPerformed && (
                    <span className="text-[9px] text-gray-500 ml-1">(pending)</span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold text-sm">
                    {entry.score.toFixed(1)}
                  </div>
                  <div className="text-gray-500 text-[10px]">
                    {entry.votes}v
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

  // Selection UI
  if (showSelection && contest.isHost) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-xl max-w-md w-full border border-gray-800">
          <div className="p-6">
            <h2 className="text-white text-xl font-semibold mb-4">
              Select Contest Participants
            </h2>
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
                    <span className="text-white text-sm">
                      {p.userName || p.id}
                    </span>
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

  // Judge Management Panel
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
          {participants.map((participant) => {
            const isParticipantJudge = contest.judges.includes(
              participant.id as ParticipantId
            );
            return (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isParticipantJudge ? "bg-purple-400" : "bg-gray-600"
                    }`}
                  />
                  <span className="text-white text-sm">
                    {participant.userName || participant.id}
                  </span>
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
                      ? "bg-gray-700 text-gray-300 hover:bg-red-600/20 hover:text-red-400"
                      : "bg-purple-600/20 text-purple-400 hover:bg-purple-600/30"
                  }`}
                >
                  {isParticipantJudge ? "Remove" : "Add as Judge"}
                </button>
              </div>
            );
          })}
        </div>
        {contextConfig.rules.votingPermissions === "judges" &&
          contest.judges.length === 0 && (
            <div className="p-4 bg-yellow-900/10 border-t border-yellow-900/20">
              <p className="text-xs text-yellow-600">
                ⚠️ No judges assigned. Add judges to enable voting in judge-only
                mode.
              </p>
            </div>
          )}
      </div>
    );
  };

  // Real-time Voting Panel with Criteria Support
  const RealtimeVotingPanel = () => {
    if (!showRealtimeVoting || !turnState.currentPerformerId) return null;

    const currentPerformer = contest.getContestant(
      turnState.currentPerformerId
    );
    const hasVoted = hasRealtimeVotedFor(turnState.currentPerformerId);
    const canVote = canUserVote();

    return (
      <div className="fixed inset-0 z-[160] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
        <div className="bg-gray-900 rounded-xl max-w-md w-full border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <div className="flex justify-between items-center">
              <h3 className="text-white font-semibold">Vote Now</h3>
              <button
                onClick={() => setShowRealtimeVoting(false)}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Rating {currentPerformer?.name || "performer"}
            </p>
          </div>

          {!canVote ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-sm">
                {contextConfig.rules.votingPermissions === "judges"
                  ? "Only judges can vote"
                  : "You don't have permission to vote"}
              </p>
            </div>
          ) : hasVoted ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ThumbsUp className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-white font-medium mb-2">Vote Submitted!</p>
              <p className="text-gray-400 text-sm">
                Your real-time vote has been recorded
              </p>
            </div>
          ) : isCriteriaVoting ? (
            // Criteria-based voting
            <div className="p-4">
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {votingCriteria.map((criterion) => (
                  <div key={criterion.id}>
                    <div className="flex justify-between mb-2">
                      <span className="text-white text-sm">
                        {criterion.name}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {Math.round(criterion.weight * 100)}% weight
                      </span>
                    </div>
                    <div className="grid grid-cols-10 gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          onClick={() =>
                            handleRealtimeCriteriaScore(criterion.id, score)
                          }
                          className={`py-2 text-xs rounded transition-all ${
                            realtimeCriteriaScores[criterion.id] === score
                              ? "bg-purple-600 text-white scale-105"
                              : "bg-gray-800 hover:bg-gray-700 text-gray-300"
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
                onClick={submitRealtimeVotes}
                disabled={
                  !votingCriteria.every((c) => realtimeCriteriaScores[c.id] > 0)
                }
                className={`w-full py-2 rounded-lg font-medium text-sm transition-colors ${
                  votingCriteria.every((c) => realtimeCriteriaScores[c.id] > 0)
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                Submit Vote
              </button>
            </div>
          ) : (
            // Simple voting
            <div className="p-4">
              <div className="grid grid-cols-10 gap-1.5 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    onClick={() => handleSimpleRealtimeVote(score)}
                    className="py-3 text-sm rounded bg-gray-800 hover:bg-purple-600 text-white hover:scale-105 transition-all font-medium"
                  >
                    {score}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center">
                Rate from 1 (lowest) to 10 (highest)
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main UI
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* NEW: Persistent Leaderboard */}
      <PersistentLeaderboard />

      {/* NEW: Toggle button to show leaderboard if hidden */}
      {!showPersistentLeaderboard && contestStarted && contest.leaderboard.length > 0 && (
        <button
          onClick={() => setShowPersistentLeaderboard(true)}
          className="fixed right-4 top-32 pointer-events-auto bg-gray-900/95 backdrop-blur-sm p-2.5 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors z-20"
          title="Show Leaderboard"
        >
          <Trophy className="w-4 h-4 text-purple-400" />
        </button>
      )}

      {/* Host Controls */}
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

              {canStartFirstTurn && (
                <button
                  onClick={startFirstTurn}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2"
                >
                  <Play className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="hidden sm:!inline">Start First Turn</span>
                  <span className="sm:!hidden">Start</span>
                </button>
              )}

              {canEndTurn && (
                <>
                  <button
                    onClick={() => endCurrentTurn()}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm rounded-lg transition-colors"
                  >
                    End Turn
                  </button>
                  {/* FIXED: Only show if queue has items */}
                  {!getTurnBasedConfig().autoAdvance &&
                    getTurnBasedConfig().votingMode !== "per-turn" &&
                    turnState.performanceQueue.length > 0 && (
                      <button
                        onClick={startNextTurn}
                        className="px-3 sm:!px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:!text-sm rounded-lg transition-colors"
                      >
                        Next Turn
                      </button>
                    )}
                </>
              )}

              {canStartTurnVoting && (
                <button
                  onClick={() =>
                    turnState.completedPerformers.length > 0 &&
                    startTurnVoting(
                      turnState.completedPerformers[
                        turnState.completedPerformers.length - 1
                      ]
                    )
                  }
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm rounded-lg transition-colors"
                >
                  Start Turn Voting
                </button>
              )}

              {canStartVoting && (
                <button
                  onClick={startVotingPhase}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm rounded-lg transition-colors"
                >
                  Start Final Voting
                </button>
              )}

              {votingState.isActive && (
                <button
                  onClick={closeFinalVoting}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm rounded-lg transition-colors"
                >
                  End Voting
                </button>
              )}

              {contextConfig.rules.votingPermissions === "judges" &&
                contestStarted && (
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
                  onClick={() => contest.endContest(true)} // FIXED: Force end with true parameter
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

      {/* Real-time Voting Panel */}
      <RealtimeVotingPanel />

      {/* Current Performance Display */}
       {/* {turnState.currentPerformerId && !votingState.isActive && (
        <div className="fixed top-16 sm:top-20 left-1/2 transform -translate-x-1/2 pointer-events-auto z-20 w-[90vw] sm:w-auto">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg px-3 sm:px-5 py-2 sm:py-2.5 border border-gray-800">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400 uppercase tracking-wider hidden sm:inline">
                  Live
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-white">
                <Mic className="w-3 sm:w-4 h-3 sm:h-4 text-purple-400" />
                <span className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                  {(() => {
                    const contestant = contest.getContestant(
                      turnState.currentPerformerId
                    );
                    const participant = participants.find(
                      (p) => p.id === turnState.currentPerformerId
                    );
                    return (
                      contestant?.name || participant?.userName || "Performer"
                    );
                  })()}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 text-white">
                <Clock className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400" />
                <span className="font-mono text-xs sm:text-sm font-semibold">
                  {Math.floor(turnState.timeRemaining / 60)}:
                  {(turnState.timeRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>

              {realtimeVotingState.canVoteNow &&
                !hasRealtimeVotedFor(turnState.currentPerformerId) && (
                  <button
                    onClick={() => setShowRealtimeVoting(true)}
                    className="ml-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span className="hidden sm:inline">Vote Now</span>
                  </button>
                )}

              {realtimeVotingState.enabled &&
                hasRealtimeVotedFor(turnState.currentPerformerId) && (
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-400 font-medium">
                    ✓ Voted
                  </span>
                )}
            </div>
          </div>
        </div>
      )}  */}
{/* Current Performance Display with Timer Controls */}
{turnState.currentPerformerId && !votingState.isActive && (
  <div className="fixed top-16 sm:top-20 left-1/2 transform -translate-x-1/2 pointer-events-auto z-20 w-[90vw] sm:w-auto">
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg px-3 sm:px-5 py-2 sm:py-2.5 border border-gray-800">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={`w-2 h-2 rounded-full ${turnState.isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="text-xs text-gray-400 uppercase tracking-wider hidden sm:inline">
            {turnState.isPaused ? 'Paused' : 'Live'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-white">
          <Mic className="w-3 sm:w-4 h-3 sm:h-4 text-purple-400" />
          <span className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
            {(() => {
              const contestant = contest.getContestant(
                turnState.currentPerformerId
              );
              const participant = participants.find(
                (p) => p.id === turnState.currentPerformerId
              );
              return (
                contestant?.name || participant?.userName || "Performer"
              );
            })()}
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 text-white">
          <Clock className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400" />
          <span className={`font-mono text-xs sm:text-sm font-semibold ${turnState.isPaused ? 'text-yellow-400' : ''}`}>
            {Math.floor(turnState.timeRemaining / 60)}:
            {(turnState.timeRemaining % 60).toString().padStart(2, "0")}
          </span>
        </div>

        {/* Timer Controls for Host */}
        {contest.isHost && (
          <div className="flex items-center gap-1 ml-2">
            {!turnState.isPaused ? (
              <button
                onClick={pauseTurn}
                className="p-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded transition-colors"
                title="Pause Timer"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/>
                </svg>
              </button>
            ) : (
              <button
                onClick={resumeTurn}
                className="p-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded transition-colors"
                title="Resume Timer"
              >
                <Play className="w-3 h-3" />
              </button>
            )}
            
            <button
              onClick={restartTurn}
              className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition-colors"
              title="Restart Timer"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
              </svg>
            </button>
          </div>
        )}

        {/* Real-time Vote Button */}
        {realtimeVotingState.canVoteNow &&
          !hasRealtimeVotedFor(turnState.currentPerformerId) && (
            <button
              onClick={() => setShowRealtimeVoting(true)}
              className="ml-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1.5"
            >
              <ThumbsUp className="w-3 h-3" />
              <span className="hidden sm:inline">Vote Now</span>
            </button>
          )}

        {realtimeVotingState.enabled &&
          hasRealtimeVotedFor(turnState.currentPerformerId) && (
            <span className="ml-2 text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-400 font-medium">
              ✓ Voted
            </span>
          )}
      </div>
    </div>
  </div>
)}
      {/* Toggle Buttons for Queue */}
      {turnState.performanceQueue.length > 0 && !votingState.isActive && (
        <button
          onClick={() => setShowQueue(!showQueue)}
          className="fixed left-4 top-32 pointer-events-auto bg-gray-900/95 backdrop-blur-sm p-2.5 rounded-lg border border-gray-800 hover:bg-gray-800 transition-colors z-20"
          title="Performance Queue"
        >
          <Users className="w-4 h-4 text-purple-400" />
        </button>
      )}

      {/* Performance Queue Panel */}
      {showQueue &&
        turnState.performanceQueue.length > 0 &&
        !votingState.isActive && (
          <div className="fixed left-4 top-44 w-64 pointer-events-auto z-30">
            <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-800 shadow-xl">
              <div className="p-3 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    Queue
                    <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-400">
                      {turnState.performanceQueue.length}
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
                {turnState.performanceQueue.slice(0, 5).map((id, idx) => {
                  const contestant = contest.getContestant(id);
                  const participant = participants.find((p) => p.id === id);
                  const displayName =
                    contestant?.name || participant?.userName || "Performer";
                  return (
                    <div
                      key={id}
                      className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                        idx === 0
                          ? "bg-purple-600/10 border border-purple-600/20"
                          : "bg-gray-800/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium ${
                            idx === 0 ? "text-purple-400" : "text-gray-500"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="text-white text-sm">
                          {displayName}
                        </span>
                      </div>
                      {idx === 0 && (
                        <span className="text-[10px] bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full">
                          NEXT
                        </span>
                      )}
                    </div>
                  );
                })}
                {turnState.performanceQueue.length > 5 && (
                  <div className="text-xs text-gray-500 text-center pt-1">
                    +{turnState.performanceQueue.length - 5} more
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* YOUR TURN overlay */}
      {/* {turnState.isMyTurn &&
        turnState.currentPerformerId &&
        !votingState.isActive && (
          <div className="fixed top-32 left-1/2 transform -translate-x-1/2 pointer-events-auto z-50">
            <div className="bg-purple-600 rounded-lg px-6 py-3 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-white">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="font-semibold text-sm uppercase tracking-wider">
                    Your Turn
                  </span>
                </div>
                <div className="text-white font-mono text-lg font-bold">
                  {Math.floor(turnState.timeRemaining / 60)}:
                  {(turnState.timeRemaining % 60).toString().padStart(2, "0")}
                </div>
                {contest.isHost && (
                  <button
                    onClick={() => endCurrentTurn()}
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded text-sm font-medium transition-colors"
                  >
                    End Turn
                  </button>
                )}
              </div>
            </div>
          </div>
        )} */}

{/* YOUR TURN overlay with pause status */}
{turnState.isMyTurn &&
  turnState.currentPerformerId &&
  !votingState.isActive && (
    <div className="fixed top-32 left-1/2 transform -translate-x-1/2 pointer-events-auto z-50">
      <div className={`rounded-lg px-6 py-3 shadow-xl ${turnState.isPaused ? 'bg-yellow-600' : 'bg-purple-600'}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <div className={`w-2 h-2 bg-white rounded-full ${!turnState.isPaused && 'animate-pulse'}`} />
            <span className="font-semibold text-sm uppercase tracking-wider">
              {turnState.isPaused ? 'Paused - Your Turn' : 'Your Turn'}
            </span>
          </div>
          <div className="text-white font-mono text-lg font-bold">
            {Math.floor(turnState.timeRemaining / 60)}:
            {(turnState.timeRemaining % 60).toString().padStart(2, "0")}
          </div>
          {contest.isHost && !turnState.isPaused && (
            <button
              onClick={() => endCurrentTurn()}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded text-sm font-medium transition-colors"
            >
              End Turn
            </button>
          )}
        </div>
      </div>
    </div>
  )}

      {/* VOTING PHASE UI */}
      <VotingInterface
        contestants={
          votingState.isTurnVoting && votingState.currentVotingTarget
            ? [contest.getContestant(votingState.currentVotingTarget)].filter(
                Boolean
              )
            : contest.contestants
        }
        leaderboard={contest.leaderboard}
        judges={contest.judges}
        votingState={votingState}
        votingType={contextConfig.votingType || "simple"}
        votingCriteria={votingCriteria}
        onSubmitVote={submitVote}
        onClose={contest.isHost ? closeFinalVoting : undefined}
        title={votingState.isTurnVoting ? "Turn Voting" : "Final Voting"}
        subtitle={
          votingState.isTurnVoting
            ? `Rate ${
                contest.getContestant(votingState.currentVotingTarget!)?.name ||
                "this performer"
              }'s performance`
            : contextConfig.votingType === "criteria"
            ? `Rate each performer on ${votingCriteria.length} criteria`
            : undefined
        }
      />

      {/* FINAL RESULTS */}
      {showFinalResults &&
        !votingState.isActive &&
        contest.leaderboard.length > 0 && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto p-4">
            <div className="max-w-3xl w-full">
              <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
                <h2 className="text-3xl font-bold text-white text-center mb-8">
                  Final Results
                </h2>

                <div className="space-y-3">
                  {contest.leaderboard.map((entry: any, index: number) => (
                    <div
                      key={entry.participantId}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        index === 0
                          ? "bg-yellow-900/10 border border-yellow-600/30"
                          : index === 1
                          ? "bg-gray-700/10 border border-gray-600/30"
                          : index === 2
                          ? "bg-orange-900/10 border border-orange-600/30"
                          : "bg-gray-800/30"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">
                          {index === 0 && (
                            <Crown className="w-8 h-8 text-yellow-500" />
                          )}
                          {index === 1 && (
                            <Medal className="w-7 h-7 text-gray-400" />
                          )}
                          {index === 2 && (
                            <Award className="w-6 h-6 text-orange-500" />
                          )}
                          {index > 2 && (
                            <span className="text-gray-500 w-8 text-center font-bold">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-white font-semibold text-lg">
                            {entry.name}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {entry.votes} votes received
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold text-2xl">
                          {entry.score.toFixed(2)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          out of 10.00
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {contest.isHost && (
                  <button
                    onClick={() => contest.endContest(true)} // FIXED: Force end
                    className="w-full mt-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    End Contest
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}