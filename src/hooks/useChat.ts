import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { chatConnectionManager } from '../lib/signalr/chatConnection';
import { ChatMessage } from '../lib/api/chatApi';

interface UseChatProps {
  currentUserId: string;
  otherUserId: string;
}

export function useChat({ currentUserId, otherUserId }: UseChatProps) {
  const queryClient = useQueryClient();
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean | undefined>(undefined);
  const [lastSeenAt, setLastSeenAt] = useState<string | undefined>(undefined);

  // Connection is handled globally via global context or useChatConnection
  // We just get the instance here to register listeners
  const connection = chatConnectionManager.getConnection();

  useEffect(() => {
    if (!connection) return;

    // Incoming messages
    const handleReceiveMessage = (message: ChatMessage) => {
      // Update specific conversation cache
      queryClient.setQueryData(
        queryKeys.chat.conversation(message.senderId === currentUserId ? message.receiverId : message.senderId, 1),
        (old: ChatMessage[] | undefined) => {
          if (!old) return [message];
          // Avoid duplicates
          if (old.some(m => m.id === message.id)) return old;
          return [...old, message];
        }
      );

      // Invalidate the conversations list and unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations() });
      if (message.receiverId === currentUserId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.chat.unreadCount() });
      }
    };

    // My own sent message confirmed by server
    const handleMessageSent = (data: { id: string, receiverId: string, messageText: string, sentAt: string }) => {
      // Create a complete ChatMessage structure to instantly display
      const newMessage = {
        id: data.id,
        senderId: currentUserId,
        receiverId: data.receiverId,
        messageText: data.messageText,
        sentAt: data.sentAt,
        isRead: false
      } as ChatMessage;

      // Manually inject the new message into the local cache. 
      // This forces the "empty state" to immediately disappear and show our brand new message 
      // even if the background fetch is disabled for "isNew" contacts!
      queryClient.setQueryData(
        queryKeys.chat.conversation(data.receiverId, 1),
        (old: ChatMessage[] | undefined) => {
          if (!old) return [newMessage];
          if (old.some(m => m.id === newMessage.id)) return old; // deduplicate just in case
          return [...old, newMessage];
        }
      );

      // Invalidate the conversations list so the sidebar becomes permanent
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations() });
    };

    const handleMessageRead = (data: { messageId: string, readAt: string, readBy: string }) => {
      // Invalidate the conversation to update UI, or manually traverse cache
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversation(data.readBy, 1) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversation(currentUserId, 1) }); // refresh current view
    };

    const handleUserTyping = (typingUserId: string) => {
      if (typingUserId === otherUserId) {
        setIsTyping(true);
        // Clear typing after 3 seconds if no stop signal
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleUserStoppedTyping = (typingUserId: string) => {
      if (typingUserId === otherUserId) setIsTyping(false);
    };

    const handleUserOnline = (onlineUserId: string) => {
      if (onlineUserId === otherUserId) {
        setIsOnline(true);
        setLastSeenAt(undefined);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations() });
    };

    const handleUserOffline = (offlineUserId: string) => {
      if (offlineUserId === otherUserId) {
        setIsOnline(false);
        setLastSeenAt(new Date().toISOString());
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations() });
    };

    // Attach listeners
    connection.on('ReceiveMessage', handleReceiveMessage);
    connection.on('MessageSent', handleMessageSent);
    connection.on('MessageRead', handleMessageRead);
    connection.on('UserTyping', handleUserTyping);
    connection.on('UserStoppedTyping', handleUserStoppedTyping);
    connection.on('UserOnline', handleUserOnline);
    connection.on('UserOffline', handleUserOffline);

    // Initial check (could be cached)
    // chatApi.checkOnlineStatus(otherUserId).then(setIsOnline);

    return () => {
      connection.off('ReceiveMessage', handleReceiveMessage);
      connection.off('MessageSent', handleMessageSent);
      connection.off('MessageRead', handleMessageRead);
      connection.off('UserTyping', handleUserTyping);
      connection.off('UserStoppedTyping', handleUserStoppedTyping);
      connection.off('UserOnline', handleUserOnline);
      connection.off('UserOffline', handleUserOffline);
    };
  }, [connection, currentUserId, otherUserId, queryClient]);

  // Actions
  const sendMessage = useCallback(async (text: string) => {
    if (!connection) throw new Error('Not connected');
    await connection.invoke('SendMessage', otherUserId, text);
  }, [connection, otherUserId]);

  const markAsRead = useCallback(async (messageId: string) => {
    if (!connection) return;
    await connection.invoke('MarkMessageAsRead', messageId);
    
    // Optimistically update unread count
    queryClient.invalidateQueries({ queryKey: queryKeys.chat.unreadCount() });
  }, [connection, queryClient]);

  const sendTyping = useCallback(async () => {
    if (!connection) return;
    await connection.invoke('SendTypingIndicator', otherUserId);
  }, [connection, otherUserId]);

  const stopTyping = useCallback(async () => {
    if (!connection) return;
    await connection.invoke('StopTypingIndicator', otherUserId);
  }, [connection, otherUserId]);

  return {
    isTyping,
    isOnline,   
    lastSeenAt,
    sendMessage,
    markAsRead,
    sendTyping,
    stopTyping
  };
}
