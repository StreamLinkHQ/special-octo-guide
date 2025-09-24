import React, {
  createContext,
  useState,
  type ReactNode,
  useEffect,
} from "react";
import { useStreamContext, useRequirePublicKey } from "@vidbloq/react";
import type { VotingCriterion, ContestConfig, ContestType, VotingPermissions, ContestMode, VotingType } from "../types";


// Default placeholder criteria
const DEFAULT_CRITERIA: VotingCriterion[] = [
  {
    id: "criterion_1",
    name: "Criterion 1",
    weight: 0.5,
    description: "Edit this criterion",
  },
  {
    id: "criterion_2",
    name: "Criterion 2",
    weight: 0.5,
    description: "Edit this criterion",
  },
];

// Context Definition
interface ContestConfigContextType {
  config: ContestConfig;
  updateConfig: (updater: (prev: ContestConfig) => ContestConfig) => void;
  contestType: ContestType;
  setContestType: (type: ContestType) => void;
  isPanelOpen: boolean;
  setPanelOpen: (open: boolean) => void;
  contestReady: boolean; // Add this
  setContestReady: (ready: boolean) => void; // Add this
}

export const ContestConfigContext = createContext<
  ContestConfigContextType | undefined
>(undefined);


// Context Provider
export const ContestConfigProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [contestType, setContestType] = useState<ContestType>("simultaneous");
  const [isPanelOpen, setPanelOpen] = useState(false);
  const [contestReady, setContestReady] = useState(false); // Add this

  const { websocket, streamMetadata, roomName } = useStreamContext();
  const { publicKey } = useRequirePublicKey();

  // Determine if user is host
  const isHost = publicKey?.toString() === streamMetadata?.creatorWallet;

  const getDefaultConfig = (type: ContestType): ContestConfig => {
    const baseConfig = {
      mode: (type === "simultaneous"
        ? "elimination"
        : "showcase") as ContestMode,
      name: "Community Contest",
      features: {
        voting: true,
        elimination: type === "simultaneous",
        leaderboard: true,
        timer: type === "simultaneous",
      },
      rules: {
        minContestants: 2,
        votingPermissions: "all" as VotingPermissions,
        votingDuration: 60,
        selfVoting: false,
      },
      scoring: {
        type: "average" as const,
        scoreRange: { min: 1, max: 10 },
      },
      votingType: "simple" as VotingType,
      votingCriteria: [...DEFAULT_CRITERIA],
    };

    if (type === "turn-based") {
      return {
        ...baseConfig,
        type: "turn-based",
        plugin: {
          turnDuration: 120, // Default to 120s instead of 30s
          autoAdvance: false, // Default to manual control
        },
      };
    }

    return {
      ...baseConfig,
      type: "simultaneous",
      rules: {
        ...baseConfig.rules,
        maxDuration: 180,
        roundsCount: 3,
      },
      scoring: {
        ...baseConfig.scoring,
        aggregation: {
          rounds: "latest",
          categories: "average",
        },
      },
    };
  };

  const [config, setConfig] = useState<ContestConfig>(
    getDefaultConfig(contestType)
  );

  // Listen for config updates from host
  useEffect(() => {
    if (!websocket) return;

    const handleConfigUpdate = (data: {
      config: ContestConfig;
      contestType: ContestType;
      contestReady?: boolean;
    }) => {
      console.log("Received config update:", data);
      if (!isHost) {
        // Non-hosts should accept config updates from host
        setContestType(data.contestType);
        setConfig(data.config);
        // Also update contestReady if included in the broadcast
        if (data.contestReady !== undefined) {
          setContestReady(data.contestReady);
        }
      }
    };

    websocket.addEventListener("contestConfigUpdate", handleConfigUpdate);

    return () => {
      websocket.removeEventListener("contestConfigUpdate", handleConfigUpdate);
    };
  }, [websocket, isHost]);

  const broadcastConfig = (
    newConfig: ContestConfig,
    newType: ContestType,
    ready?: boolean
  ) => {
    if (websocket && isHost && roomName) {
      // Only host can broadcast config changes
      websocket.sendMessage("updateContestConfig", {
        config: newConfig,
        contestType: newType,
        contestReady: ready !== undefined ? ready : contestReady, // Include current ready state
        roomName: roomName,
      });
    }
  };

  const handleSetContestType = (type: ContestType) => {
    const newConfig = getDefaultConfig(type);
    setContestType(type);
    setConfig(newConfig);

    // Broadcast to all participants
    // broadcastConfig(newConfig, type);
    broadcastConfig(newConfig, type, contestReady);
  };

  const updateConfig = (updater: (prev: ContestConfig) => ContestConfig) => {
    setConfig((prev) => {
      const newConfig = updater(prev);

      // Broadcast config changes to all participants if host
      if (isHost) {
        // broadcastConfig(newConfig, contestType);
        broadcastConfig(newConfig, contestType, contestReady);
      }

      return newConfig;
    });
  };

  const handleSetContestReady = (ready: boolean) => {
    setContestReady(ready);

    // If host, broadcast the ready state to all participants
    if (isHost) {
      broadcastConfig(config, contestType, ready);
    }
  };

  return (
    <ContestConfigContext.Provider
      value={{
        config,
        updateConfig,
        contestType,
        setContestType: handleSetContestType,
        isPanelOpen,
        setPanelOpen,
        contestReady, // Add this
        setContestReady: handleSetContestReady,
      }}
    >
      {children}
    </ContestConfigContext.Provider>
  );
};
