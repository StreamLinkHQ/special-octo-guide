import { useState, useEffect, useRef, useCallback } from "react";
import { useCallReactions, useStreamContext, type Participant } from "@vidbloq/react";

type ReactionProps = {
  showReactions: boolean;
  localParticipant?: Participant;
};

interface AnimatedReaction {
  id: string;
  reaction: string;
  sender: string;
  position: number;
  opacity: number;
  timestamp: number;
}

interface ReactionData {
  reaction: string;
  sender: string;
  timestamp?: number;
  id?: string;
}

const Reactions = ({ showReactions, localParticipant }: ReactionProps) => {
  const { reactions, sendReaction, isConnected } = useCallReactions();
  const [animatedReactions, setAnimatedReactions] = useState<AnimatedReaction[]>([]);
  const { nickname } = useStreamContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const sender = localParticipant?.userName || nickname || localParticipant?.id || "Unknown";
  const processedReactionIds = useRef<Set<string>>(new Set());
  
  // Available reactions
  const reactionEmojis = ["👍", "👎", "❤️", "🎉", "👏", "🔥", "😂", "🙌", "😮", "😭"];

  // Debug mode
  const DEBUG_MODE = false;

  // Responsive helper to check screen size
  const getDeviceType = () => {
    const width = window.innerWidth;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  const getRandomPosition = (): number => {
    if (!containerRef.current) {
      return window.innerWidth / 2 - 40;
    }
    
    const containerWidth = containerRef.current.offsetWidth;
    const deviceType = getDeviceType();
    
    // Adjust reaction width based on device
    const reactionWidth = deviceType === 'mobile' ? 60 : 80;
    const margin = deviceType === 'mobile' ? 10 : 20;
    
    const minPosition = margin;
    const maxPosition = containerWidth - reactionWidth - margin;
    
    const randomPosition = minPosition + Math.random() * (maxPosition - minPosition);
    
    return Math.max(minPosition, Math.min(randomPosition, maxPosition));
  };

  const lastReactionRef = useRef<string | null>(null);

  useEffect(() => {
    if (reactions.length === 0) return;

    const latestReaction = reactions[reactions.length - 1] as ReactionData;
    
    const reactionId = latestReaction.id || 
      `${latestReaction.reaction}-${latestReaction.sender}-${latestReaction.timestamp || Date.now()}`;

    if (lastReactionRef.current === reactionId) {
      return;
    }

    if (processedReactionIds.current.has(reactionId)) {
      return;
    }

    lastReactionRef.current = reactionId;
    processedReactionIds.current.add(reactionId);

    const animatedReaction: AnimatedReaction = {
      id: reactionId,
      reaction: latestReaction.reaction,
      sender: latestReaction.sender,
      position: getRandomPosition(),
      opacity: 1,
      timestamp: latestReaction.timestamp || Date.now(),
    };

    setAnimatedReactions((prev) => [...prev, animatedReaction]);

    const timeoutId = setTimeout(() => {
      setAnimatedReactions((prev) =>
        prev.filter((r) => r.id !== reactionId)
      );
      
      setTimeout(() => {
        processedReactionIds.current.delete(reactionId);
      }, 1000);
    }, 4000);

    return () => clearTimeout(timeoutId);
  }, [reactions]);

  const lastClickTime = useRef<number>(0);

  const handleSendReaction = useCallback((emoji: string) => {
    const now = Date.now();
    
    if (now - lastClickTime.current < 300) {
      return;
    }
    
    lastClickTime.current = now;
    
    sendReaction(emoji, sender);
  }, [sender, sendReaction]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setAnimatedReactions(prev => 
        prev.filter(r => now - r.timestamp < 5000)
      );
      
      if (processedReactionIds.current.size > 100) {
        processedReactionIds.current.clear();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      processedReactionIds.current.clear();
      setAnimatedReactions([]);
      lastReactionRef.current = null;
      lastClickTime.current = 0;
    };
  }, []);

  // Get responsive emoji size
  const getEmojiSize = () => {
    const deviceType = getDeviceType();
    if (deviceType === 'mobile') return 'text-2xl';
    if (deviceType === 'tablet') return 'text-3xl';
    return 'text-3xl';
  };

  return (
    <>
      {/* Debug info */}
      {DEBUG_MODE && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-50">
          <div>WebSocket: {isConnected ? '✅ Connected' : '❌ Disconnected'}</div>
          <div>Identity: {sender || 'Unknown'}</div>
          <div>Reactions in queue: {reactions.length}</div>
          <div>Animated reactions: {animatedReactions.length}</div>
        </div>
      )}
      
      {/* Floating reactions container */}
      <div
        ref={containerRef}
        className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none"
        style={{ 
          height: "calc(100vh - 150px)", // Adjusted for mobile
          maxHeight: window.innerWidth < 640 ? "400px" : "600px", // Smaller max height on mobile
          zIndex: 50 
        }}
      >
        {animatedReactions.map((reaction) => (
          <div
            key={reaction.id}
            className="absolute reaction-wrapper"
            style={{
              left: `${reaction.position}px`,
              bottom: "20px",
              opacity: reaction.opacity,
              transform: "translateY(0)",
              animation: "reaction-float 4s ease-out forwards",
              willChange: "transform, opacity",
            }}
          >
            <div className="flex flex-col items-center">
              <span 
                className={`${getEmojiSize()} reaction-emoji`} 
                style={{ animation: "scale-bounce 0.5s ease-out" }}
              >
                {reaction.reaction}
              </span>
              <span className="text-xs text-white bg-black bg-opacity-50 px-1 sm:px-2 py-0.5 sm:py-1 rounded-full mt-1 whitespace-nowrap max-w-[80px] truncate">
                {sender === reaction.sender ? "You" : reaction.sender}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Reaction panel - responsive */}
      {showReactions && (
        <div className="fixed bottom-16 sm:bottom-20 lg:bottom-24 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gray-800 bg-opacity-90 rounded-full p-1.5 sm:p-2 shadow-lg">
            {/* Mobile view - two rows */}
            <div className="flex overflow-x-auto justify-center gap-1 sm:!gap-2 lg:flex-nowrap max-w-[280px] sm:!max-w-none">
              {reactionEmojis.map((emoji, index) => (
                <button
                  key={emoji}
                  className={`
                    w-8 h-8 sm:w-10 sm:h-10 
                    rounded-full hover:bg-gray-700 
                    flex items-center justify-center 
                    text-base sm:text-xl 
                    transition-all hover:scale-110 active:scale-95
                    ${index < 5 ? '' : 'mt-1 sm:mt-0'}
                  `}
                  onClick={() => handleSendReaction(emoji)}
                  aria-label={`Send ${emoji} reaction`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default Reactions;