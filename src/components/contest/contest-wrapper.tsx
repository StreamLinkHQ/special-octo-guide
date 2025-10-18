import { useContestConfig } from "../../hooks";
import IntegratedContestUI from "./simultaneous";
import { TurnBased } from "./turn-based";

const ContestWrapper = () => {
  const { contestType, contestReady } = useContestConfig();
  // console.log({ config, contestType });

    if (!contestReady) {
    return null;
  }
  
  return (
    <div>
      {contestType === "simultaneous" ? (
        <IntegratedContestUI />
      ) : (
        <TurnBased />
      )}
    </div>
  );
};

export default ContestWrapper;
