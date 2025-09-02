import { Icon } from "../icons";

export interface RaisedHand {
  participantId: string;
  name: string;
  walletAddress: string;
  timestamp: number;
  userType: "host" | "co-host";
}

interface RaisedHandsToastProps {
  raisedHands: RaisedHand[];
  onViewAll: () => void;
}

export const RaisedHandsToast = ({ raisedHands, onViewAll }: RaisedHandsToastProps) => {
  if (!raisedHands?.length) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom duration-300 px-4 w-full max-w-sm sm:max-w-none sm:w-auto">
      <div className="bg-gray-900/98 backdrop-blur-xl rounded-2xl sm:rounded-full px-4 sm:px-5 py-3 flex items-center gap-3 sm:gap-4 shadow-2xl border border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <Icon name="hand" className="text-blue-400 animate-pulse flex-shrink-0" size={16} />
          <span className="text-sm text-white font-medium whitespace-nowrap">
            {raisedHands.length} raised
          </span>
        </div>
        
        {/* Avatar stack - hidden on very small screens */}
        <div className="hidden xs:flex -space-x-2 flex-shrink-0">
          {raisedHands.slice(0, 3).map((hand) => (
            <div
              key={hand.participantId}
              className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-semibold text-white border-2 border-gray-900 shadow-md"
              title={hand.name}
            >
              {getInitials(hand.name || hand.participantId)}
            </div>
          ))}
          {raisedHands.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-gray-700/90 flex items-center justify-center text-[10px] font-semibold text-white border-2 border-gray-900 shadow-md">
              +{raisedHands.length - 3}
            </div>
          )}
        </div>
        
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/30 hover:bg-blue-500/40 text-blue-300 rounded-full text-xs font-medium transition-all duration-200 border border-blue-500/30 ml-auto"
        >
          <span className="hidden xs:inline">View All</span>
          <span className="xs:hidden">View</span>
          <Icon name="arrow" size={12} />
        </button>
      </div>
    </div>
  );
};