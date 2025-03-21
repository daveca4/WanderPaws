'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Message, 
  Conversation, 
  MessageAttachment 
} from './types';
import { 
  mockMessages, 
  mockConversations, 
  getUserConversations, 
  getConversationMessages, 
  createMessage as createMockMessage,
  markMessagesAsRead as markMockMessagesAsRead,
  createConversation as createMockConversation,
  getTotalUnreadMessages
} from './mockMessages';
import { useAuth } from './AuthContext';

interface MessageContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  unreadCount: number;
  setCurrentConversation: (conversation: Conversation | null) => void;
  sendMessage: (content: string, attachments?: MessageAttachment[]) => Promise<Message | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  createConversation: (participants: string[], title?: string) => Promise<Conversation | null>;
  refreshConversations: () => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load user's conversations
  useEffect(() => {
    if (user) {
      refreshConversations();
    } else {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Load messages when currentConversation changes
  useEffect(() => {
    if (currentConversation) {
      setMessages(getConversationMessages(currentConversation.id));
      
      // Mark messages as read when conversation is opened
      if (user) {
        markAsRead(currentConversation.id);
      }
    } else {
      setMessages([]);
    }
  }, [currentConversation, user]);

  const refreshConversations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      const userConversations = getUserConversations(user.id);
      setConversations(userConversations);
      
      // Get total unread message count
      const totalUnread = getTotalUnreadMessages(user.id);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string, attachments?: MessageAttachment[]): Promise<Message | null> => {
    if (!user || !currentConversation) return null;
    
    try {
      // In a real app, this would be an API call
      const newMessage = createMockMessage(
        currentConversation.id,
        user.id,
        content,
        attachments
      );
      
      // Update messages in state
      setMessages(prev => [...prev, newMessage]);
      
      // Refresh conversations to update last message and timestamps
      await refreshConversations();
      
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  };

  const markAsRead = async (conversationId: string): Promise<void> => {
    if (!user) return;
    
    try {
      // In a real app, this would be an API call
      markMockMessagesAsRead(conversationId, user.id);
      
      // Refresh conversations to update unread counts
      await refreshConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const createConversation = async (participants: string[], title?: string): Promise<Conversation | null> => {
    if (!user) return null;
    
    // Make sure the current user is included in participants
    if (!participants.includes(user.id)) {
      participants = [user.id, ...participants];
    }
    
    try {
      // In a real app, this would be an API call
      const newConversation = createMockConversation(participants, title);
      
      // Refresh conversations
      await refreshConversations();
      
      return newConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  return (
    <MessageContext.Provider
      value={{
        conversations,
        currentConversation,
        messages,
        isLoading,
        unreadCount,
        setCurrentConversation,
        sendMessage,
        markAsRead,
        createConversation,
        refreshConversations
      }}
    >
      {children}
    </MessageContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
} 