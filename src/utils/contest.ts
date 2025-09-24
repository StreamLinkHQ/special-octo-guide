import type { ContestConfig, SimultaneousContestConfig, TurnBasedContestConfig } from "../types";

export const isSimultaneousConfig = (
  config: ContestConfig
): config is SimultaneousContestConfig => {
  return config.type === "simultaneous";
};

export const isTurnBasedConfig = (
  config: ContestConfig
): config is TurnBasedContestConfig => {
  return config.type === "turn-based";
};
