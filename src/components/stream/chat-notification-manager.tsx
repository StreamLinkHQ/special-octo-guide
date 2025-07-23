import React, { useState, useEffect, useRef } from 'react';
import type { Participant, SDKChatMessage } from "@vidbloq/react";
import ChatNotification from './chat-notification';


interface NotificationData {
  id: string;
  message: SDKChatMessage;
  participant?: Participant;
  timestamp: number;
}

interface ChatNotificationManagerProps {
  messages: SDKChatMessage[];
  participants: Participant[];
  isChatOpen: boolean;
  onOpenChat: () => void;
}

const ChatNotificationManager: React.FC<ChatNotificationManagerProps> = ({
  messages,
  participants,
  isChatOpen,
  onOpenChat,
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const lastMessageCountRef = useRef(0);
  const processedMessagesRef = useRef(new Set<string>());

  // Helper function to get participant from message
  const getParticipant = (message: SDKChatMessage): Participant | undefined => {
    // First check if message already has participant
    if (message.participant) {
      return message.participant;
    }
    
    // Otherwise try to find by identity
    const identity = message.from?.identity;
    if (!identity) return undefined;
    
    // Match by participant id (identity)
    return participants.find(p => p.id === identity);
  };

  // Generate a unique ID for each message
  const generateMessageId = (message: SDKChatMessage): string => {
    // If message already has an ID, use it
    if (message.id) return message.id;
    
    // Otherwise generate one
    const identity = message.from?.identity || message.participant?.id || 'unknown';
    const content = message.message || '';
    const timestamp = message.timestamp || Date.now();
    return `${identity}-${content.slice(0, 20)}-${timestamp}`;
  };

  useEffect(() => {
    // Only show notifications if chat is closed
    if (isChatOpen) {
      setNotifications([]);
      return;
    }

    // Check for new messages
    if (messages.length > lastMessageCountRef.current) {
      const newMessages = messages.slice(lastMessageCountRef.current);
      
      newMessages.forEach((message) => {
        const messageId = generateMessageId(message);
        
        // Skip if we've already processed this message
        if (processedMessagesRef.current.has(messageId)) {
          return;
        }
        
        processedMessagesRef.current.add(messageId);
        
        // Get participant - either from message or by looking up
        const participant = getParticipant(message);
        
        const notification: NotificationData = {
          id: messageId,
          message,
          participant,
          timestamp: message.timestamp || Date.now(),
        };

        setNotifications((prev) => {
          // Limit to 3 notifications at once
          const updated = [...prev, notification];
          return updated.slice(-3);
        });
      });
    }

    lastMessageCountRef.current = messages.length;
  }, [messages, isChatOpen, participants]);

  const handleDismissNotification = (notificationId: string) => {
    setNotifications((prev) => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            transform: `translateY(${index * 10}px)`,
            zIndex: 50 - index,
          }}
        >
          <ChatNotification
            message={notification.message}
            participant={notification.participant}
            onDismiss={() => handleDismissNotification(notification.id)}
            onOpenChat={onOpenChat}
          />
        </div>
      ))}
    </div>
  );
};

export default ChatNotificationManager;