import { useState, useEffect } from "react";
import {
  X,
  Users,
  Timer,
  Plus,
  Trash2,
} from "lucide-react";
import { FaTrophy } from "react-icons/fa6";
import { useContestConfig } from "../../hooks";

type VotingPermissions = "all" | "judges" | "contestants";

type VotingType = "simple" | "criteria";

interface VotingCriterion {
  id: string;
  name: string;
  weight: number;
  description: string;
}

// Config Panel Component
export const ContestConfigPanel: React.FC = () => {
  const {
    config,
    updateConfig,
    contestType,
    setContestType,
    isPanelOpen,
    setPanelOpen,
    setContestReady,
  } = useContestConfig();
  const [newCriterionName, setNewCriterionName] = useState("");
  const [localTurnDuration, setLocalTurnDuration] = useState(
    config.type === "turn-based" ? config.plugin.turnDuration : 120
  );
  const [durationUpdateTimer, setDurationUpdateTimer] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (config.type === "turn-based") {
      setLocalTurnDuration(config.plugin.turnDuration);
    }
  }, [config]);

  // Debounced update for turn duration
  const handleLocalTurnDurationChange = (value: number) => {
    setLocalTurnDuration(value);

    // Clear existing timer
    if (durationUpdateTimer) {
      clearTimeout(durationUpdateTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      handleTurnDurationChange(value);
    }, 500); // Wait 500ms after user stops typing

    setDurationUpdateTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (durationUpdateTimer) {
        clearTimeout(durationUpdateTimer);
      }
    };
  }, [durationUpdateTimer]);

  const handleVotingPermissionsChange = (permissions: VotingPermissions) => {
    updateConfig((prev) => {
      if (prev.type === "simultaneous") {
        return {
          ...prev,
          rules: {
            ...prev.rules,
            votingPermissions: permissions,
            maxDuration: prev.rules.maxDuration,
            roundsCount: prev.rules.roundsCount,
          },
        };
      } else {
        return {
          ...prev,
          rules: {
            ...prev.rules,
            votingPermissions: permissions,
          },
        };
      }
    });
  };

  const handleApplySettings = () => {
    setContestReady(true); // Mark contest as ready
    setPanelOpen(false); // Close the panel
  };

  const handleNameChange = (name: string) => {
    updateConfig((prev) => ({
      ...prev,
      name,
    }));
  };

  const handleTimerDurationChange = (duration: number) => {
    updateConfig((prev) => {
      if (prev.type === "simultaneous") {
        return {
          ...prev,
          rules: {
            ...prev.rules,
            maxDuration: duration,
          },
        };
      }
      return prev;
    });
  };

  const handleRoundsCountChange = (rounds: number) => {
    updateConfig((prev) => {
      if (prev.type === "simultaneous") {
        return {
          ...prev,
          rules: {
            ...prev.rules,
            roundsCount: rounds,
          },
        };
      }
      return prev;
    });
  };

  const handleVotingDurationChange = (duration: number) => {
    updateConfig((prev) => {
      if (prev.type === "simultaneous") {
        return {
          ...prev,
          rules: {
            ...prev.rules,
            votingDuration: duration,
            maxDuration: prev.rules.maxDuration,
            roundsCount: prev.rules.roundsCount,
          },
        };
      } else {
        return {
          ...prev,
          rules: {
            ...prev.rules,
            votingDuration: duration,
          },
        };
      }
    });
  };

  const handleTurnDurationChange = (duration: number) => {
    updateConfig((prev) => {
      if (prev.type === "turn-based") {
        return {
          ...prev,
          plugin: {
            ...prev.plugin,
            turnDuration: duration,
          },
        };
      }
      return prev;
    });
  };

  const handleAutoAdvanceChange = (autoAdvance: boolean) => {
    updateConfig((prev) => {
      if (prev.type === "turn-based") {
        return {
          ...prev,
          plugin: {
            ...prev.plugin,
            autoAdvance,
          },
        };
      }
      return prev;
    });
  };

  const handleVotingTypeChange = (votingType: VotingType) => {
    updateConfig((prev) => ({
      ...prev,
      votingType,
    }));
  };

  const handleAddCriterion = () => {
    if (!newCriterionName.trim()) return;

    const newCriterion: VotingCriterion = {
      id: newCriterionName.toLowerCase().replace(/\s+/g, "_"),
      name: newCriterionName,
      weight: 0,
      description: "",
    };

    updateConfig((prev) => {
      const currentCriteria = prev.votingCriteria || [];
      const updatedCriteria = [...currentCriteria, newCriterion];
      // Recalculate weights to be equal
      const equalWeight = 1 / updatedCriteria.length;
      const normalizedCriteria = updatedCriteria.map((c) => ({
        ...c,
        weight: equalWeight,
      }));

      return {
        ...prev,
        votingCriteria: normalizedCriteria,
      };
    });

    setNewCriterionName("");
  };

  const handleRemoveCriterion = (id: string) => {
    updateConfig((prev) => {
      const currentCriteria = prev.votingCriteria || [];
      const updatedCriteria = currentCriteria.filter((c) => c.id !== id);
      // Recalculate weights to be equal
      if (updatedCriteria.length > 0) {
        const equalWeight = 1 / updatedCriteria.length;
        const normalizedCriteria = updatedCriteria.map((c) => ({
          ...c,
          weight: equalWeight,
        }));
        return {
          ...prev,
          votingCriteria: normalizedCriteria,
        };
      }
      return {
        ...prev,
        votingCriteria: updatedCriteria,
      };
    });
  };

  const handleCriterionNameChange = (id: string, name: string) => {
    updateConfig((prev) => {
      const currentCriteria = prev.votingCriteria || [];
      const updatedCriteria = currentCriteria.map((c) =>
        c.id === id
          ? { ...c, name, id: name.toLowerCase().replace(/\s+/g, "_") }
          : c
      );
      return {
        ...prev,
        votingCriteria: updatedCriteria,
      };
    });
  };

  const handleCriterionWeightChange = (id: string, weight: number) => {
    updateConfig((prev) => {
      const currentCriteria = prev.votingCriteria || [];
      const updatedCriteria = currentCriteria.map((c) =>
        c.id === id ? { ...c, weight } : c
      );
      // Normalize weights to sum to 1
      const totalWeight = updatedCriteria.reduce((sum, c) => sum + c.weight, 0);
      const normalizedCriteria = updatedCriteria.map((c) => ({
        ...c,
        weight: totalWeight > 0 ? c.weight / totalWeight : 0,
      }));

      return {
        ...prev,
        votingCriteria: normalizedCriteria,
      };
    });
  };

  if (!isPanelOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={() => setPanelOpen(false)}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[82%] md:!w-48 lg:!w-96 bg-white shadow-xl z-50 transform transition-transform duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Contest Settings</h2>
          <button
            onClick={() => setPanelOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-60px)]">
          {/* Contest Type Toggle */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Contest Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setContestType("simultaneous")}
                className={`p-2 text-sm rounded-lg border transition-all ${
                  contestType === "simultaneous"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Users className="h-4 w-4 mx-auto mb-1" />
                Simultaneous
              </button>
              <button
                onClick={() => setContestType("turn-based")}
                className={`p-2 text-sm rounded-lg border transition-all ${
                  contestType === "turn-based"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Timer className="h-4 w-4 mx-auto mb-1" />
                Turn-Based
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Mode:{" "}
              <span className="font-medium">
                {contestType === "simultaneous" ? "Elimination" : "Showcase"}
              </span>
            </div>
          </div>

          {/* General Settings */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              General
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-700 mb-1 block">
                  Contest Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-1 block">
                  Voting Permissions
                </label>
                <select
                  value={config.rules.votingPermissions}
                  onChange={(e) =>
                    handleVotingPermissionsChange(
                      e.target.value as VotingPermissions
                    )
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Everyone</option>
                  <option value="judges">Judges Only</option>
                  <option value="contestants">Contestants Only</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {config.rules.votingPermissions === "judges"
                    ? "Only designated judges can vote"
                    : config.rules.votingPermissions === "contestants"
                    ? "Only active contestants can vote"
                    : "All participants can vote"}
                </p>
              </div>
            </div>
          </div>

          {/* Timer Settings */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Timing
            </label>
            <div className="space-y-3">
              {config.type === "simultaneous" ? (
                <>
                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">
                      Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={config.rules.maxDuration}
                      onChange={(e) =>
                        handleTimerDurationChange(Number(e.target.value))
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="30"
                      max="600"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">
                      Rounds
                    </label>
                    <input
                      type="number"
                      value={config.rules.roundsCount}
                      onChange={(e) =>
                        handleRoundsCountChange(Number(e.target.value))
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="10"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm text-gray-700 mb-1 block">
                      Turn Duration (seconds)
                    </label>
                    <input
                      type="number"
                      value={localTurnDuration}
                      onChange={(e) =>
                        handleLocalTurnDurationChange(Number(e.target.value))
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="10"
                      max="300"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoAdvance"
                      checked={config.plugin.autoAdvance}
                      onChange={(e) =>
                        handleAutoAdvanceChange(e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="autoAdvance"
                      className="text-sm text-gray-700"
                    >
                      Auto-advance turns
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Voting Settings */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
              Voting
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-700 mb-1 block">
                  Voting Duration (seconds)
                </label>
                <input
                  type="number"
                  value={config.rules.votingDuration}
                  onChange={(e) =>
                    handleVotingDurationChange(Number(e.target.value))
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="15"
                  max="300"
                />
              </div>

              <div>
                <label className="text-sm text-gray-700 mb-1 block">
                  Voting Type
                </label>
                <select
                  value={config.votingType}
                  onChange={(e) =>
                    handleVotingTypeChange(e.target.value as VotingType)
                  }
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="simple">Simple (1-10 scale)</option>
                  <option value="criteria">Criteria-based</option>
                </select>
              </div>
            </div>
          </div>

          {/* Criteria Settings (only show if criteria voting is selected) */}
          {config.votingType === "criteria" && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">
                Voting Criteria
              </label>

              {/* Add new criterion */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newCriterionName}
                  onChange={(e) => setNewCriterionName(e.target.value)}
                  placeholder="New criterion name"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === "Enter" && handleAddCriterion()}
                />
                <button
                  onClick={handleAddCriterion}
                  disabled={!newCriterionName.trim()}
                  className="p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Criteria list */}
              <div className="space-y-2">
                {(config.votingCriteria || []).map((criterion) => (
                  <div key={criterion.id} className="bg-gray-50 p-2 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <input
                        type="text"
                        value={criterion.name}
                        onChange={(e) =>
                          handleCriterionNameChange(
                            criterion.id,
                            e.target.value
                          )
                        }
                        className="flex-1 px-2 py-0.5 text-sm font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                        placeholder="Criterion name"
                      />
                      <button
                        onClick={() => handleRemoveCriterion(criterion.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded ml-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Weight:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={criterion.weight * 100}
                        onChange={(e) =>
                          handleCriterionWeightChange(
                            criterion.id,
                            Number(e.target.value) / 100
                          )
                        }
                        className="flex-1 h-1"
                      />
                      <span className="text-xs text-gray-600 w-12 text-right">
                        {Math.round(criterion.weight * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {(!config.votingCriteria ||
                config.votingCriteria.length === 0) && (
                <div className="text-sm text-gray-500 text-center py-4">
                  No criteria added yet. Add your first criterion above.
                </div>
              )}
            </div>
          )}

          {/* Apply Button */}
          <button
            onClick={handleApplySettings}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </>
  );
};

// Trigger Button Component
export const ContestConfigTrigger: React.FC = () => {
  const { setPanelOpen } = useContestConfig();

  return (
    <button
      onClick={() => setPanelOpen(true)}
       className="inline-flex items-center gap-2 px-2.5 py-1 bg-white hover:bg-gray-200 rounded-lg absolute top-10 left-8"
    >
      <FaTrophy className="text-2xl lg:!text-3xl text-gray-800" />
    </button>
  );
};
