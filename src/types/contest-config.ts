export type ContestMode = "showcase" | "elimination" | "tournament";
export type VotingPermissions = "all" | "judges" | "contestants";
export type ContestType = "simultaneous" | "turn-based";
export type VotingType = "simple" | "criteria";

// Voting mode for turn-based contests
export type VotingMode = 'realtime' | 'per-turn' | 'final-only' | 'both';

export interface VotingCriterion {
  id: string;
  name: string;
  weight: number;
  description: string;
}

interface BaseContestConfig {
  mode: ContestMode;
  name: string;
  features: {
    voting: boolean;
    elimination: boolean;
    leaderboard: boolean;
    timer: boolean;
  };
  rules: {
    minContestants: number;
    votingPermissions: VotingPermissions;
    votingDuration: number;
    selfVoting: boolean;
  };
  scoring: {
    type: "average" | "sum";
    scoreRange: { min: number; max: number };
  };
  votingType: VotingType;
  votingCriteria?: VotingCriterion[];
}

export interface SimultaneousContestConfig extends BaseContestConfig {
  type: "simultaneous";
  rules: BaseContestConfig["rules"] & {
    maxDuration: number;
    roundsCount: number;
  };
  scoring: BaseContestConfig["scoring"] & {
    aggregation?: {
      rounds: string;
      categories: string;
    };
  };
}

export interface TurnBasedContestConfig extends BaseContestConfig {
  type: "turn-based";
  plugin: {
    turnDuration: number;
    autoAdvance: boolean;
    
    // Voting mode configuration
    votingMode?: VotingMode;
    
    // Duration for per-turn voting (only used if votingMode is 'per-turn' or 'both')
    turnVotingDuration?: number;
    
    // Optional custom turn order
    customTurnOrder?: string[];
  };
}

export type ContestConfig = SimultaneousContestConfig | TurnBasedContestConfig;