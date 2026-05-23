import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../../lib/api';
import { queryKeys } from '../../lib/queryKeys';
import { useChat } from '../../hooks/useChat';
import { useChatConnection } from '../../hooks/useChatConnection';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { OnlineStatus } from './OnlineStatus';
import { getRelativeTimeString } from '../../lib/utils/dateUtils';
import { User } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface ChatWindowProps {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserRole: string;
  otherUserProfilePictureUrl?: string;
  otherUserGender?: string;
  className?: string;
  showHeader?: boolean;
  isNew?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  currentUserId,
  otherUserId,
  otherUserName,
  otherUserRole,
  otherUserProfilePictureUrl,
  otherUserGender,
  className = "",
  showHeader = true,
  isNew = false
}) => {
  // Initialize Global Connection
  const { isConnected, error: connectionError } = useChatConnection();

  // Load message history
  const { data: messages = [], isLoading, error: fetchError } = useQuery({
    queryKey: queryKeys.chat.conversation(otherUserId, 1),
    queryFn: () => chatApi.getConversation(otherUserId, 1, 100),
    enabled: !!otherUserId && !isNew
  });

  // Track online status on initial load
  const { data: initialPresence } = useQuery({
    queryKey: queryKeys.chat.onlineStatus(otherUserId),
    queryFn: () => chatApi.checkOnlineStatus(otherUserId),
    enabled: !!otherUserId && !isNew
  });

  // Setup Real-time Hooks
  const { isTyping, isOnline: signalROnline, lastSeenAt: signalRLastSeen, sendMessage, markAsRead, sendTyping, stopTyping } = useChat({
    currentUserId,
    otherUserId
  });

  const currentOnlineStatus = signalROnline !== undefined ? signalROnline : (initialPresence?.isOnline ?? false);
  const currentLastSeenAt = signalRLastSeen !== undefined ? signalRLastSeen : initialPresence?.lastSeenAt;

  const getStatusText = () => {
    if (currentOnlineStatus) return 'Online';
    if (currentLastSeenAt) return `Last seen ${getRelativeTimeString(currentLastSeenAt)}`;
    return 'Offline';
  };

  const handleSendMessage = async (text: string) => {
    if (!isConnected) return;
    await sendMessage(text);
    await stopTyping();
  };

  const handleTyping = () => {
    sendTyping();
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 ${className}`}>
      {/* Header: Standardized Height */}
      {showHeader && (
        <div className="h-[96px] shrink-0 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl z-10">
          <div className="flex items-center space-x-5">
            <div className="relative">
              <Avatar 
                src={otherUserProfilePictureUrl}
                gender={otherUserGender}
                name={otherUserName}
                className="w-14 h-14 rounded-full border-2 border-white dark:border-slate-800 shadow-md"
              />
              <div className="absolute bottom-0 right-0 border-2 border-white dark:border-slate-900 rounded-full shadow-sm">
                <OnlineStatus isOnline={currentOnlineStatus} size="md" />
              </div>
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-xl leading-none tracking-tight mb-1.5 transition-colors">
                {otherUserName}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">
                  {otherUserRole}
                </span>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${currentOnlineStatus ? "text-emerald-500" : "text-slate-400"}`}>
                  {getStatusText()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="bg-rose-50 dark:bg-rose-900/20 p-2 text-xs text-center text-rose-600 dark:text-rose-400 font-bold border-b border-rose-100 dark:border-rose-900/30">
          Signal interrupted. Reconnecting...
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-50/20 dark:bg-slate-900/20">
        {isLoading ? (
          <div className="p-6 space-y-4 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 3 === 0 ? 'justify-end' : 'justify-start'} animate-pulse`}
              >
                <div
                  className={`h-12 rounded-2xl ${i % 3 === 0
                    ? 'bg-blue-100 dark:bg-blue-500/10 w-1/3'
                    : 'bg-white dark:bg-slate-800/80 w-1/2'} 
                    shadow-sm border border-slate-100 dark:border-slate-800/50`}
                />
              </div>
            ))}
          </div>
        ) : (messages.length === 0 || (fetchError as any)?.response?.status === 403 || (fetchError as any)?.response?.status === 404) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-emerald-500/10 blur-[40px] rounded-full" />
              <div className="relative w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <User className="w-6 h-6" />
                </div>
              </div>
            </div>

            <h4 className="text-lg font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Start the conversation
            </h4>
          </div>
        ) : fetchError ? (
          <div className="absolute inset-0 flex items-center justify-center text-rose-500 text-[10px] p-8 text-center font-black uppercase tracking-widest">
            Sync Lost. Check your connection.
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            isTyping={isTyping}
            onMessageVisible={markAsRead}
          />
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-2">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={!isConnected}
        />
      </div>
    </div>
  );
};
