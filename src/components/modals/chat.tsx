import React, { useRef, useEffect } from "react";
import { useChat, type Participant, type SDKChatMessage } from "@vidbloq/react";
import Modal from "../ui/v-modal";
import { Icon } from "../icons";

type ChatModalProps = {
  participants: Participant[];
  isOpen: boolean;
  onClose: () => void;
};

const ChatModal = ({ participants, isOpen, onClose }: ChatModalProps) => {
  // Use the custom chat hook
  const {
    message,
    handleMessageChange,
    handleKeyDown,
    sendMessage,
    getFormattedMessages,
    chatMessages,
  } = useChat({
    participants,
  });

  // Reference to the message container for auto-scrolling
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Format messages with proper typing
  const formattedMessages: SDKChatMessage[] = getFormattedMessages(chatMessages);

  // Helper function to convert text with links to clickable elements
  const parseMessageWithLinks = (text: string): React.ReactNode => {
    if (!text || typeof text !== 'string') return text;

    // Simple but effective URL regex
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const wwwRegex = /(^|[\s])((www\.)[^\s]+)/gi;
    const domainRegex = /(^|[\s])([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,})/gi;
    
    let processedText = text;
    
    // First pass: handle full URLs with protocols
    processedText = processedText.replace(urlRegex, (match) => {
      return `__LINK_START__${match}__LINK_MIDDLE__${match}__LINK_END__`;
    });
    
    // Second pass: handle www. URLs
    processedText = processedText.replace(wwwRegex, (match, prefix, url) => {
      return `${prefix}__LINK_START__https://${url}__LINK_MIDDLE__${url}__LINK_END__`;
    });
    
    // Third pass: handle domain-only URLs
    processedText = processedText.replace(domainRegex, (match, prefix, domain) => {
      // Skip if it's already been processed
      if (match.includes('__LINK_')) return match;
      return `${prefix}__LINK_START__https://${domain}__LINK_MIDDLE__${domain}__LINK_END__`;
    });
    
    // Split by our markers and create elements
    const parts = processedText.split(/(__LINK_START__|__LINK_MIDDLE__|__LINK_END__)/);
    const result: React.ReactNode[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (part === '__LINK_START__') {
        // Next part is the href, part after that is the display text
        const href = parts[i + 1];
        const displayText = parts[i + 3];
        
        result.push(
          <a
            key={`link-${i}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#1d4ed8',
              textDecoration: 'underline',
              cursor: 'pointer',
              wordBreak: 'break-all'
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('Opening link:', href);
              window.open(href, '_blank', 'noopener,noreferrer');
            }}
          >
            {displayText}
          </a>
        );
        
        // Skip the next 4 parts (they're the link components)
        i += 4;
      } else if (!part.startsWith('__LINK_')) {
        // Regular text
        if (part) {
          result.push(<span key={`text-${i}`}>{part}</span>);
        }
      }
    }
    
    return result.length > 0 ? result : text;
  };

  // Helper function to process message content
  const getMessageContent = (chat: SDKChatMessage): React.ReactNode => {
    // Always use our link parser, regardless of parsedContent
    const messageText = chat.message || '';
    return parseMessageWithLinks(messageText);
  };

  // Helper function to get participant info from message
  const getParticipantInfo = (chat: SDKChatMessage) => {
    // First priority: use participant from message if available
    if (chat.participant) {
      return {
        userName: chat.participant.userName || "Unknown User",
        avatarUrl: chat.participant.avatarUrl || "",
        identity: chat.participant.id
      };
    }
    
    // Second priority: try to find participant by identity
    const identity = chat.from?.identity;
    if (identity) {
      const participant = participants.find(p => p.id === identity);
      if (participant) {
        return {
          userName: participant.userName || "Unknown User",
          avatarUrl: participant.avatarUrl || "",
          identity: participant.id
        };
      }
    }
    
    // Third priority: try to parse from metadata
    if (chat.from?.metadata) {
      try {
        const metadata = JSON.parse(chat.from.metadata);
        return {
          userName: metadata.userName || chat.from.identity || "Unknown User",
          avatarUrl: metadata.avatarUrl || "",
          identity: chat.from.identity
        };
      } catch (error) {
        console.warn("Failed to parse participant metadata:", error);
      }
    }
    
    // Fallback
    return {
      userName: chat.from?.identity || "Unknown User",
      avatarUrl: "",
      identity: chat.from?.identity
    };
  };

  // Only render if modal is open
  if (!isOpen) return null;
  
  return (
    <Modal
      onClose={onClose}
      position="right"
      childClassName="bg-[var(--sdk-bg-primary-color)] h-full w-[70%] lg:w-1/4 rounded-l-xl"
    >
      <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden">
        <div
          ref={messageContainerRef}
          className="flex-1 overflow-y-auto p-4"
        >
          {formattedMessages.map((chat, index) => {
            const { userName, avatarUrl } = getParticipantInfo(chat);

            return (
              <div key={chat.id || index} className="mb-3 flex items-start">
                {/* Participant Avatar */}
                <div className="flex-shrink-0 mr-2">
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
                  <div className="font-semibold text-gray-900">
                    {userName}
                  </div>
                  <div className="mt-1 break-words text-gray-700">
                    {getMessageContent(chat)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fixed input area */}
        <div className="flex-shrink-0 p-4 bg-[var(--sdk-bg-primary-color)] border-t border-gray-200">
          <div className="flex items-center border border-primary rounded-xl overflow-hidden">
            <input
              type="text"
              className="flex-1 min-w-0 focus:outline-none px-3 py-2 bg-transparent text-sm"
              placeholder="Say something..."
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={sendMessage}
              className="flex-shrink-0 bg-primary p-2 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
              style={{ minWidth: '40px', width: '40px', height: '40px' }}
            >
              <Icon name="send" size={16} className="text-text-primary" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ChatModal;