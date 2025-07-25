import React from "react";
import { FaVoteYea, FaBrain, FaQuestionCircle, FaBell } from "react-icons/fa";
import { useStream } from "../../hooks";

interface AddonIndicatorProps {
  onOpenModal: () => void;
}

const AddonIndicator: React.FC<AddonIndicatorProps> = ({ onOpenModal }) => {
  const { shouldShowParticipationTab, participationTabLabel, activeAddonType } =
    useStream();

  // Don't show indicator if no addon is active
  if (!shouldShowParticipationTab) {
    return null;
  }

  // Choose appropriate icon and color
  let icon = <FaQuestionCircle className="w-5 h-5" />;
  let bgColor = "bg-blue-500";
  const pulseColor = "animate-pulse";

  if (activeAddonType === "Poll") {
    icon = <FaVoteYea className="w-5 h-5" />;
    bgColor = "bg-green-500";
  } else if (activeAddonType === "Quiz") {
    icon = <FaBrain className="w-5 h-5" />;
    bgColor = "bg-purple-500";
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={onOpenModal}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-lg text-white shadow-lg 
          hover:shadow-xl transition-all duration-200 transform hover:scale-105
          ${bgColor} ${pulseColor}
        `}
      >
        {/* Notification bell with pulse */}
        <div className="relative">
          <FaBell className="w-4 h-4" />
          <div
            className={`absolute -top-1 -right-1 w-3 h-3 ${bgColor} rounded-full animate-ping`}
          ></div>
          <div
            className={`absolute -top-1 -right-1 w-3 h-3 ${bgColor} rounded-full`}
          ></div>
        </div>

        {/* Addon icon */}
        {icon}

        {/* Label */}
        <span className="font-medium">{participationTabLabel}</span>

        {/* Arrow */}
        <div className="text-sm">→</div>
      </button>
    </div>
  );
};

export default AddonIndicator;
