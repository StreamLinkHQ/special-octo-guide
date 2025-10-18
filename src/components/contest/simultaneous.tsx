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
import { VotingInterface } from "./voting";
import { Icon } from "../icons";
import { Trophy, Users, Clock, Crown, Medal, Award, X } from "lucide-react";

function Simultaneous() {
  const [showContestMode, setShowContestMode] = useState(false);
  const [selectedContestants, setSelectedContestants] = useState<Set<string>>(new Set());
  const [showQuickResults, setShowQuickResults] = useState(false);
  const [showJudgeManagement, setShowJudgeManagement] = useState(false);
  
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
      // Clear submitted votes for new voting phase
      setSubmittedVotesByRound(prev => {
        const newMap = new Map(prev);
        newMap.set(contest.currentRound, new Set());
        return newMap;
      });
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

  const handleVote = async (contestantId: string, score: number, criterionId?: string) => {
    try {
      await contest.submitVote(contestantId, score, criterionId);

      setSubmittedVotesByRound((prev) => {
        const newMap = new Map(prev);
        const roundVotes = newMap.get(contest.currentRound) || new Set();
        roundVotes.add(contestantId);
        newMap.set(contest.currentRound, roundVotes);
        return newMap;
      });
    } catch (error) {
      console.error("Failed to submit vote:", error);
    }
  };

  const currentRoundVotes = submittedVotesByRound.get(contest.currentRound) || new Set();

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

      {/* VOTING INTERFACE - Using the reusable component */}
      <VotingInterface
        contestants={contest.contestants.filter((c: any) => !c.isEliminated)}
        leaderboard={contest.leaderboard}
        judges={contest.judges}
        votingState={{
          isActive: contest.contestState === "voting",
          timeRemaining: contest.votingTimeRemaining,
          canVote: contest.canVote,
          hasVoted: (contestantId: string) => currentRoundVotes.has(contestantId),
          votingPermissions: contestConfig.rules.votingPermissions || 'all',
        }}
        votingType={contestConfig.votingType || 'simple'}
        votingCriteria={votingCriteria}
        onSubmitVote={handleVote}
        title="Vote"
        subtitle={contestConfig.votingType === "criteria" ? `Rate each contestant on all criteria` : undefined}
      />
    </>
  );
}

export default Simultaneous;