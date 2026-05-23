import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../../lib/api/chatApi';
import { ChatBubble } from './ChatBubble';
import { TypingIndicator } from './TypingIndicator';
import { formatMessageDate } from '../../lib/utils/dateUtils';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  isTyping: boolean;
  onMessageVisible: (messageId: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  currentUserId, 
  isTyping,
  onMessageVisible 
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  // Auto-scroll to bottom when new messages arrive or typing status changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping]);

  // Use Intersection Observer to detect when unread messages become visible
  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            const isRead = entry.target.getAttribute('data-is-read') === 'true';
            const senderId = entry.target.getAttribute('data-sender-id');
            
            // If message is unread and not from us, mark it as read
            if (messageId && !isRead && senderId !== currentUserId) {
              onMessageVisible(messageId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const elements = document.querySelectorAll('.chat-message-observer');
    elements.forEach((el) => observer.current?.observe(el));

    return () => {
      observer.current?.disconnect();
    };
  }, [messages, currentUserId, onMessageVisible]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-gray-900/50 custom-scrollbar">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
          No messages yet. Send a message to start the conversation.
        </div>
      ) : (
        messages.map((msg, index) => {
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const currentDateStr = formatMessageDate(msg.sentAt);
          const prevDateStr = prevMsg ? formatMessageDate(prevMsg.sentAt) : null;
          const showDateDivider = currentDateStr !== prevDateStr;
          
          const isFirstInCluster = !prevMsg || prevMsg.senderId !== msg.senderId || showDateDivider;

          return (
            <React.Fragment key={msg.id}>
              {showDateDivider && (
                <div className="flex items-center gap-4 my-8 first:mt-2">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800/50" />
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
                    {currentDateStr}
                  </span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800/50" />
                </div>
              )}
              <div 
                className={`chat-message-observer ${isFirstInCluster ? 'mt-4' : 'mt-0.5'}`}
                data-message-id={msg.id}
                data-is-read={msg.isRead}
                data-sender-id={msg.senderId}
              >
                <ChatBubble 
                  message={msg} 
                  isOwn={msg.senderId === currentUserId} 
                  showTail={isFirstInCluster}
                />
              </div>
            </React.Fragment>
          );
        })
      )}

      {isTyping && (
        <div className="flex justify-start mb-4">
          <TypingIndicator />
        </div>
      )}
      
      <div ref={bottomRef} className="h-1" />
    </div>
  );
};
