import React from 'react';
import { Check, CheckCheck, User } from 'lucide-react';
import { ChatMessage } from '../../lib/api/chatApi';
import { formatTime } from '../../lib/utils/dateUtils';
import Image from 'next/image';

interface ChatBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showTail?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isOwn, showTail = true }) => {
  return (
    <div className={`flex w-full items-start ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[85%] md:max-w-[70%] group`}>
        
        {/* Subtle 'Beak' (Tail) - Only on the first message of a cluster */}
        {showTail && (
          <div 
            className={`absolute top-0 w-[10px] h-[8px] ${
              isOwn 
                ? '-right-[9px] bg-blue-600' 
                : '-left-[9px] bg-white dark:bg-slate-700'
            }`} 
            style={{ 
              clipPath: isOwn 
                ? 'polygon(0 0, 0 100%, 100% 0)' 
                : 'polygon(100% 0, 100% 100%, 0 0)' 
            }} 
          />
        )}

        {/* Message Bubble Body */}
        <div className={`px-4 py-2 rounded-2xl relative shadow-md ${
          isOwn 
            ? `bg-blue-600 text-white ${showTail ? 'rounded-tr-none' : ''}` 
            : `bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 ${showTail ? 'rounded-tl-none' : ''} border border-slate-200/50 dark:border-slate-600/50`
        }`}>
          
          <div className="relative leading-relaxed">
            <span className="text-[15px] font-medium whitespace-pre-wrap break-words pr-2">
              {message.messageText}
              {/* Spacer for inline time */}
              <span className="inline-block w-14" />
            </span>

            {/* Inline Metadata Footer */}
            <div className={`absolute bottom-0 right-[-4px] flex items-center space-x-1 text-[10px] select-none ${
              isOwn ? 'text-blue-100/80' : 'text-slate-400 dark:text-slate-500'
            }`}>
              <span className="font-bold">{formatTime(message.sentAt)}</span>
              
              {isOwn && (
                <span className="flex-shrink-0">
                  {message.isRead ? (
                    <CheckCheck className="w-3 h-3 text-blue-100" />
                  ) : (
                    <Check className="w-3 h-3 text-blue-200" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
