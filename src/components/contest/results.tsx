/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { ChevronDown, ChevronUp, Crown, Medal, Award } from "lucide-react";

interface FinalResultsProps {
  leaderboard: any[];
  isHost: boolean;
  onEndContest: () => void;
}

export function FinalResults({ leaderboard, isHost, onEndContest }: FinalResultsProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (leaderboard.length === 0) return null;

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-[150] pointer-events-auto">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl p-4 shadow-xl max-w-xs z-[80]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-white font-medium text-sm">Final Results</span>
            </div>
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              title="Expand results"
            >
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="space-y-1">
            {leaderboard.slice(0, 3).map((entry: any, index: number) => (
              <div key={entry.participantId} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  {index === 0 && <Crown className="w-3 h-3 text-yellow-500" />}
                  {index === 1 && <Medal className="w-3 h-3 text-gray-400" />}
                  {index === 2 && <Award className="w-3 h-3 text-orange-500" />}
                  <span className="text-white truncate max-w-[100px]">{entry.name}</span>
                </div>
                <span className="text-white font-semibold">{entry.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
          {isHost && (
            <button
              onClick={onEndContest}
              className="w-full mt-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              End Contest
            </button>
          )}
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto p-4 z-30">
      <div className="max-w-3xl w-full">
        <div className="bg-gray-900 rounded-xl p-6 sm:p-8 border border-gray-800">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Final Results
            </h2>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Minimize"
            >
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {leaderboard.map((entry: any, index: number) => (
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
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="text-2xl">
                    {index === 0 && (
                      <Crown className="w-7 sm:w-8 h-7 sm:h-8 text-yellow-500" />
                    )}
                    {index === 1 && (
                      <Medal className="w-6 sm:w-7 h-6 sm:h-7 text-gray-400" />
                    )}
                    {index === 2 && (
                      <Award className="w-5 sm:w-6 h-5 sm:h-6 text-orange-500" />
                    )}
                    {index > 2 && (
                      <span className="text-gray-500 w-7 sm:w-8 text-center font-bold text-lg sm:text-xl">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-base sm:text-lg">
                      {entry.name}
                    </div>
                    <div className="text-gray-400 text-xs sm:text-sm">
                      {entry.votes} votes received
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold text-xl sm:text-2xl">
                    {entry.score.toFixed(2)}
                  </div>
                  <div className="text-gray-500 text-xs">
                    out of 10.00
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isHost && (
            <button
              onClick={onEndContest}
              className="w-full mt-6 sm:mt-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              End Contest
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

      {/* {showFinalResults &&
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
        )} */}