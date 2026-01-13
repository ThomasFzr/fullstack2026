import api from './api';

export interface Conversation {
  id: number;
  listing_id: number;
  guest_id: number;
  host_id: number;
  listing_title?: string;
  other_user_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  read_at: string | null;
}

export const messageService = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/messages/conversations');
    return response.data;
  },

  getConversationById: async (id: number): Promise<Conversation> => {
    const response = await api.get(`/messages/conversations/${id}`);
    return response.data;
  },

  createConversation: async (listing_id: number): Promise<Conversation> => {
    const response = await api.post('/messages/conversations', { listing_id });
    return response.data.conversation;
  },

  getMessages: async (conversationId: number): Promise<Message[]> => {
    const response = await api.get(`/messages/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId: number, content: string): Promise<Message> => {
    const response = await api.post(`/messages/conversations/${conversationId}/messages`, {
      content,
    });
    return response.data.data;
  },

  markAsRead: async (conversationId: number): Promise<void> => {
    await api.post(`/messages/conversations/${conversationId}/read`);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/messages/unread-count');
    return response.data.count;
  },
};
