import { Icon } from "../icons";
import type { RaisedHand } from "./raised-hands-toast";

interface RaisedHandsSidebarProps {
  raisedHands: RaisedHand[];
  isOpen: boolean;
  onClose: () => void;
}

export const RaisedHandsSidebar = ({ raisedHands, isOpen, onClose }: RaisedHandsSidebarProps) => {
  if (!isOpen) return null;

  const getTimeElapsed = (timestamp: number) => {
    const elapsed = Date.now() - timestamp;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ago`;
    }
    return `${seconds}s ago`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Sidebar - Full screen on mobile, sidebar on desktop */}
      <div className="fixed inset-x-4 bottom-4 top-auto sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-4 sm:w-80 
                      bg-gray-900/98 backdrop-blur-xl rounded-2xl shadow-2xl z-50 
                      animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 
                      border border-white/10 max-h-[70vh] sm:max-h-none">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="hand" className="text-blue-400" size={20} />
              <h3 className="text-lg font-semibold text-white">Raised Hands</h3>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                {raisedHands.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors duration-200"
            >
              <Icon name="close" className="text-gray-400" size={14} />
            </button>
          </div>
        </div>
        
        {/* List */}
        <div className="p-3 overflow-y-auto max-h-[50vh] sm:max-h-[calc(100vh-120px)]">
          {raisedHands.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No hands raised
            </div>
          ) : (
            <div className="space-y-2">
              {raisedHands.map((hand) => (
                <div
                  key={hand.participantId}
                  className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all duration-200 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0 shadow-md">
                    {getInitials(hand.name || hand.participantId)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white truncate">
                        {hand.name || hand.participantId}
                      </span>
                      {hand.userType === 'host' && (
                        <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded uppercase">
                          Host
                        </span>
                      )}
                      {hand.userType === 'co-host' && (
                        <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded uppercase">
                          Co-Host
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {getTimeElapsed(hand.timestamp)}
                    </div>
                  </div>
                  
                  <Icon name="hand" className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" size={16} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};