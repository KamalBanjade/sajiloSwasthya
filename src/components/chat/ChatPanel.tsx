import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';
import { ChatWindow } from './ChatWindow';

interface ChatPanelProps {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserRole: string;
  otherUserProfilePictureUrl?: string;
  otherUserGender?: string;
  isOpenDefault?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  currentUserId,
  otherUserId,
  otherUserName,
  otherUserRole,
  otherUserProfilePictureUrl,
  otherUserGender,
  isOpenDefault = false
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const [isExpanded, setIsExpanded] = useState(false);

  // View state classes
  const panelClasses = isExpanded
    ? "fixed bottom-4 right-4 w-[600px] h-[80vh] z-50 flex flex-col bg-white dark:bg-slate-900 shadow-2xl rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden"
    : "fixed bottom-4 right-4 w-[380px] h-[550px] z-50 flex flex-col bg-white dark:bg-slate-900 shadow-xl rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden";

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-transform active:scale-95 z-50"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="chat-panel"
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={panelClasses}
      >
        {/* Panel Decorator (The minimize/close buttons) - Absolute positioned over header */}
        <div className="absolute top-[18px] right-4 z-20 flex items-center space-x-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ChatWindow 
          currentUserId={currentUserId}
          otherUserId={otherUserId}
          otherUserName={otherUserName}
          otherUserRole={otherUserRole}
          otherUserProfilePictureUrl={otherUserProfilePictureUrl}
          otherUserGender={otherUserGender}
          showHeader={true}
        />
      </motion.div>
    </AnimatePresence>
  );
};
;
