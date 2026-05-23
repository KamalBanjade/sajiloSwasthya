import axiosInstance from '../utils/axios';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  senderRole: string;
  senderProfilePictureUrl?: string;
  messageText: string;
  sentAt: string;
  isRead: boolean;
  readAt?: string;
  isEdited: boolean;
}

export interface Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserRole: string;
  otherUserProfilePictureUrl?: string;
  otherUserGender?: string;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;
  isOnline: boolean;
  lastSeenAt?: string;
  isNew?: boolean;
}

export const chatApi = {
  getConversation: async (otherUserId: string, page = 1, pageSize = 50): Promise<ChatMessage[]> => {
    const response = await axiosInstance.get(`/chat/conversation/${otherUserId}`, {
      params: { page, pageSize }
    });
    return response.data.data;
  },

  getConversations: async (): Promise<Conversation[]> => {
    const response = await axiosInstance.get('/chat/conversations');
    return response.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await axiosInstance.get('/chat/unread-count');
    return response.data.data.unreadCount;
  },

  checkOnlineStatus: async (userId: string): Promise<{ isOnline: boolean; lastSeenAt?: string }> => {
    const response = await axiosInstance.get(`/chat/online-status/${userId}`);
    return {
      isOnline: response.data.data.isOnline,
      lastSeenAt: response.data.data.lastSeenAt
    };
  },

  deleteConversation: async (otherUserId: string): Promise<void> => {
    const response = await axiosInstance.delete(`/chat/conversation/${otherUserId}`);
    return response.data;
  }
};
