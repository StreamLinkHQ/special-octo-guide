/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useStreamContext } from "@vidbloq/react";
import { ChevronDown, ChevronUp, X, Clock, Trophy, Crown, Medal, Award, User, BarChart3, Eye } from "lucide-react";

interface VotingCriterion {
  id: string;
  name: string;
  weight: number;
  description?: string;
}

interface VotingState {
  isActive: boolean;
  timeRemaining: number;
  canVote: boolean;
  hasVoted: (contestantId: string) => boolean;
  votingPermissions: 'all' | 'judges' | 'contestants';
}

interface VotingInterfaceProps {
  contestants: any[];
  leaderboard: any[];
  judges: string[];
  votingState: VotingState;
  votingType: 'simple' | 'criteria';
  votingCriteria?: VotingCriterion[];
  onSubmitVote: (contestantId: string, score: number, criterionId?: string) => Promise<void>;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}

export function VotingInterface({
  contestants,
  leaderboard,
  judges,
  votingState,
  votingType,
  votingCriteria = [{
    id: 'overall',
    name: 'Overall Score',
    weight: 1,
    description: 'Rate the overall performance'
  }],
  onSubmitVote,
  onClose,
  title = "Voting Phase",
  subtitle,
}: VotingInterfaceProps) {
  const { identity } = useStreamContext();
  
  const { isActive, timeRemaining, canVote, hasVoted, votingPermissions } = votingState;
  
  const isJudge = identity ? judges.includes(identity) : false;
  
  const [criteriaScores, setCriteriaScores] = useState<Record<string, Record<string, number>>>({});
  const [expandedContestant, setExpandedContestant] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [submittingVotes, setSubmittingVotes] = useState<Set<string>>(new Set());
  
  // NEW: States for minimize/maximize
  const [isMinimized, setIsMinimized] = useState(false);
  const [spectatorView, setSpectatorView] = useState(true);

  if (!isActive) return null;

  const isJudgeOnlyMode = votingPermissions === "judges";
  const userCanVote = isJudgeOnlyMode ? isJudge : canVote;

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
      return;
    }

    setSubmittingVotes(prev => new Set([...prev, contestantId]));

    try {
      for (const criterion of votingCriteria) {
        if (scores[criterion.id]) {
          await onSubmitVote(contestantId, scores[criterion.id], criterion.id);
        }
      }
    } finally {
      setSubmittingVotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(contestantId);
        return newSet;
      });
      setCriteriaScores(prev => {
        const newScores = { ...prev };
        delete newScores[contestantId];
        return newScores;
      });
      setExpandedContestant(null);
    }
  };

  // Non-voter spectator view (minimized)
  if (!userCanVote && spectatorView) {
    return (
      <div className="fixed bottom-4 right-4 z-30 pointer-events-auto">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-800 p-4 shadow-xl max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <span className="text-white font-medium text-sm">Voting in Progress</span>
            </div>
            <button
              onClick={() => setSpectatorView(false)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              title="Expand view"
            >
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-white text-sm">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="font-mono font-semibold">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <p className="text-gray-400 text-xs mt-2">
            {isJudgeOnlyMode ? "Judges are voting" : "Watch results update live"}
          </p>
        </div>
      </div>
    );
  }

  // Non-voter expanded view
  if (!userCanVote && !spectatorView) {
    return (
      <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto p-4">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-white text-xl font-semibold mb-1">{title}</h2>
              <p className="text-gray-400 text-sm">
                {isJudgeOnlyMode 
                  ? "Only judges can vote in this contest" 
                  : "You are not eligible to vote"}
              </p>
            </div>
            <button
              onClick={() => setSpectatorView(true)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Minimize"
            >
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Live Leaderboard for spectators */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-400" />
              Live Results
            </h3>
            <div className="space-y-2">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry: any, idx: number) => (
                  <div
                    key={entry.participantId}
                    className={`p-2.5 rounded-lg ${
                      idx === 0 ? "bg-yellow-900/10 border border-yellow-900/20" :
                      idx === 1 ? "bg-gray-700/20 border border-gray-700/30" :
                      idx === 2 ? "bg-orange-900/10 border border-orange-900/20" :
                      "bg-gray-800/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {idx === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                        {idx === 1 && <Medal className="w-4 h-4 text-gray-400" />}
                        {idx === 2 && <Award className="w-4 h-4 text-orange-500" />}
                        {idx > 2 && <span className="w-4 text-center text-xs text-gray-500">{idx + 1}</span>}
                        <span className="text-white text-sm">{entry.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold text-sm">{entry.score.toFixed(1)}</div>
                        <div className="text-gray-500 text-xs">{entry.votes}v</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm text-center py-4">No votes yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NEW: Minimized view for voters
  if (isMinimized && userCanVote) {
    const remainingVotes = contestants.filter((c: any) => c.participantId !== identity && !hasVoted(c.participantId)).length;
    
    return (
      <div className="fixed bottom-4 right-4 z-30 pointer-events-auto">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-purple-500 p-4 shadow-xl max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-400" />
              <span className="text-white font-medium text-sm">{title}</span>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              title="Expand voting"
            >
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-white text-sm mb-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="font-mono font-semibold">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <p className="text-gray-400 text-xs">
            {remainingVotes > 0 ? `${remainingVotes} contestant${remainingVotes !== 1 ? 's' : ''} remaining` : 'All votes submitted!'}
          </p>
          {remainingVotes > 0 && (
            <button
              onClick={() => setIsMinimized(false)}
              className="w-full mt-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Continue Voting
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full voting interface for voters
  return (
    <div className={`fixed inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto overflow-y-auto p-2 sm:p-4`}>
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="bg-gray-900 rounded-xl p-3 sm:p-5 mb-3 sm:mb-4 border border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <h2 className="text-lg sm:text-2xl font-semibold text-white">{title}</h2>
              {isJudge && (
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full font-medium">
                  JUDGE
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-purple-400" />
                <span className="text-xl sm:text-2xl font-mono font-bold">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
                </span>
              </div>
              {/* NEW: Minimize button for voters */}
              {userCanVote && (
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Minimize"
                >
                  <ChevronDown className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Close voting"
                >
                  <X className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
                </button>
              )}
            </div>
          </div>
          {subtitle && (
            <p className="text-gray-400 text-xs sm:text-sm mt-2">{subtitle}</p>
          )}
          {votingType === "criteria" && !subtitle && (
            <p className="text-gray-400 text-xs sm:text-sm mt-2">
              Rate each performer on {votingCriteria.length} criteria
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Voting Cards */}
          <div className="lg:col-span-2 space-y-2 sm:space-y-3 max-h-[60vh] overflow-y-auto pr-0 sm:pr-2">
            {contestants
              .filter((c: any) => c.participantId !== identity)
              .map((contestant: any) => {
                const scores = criteriaScores[contestant.participantId] || {};
                const isExpanded = expandedContestant === contestant.participantId;
                const hasVotedForContestant = hasVoted(contestant.participantId);
                const isSubmitting = submittingVotes.has(contestant.participantId);

                return (
                  <div 
                    key={contestant.participantId} 
                    className={`bg-gray-900 rounded-lg border transition-all ${
                      hasVotedForContestant ? 'border-purple-500/50 bg-gray-900/50' : 'border-gray-800'
                    }`}
                  >
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 sm:w-10 h-8 sm:h-10 bg-purple-600/20 rounded-full flex items-center justify-center">
                            <User className="w-4 sm:w-5 h-4 sm:h-5 text-purple-400" />
                          </div>
                          <h3 className="text-white font-medium text-sm sm:text-base truncate">{contestant.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSubmitting && (
                            <span className="text-xs px-2 py-1 rounded bg-yellow-600/20 text-yellow-400 font-medium">
                              Submitting...
                            </span>
                          )}
                          {hasVotedForContestant && !isSubmitting && (
                            <span className="text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-400 font-medium">
                              ✓ Voted
                            </span>
                          )}
                          {votingType === "criteria" && !hasVotedForContestant && !isSubmitting && (
                            <button
                              onClick={() => setExpandedContestant(isExpanded ? null : contestant.participantId)}
                              className="p-1.5 sm:p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                              {isExpanded ? 
                                <ChevronUp className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400" /> : 
                                <ChevronDown className="w-3 sm:w-4 h-3 sm:h-4 text-gray-400" />
                              }
                            </button>
                          )}
                        </div>
                      </div>

                      {hasVotedForContestant ? (
                        <div className="mt-3 text-center py-2 text-purple-400 text-sm">
                          ✓ Vote Submitted
                        </div>
                      ) : (
                        <>
                          {votingType !== "criteria" && (
                            <div className="grid grid-cols-10 gap-0.5 sm:gap-1 mt-3">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                <button
                                  key={score}
                                  onClick={() => onSubmitVote(contestant.participantId, score)}
                                  disabled={isSubmitting}
                                  className={`py-1.5 sm:py-2 text-[10px] sm:text-xs rounded transition-all ${
                                    isSubmitting
                                      ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                                      : "bg-gray-800 hover:bg-purple-600 text-white hover:scale-105"
                                  }`}
                                >
                                  {score}
                                </button>
                              ))}
                            </div>
                          )}

                          {votingType === "criteria" && !isExpanded && (
                            <button
                              onClick={() => setExpandedContestant(contestant.participantId)}
                              disabled={isSubmitting}
                              className={`w-full mt-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                                isSubmitting
                                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                  : "bg-purple-600/10 hover:bg-purple-600/20 text-purple-400"
                              }`}
                            >
                              Click to Rate
                            </button>
                          )}
                        </>
                      )}
                    </div>

                    {votingType === "criteria" && isExpanded && !hasVotedForContestant && (
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
                                    disabled={isSubmitting}
                                    className={`py-1 sm:py-1.5 text-[10px] sm:text-xs rounded transition-all ${
                                      scores[criterion.id] === score
                                        ? "bg-purple-600 text-white scale-105"
                                        : isSubmitting
                                        ? "bg-gray-800 text-gray-600 cursor-not-allowed"
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
                          disabled={!votingCriteria.every((c) => scores[c.id] > 0) || isSubmitting}
                          className={`w-full mt-3 sm:mt-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                            votingCriteria.every((c) => scores[c.id] > 0) && !isSubmitting
                              ? "bg-purple-600 text-white hover:bg-purple-700"
                              : "bg-gray-700 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {isSubmitting ? "Submitting..." : "Submit Vote"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Leaderboard Toggle Button for Mobile */}
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="lg:hidden fixed bottom-4 right-4 z-40 bg-purple-600 hover:bg-purple-700 p-3 rounded-full shadow-lg transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-white" />
          </button>

          {/* Live Leaderboard */}
          <div className={`${showLeaderboard ? 'fixed inset-x-4 bottom-16 z-40' : 'hidden'} lg:block lg:relative lg:inset-auto lg:z-auto w-auto lg:w-80 mt-4 lg:mt-0`}>
            <div className="bg-gray-800/95 lg:bg-gray-800/50 rounded-lg p-3 sm:p-4 backdrop-blur-lg lg:backdrop-blur-none lg:sticky lg:top-0">
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
              <h3 className="hidden lg:flex text-white font-semibold mb-3 sm:mb-4 items-center gap-2 text-sm sm:text-base">
                <Trophy className="w-4 h-4 text-purple-400" />
                Live Results
              </h3>
              <div className="space-y-1.5 sm:space-y-2 max-h-60 lg:max-h-96 overflow-y-auto">
                {leaderboard.length > 0 ? (
                  leaderboard.map((entry: any, idx: number) => (
                    <div
                      key={entry.participantId}
                      className={`p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm ${
                        idx === 0 ? "bg-yellow-900/10 border border-yellow-900/20" :
                        idx === 1 ? "bg-gray-700/20 border border-gray-700/30" :
                        idx === 2 ? "bg-orange-900/10 border border-orange-900/20" :
                        "bg-gray-800/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {idx === 0 && <Crown className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-yellow-500" />}
                          {idx === 1 && <Medal className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-gray-400" />}
                          {idx === 2 && <Award className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-orange-500" />}
                          {idx > 2 && <span className="w-3 sm:w-3.5 text-center text-[10px] sm:text-xs text-gray-500">{idx + 1}</span>}
                          <span className="text-white truncate max-w-[80px] sm:max-w-[100px]">{entry.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold text-xs sm:text-sm">{entry.score.toFixed(1)}</div>
                          <div className="text-gray-500 text-[9px] sm:text-[10px]">{entry.votes}v</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-xs sm:text-sm text-center py-4">No votes yet</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}