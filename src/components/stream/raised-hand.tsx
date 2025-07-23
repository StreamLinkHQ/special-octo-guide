// import { RaisedHand } from "../types"; might import from vidbloq
import { Icon } from "../icons";

export interface RaisedHand {
  participantId: string;
  name: string;
  walletAddress: string;
  timestamp: number;
  userType: "host" | "co-host";
}

interface RaisedHandCardProps {
  raisedHand: RaisedHand;
}

const RaisedHandCard = ({ raisedHand }: RaisedHandCardProps) => {
  console.log({ raisedHand });
  const { participantId, name, userType, timestamp } = raisedHand;

  // Calculate time elapsed since hand was raised
  const getTimeElapsed = () => {
    const elapsed = Date.now() - timestamp;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes > 0) {
      return `${minutes}m ago`;
    }
    return `${seconds}s ago`;
  };

  return (
    <div className="bg-[var(--sdk-bg-primary-color)] rounded-lg shadow-lg p-4 mb-2 w-60">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-md font-semibold text-text-secondary">
            {name || participantId}
          </h3>
          <p className="text-xs text-text-secondary">
            {userType === "host" ? "Host" : "Co-host"} • {getTimeElapsed()}
          </p>
        </div>
        <div className="ml-2">
          <Icon name="hand" className="text-primary animate-pulse" size={20} />
        </div>
      </div>

      <p className="text-xs text-text-secondary mt-2 mb-3">
        Has raised their hand
      </p>
    </div>
  );
};

export default RaisedHandCard;
