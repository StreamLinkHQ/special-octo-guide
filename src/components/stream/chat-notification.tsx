import React, { useState, useEffect } from 'react';
import type { Participant, SDKChatMessage } from "@vidbloq/react";

interface ChatNotificationProps {
  message: SDKChatMessage;
  participant?: Participant;
  onDismiss: () => void;
  onOpenChat: () => void;
}

const ChatNotification: React.FC<ChatNotificationProps> = ({
  message,
  participant,
  onDismiss,
  onOpenChat,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Helper function to get participant info from message
  const getParticipantInfo = (): { userName: string; avatarUrl: string; participantId?: string } => {
    // First priority: use participant prop passed directly
    if (participant) {
      return {
        userName: participant.userName || "Unknown User",
        avatarUrl: participant.avatarUrl || "",
        participantId: participant.id
      };
    }
    
    // Second priority: use participant from message
    if (message.participant) {
      return {
        userName: message.participant.userName || "Unknown User",
        avatarUrl: message.participant.avatarUrl || "",
        participantId: message.participant.id
      };
    }
    
    // Third priority: try to parse from LiveKit metadata
    if (message.from?.metadata) {
      try {
        const metadata = JSON.parse(message.from.metadata);
        return {
          userName: metadata.userName || message.from.identity || "Unknown User",
          avatarUrl: metadata.avatarUrl || "",
          participantId: message.from.identity
        };
      } catch (error) {
        console.warn("Failed to parse participant metadata:", error);
      }
    }
    
    // Fallback
    return {
      userName: message.from?.identity || "Unknown User",
      avatarUrl: "",
      participantId: message.from?.identity
    };
  };

  useEffect(() => {
    // Start animation
    setIsAnimating(true);
    
    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300); // Wait for animation to complete
  };

  const handleOpenChat = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
      onOpenChat();
    }, 100);
  };

  if (!isVisible) return null;

  const { userName, avatarUrl } = getParticipantInfo();

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-300 ease-in-out cursor-pointer ${
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      onClick={handleOpenChat}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`${userName}'s avatar`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">
                  {userName ? userName.charAt(0).toUpperCase() : '?'}
                </span>
              )}
            </div>
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2">
              {message.parsedContent || message.message}
            </p>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 rounded-b-lg overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-b-lg transition-all duration-5000 ease-linear"
          style={{
            width: isAnimating ? '0%' : '100%',
            transitionDuration: '5000ms'
          }}
        />
      </div>
    </div>
  );
};

export default ChatNotification;