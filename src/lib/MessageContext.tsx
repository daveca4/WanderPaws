'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Message, Conversation } from './types';
import { useData } from './DataContext';
import { useAuth } from './AuthContext';

// Define the shape of our context
interface MessageContextType {
  messages: Message[];
  conversations: Conversation[];
  unreadCount: number;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (messageIds: string[]) => Promise<void>;
  createConversation: (participants: string[], initialMessage?: string) => Promise<string>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { messages: dbMessages, conversations: dbConversations } = useData();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  // Update messages and conversations from DataContext when they change
  useEffect(() => {
    setMessages(dbMessages);
    setConversations(dbConversations);
  }, [dbMessages, dbConversations]);
  
  // Calculate unread messages count
  const unreadCount = user 
    ? messages.filter(msg => 
        msg.readStatus === 'unread' && 
        msg.senderId !== user.id
      ).length 
    : 0;
  
  const sendMessage = async (conversationId: string, content: string) => {
    if (!user) return;
    
    try {
      // Create message structure
      const messageData = {
        conversationId,
        senderId: user.id,
        content,
        timestamp: new Date().toISOString(),
        readStatus: 'unread',
      };
      
      // Create message using API
      const response = await fetch('/api/data/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create message');
      }
      
      const newMessage = await response.json();
      
      // Update local state
      setMessages(prev => [...prev, newMessage]);
      
      // Update conversation timestamp using the conversation update API
      try {
        await fetch(`/api/data/conversations/${conversationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ updatedAt: new Date().toISOString() }),
        });
      } catch (updateError) {
        console.error('Error updating conversation timestamp:', updateError);
        // Continue anyway since the message was created successfully
      }
      
      // Update local state for the conversation
      setConversations(prev => 
        prev.map(convo => 
          convo.id === conversationId 
            ? { ...convo, updatedAt: new Date().toISOString() }
            : convo
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
  
  const markAsRead = async (messageIds: string[]) => {
    try {
      // For now, just update the local state
      // In a real implementation, you would call the API endpoint
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg.id) 
            ? { ...msg, readStatus: 'read' } 
            : msg
        )
      );

      console.log('Marked messages as read (local state only):', messageIds);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  };
  
  const createConversation = async (participants: string[], initialMessage?: string): Promise<string> => {
    if (!user) throw new Error('Must be logged in to create a conversation');
    
    try {
      // Make sure the current user is included in participants
      if (!participants.includes(user.id)) {
        participants = [...participants, user.id];
      }
      
      // Create conversation using API
      const conversationData = {
        participants,
        title: null, // Could be generated based on participants
        type: participants.length > 2 ? 'group' : 'direct',
      };
      
      const response = await fetch('/api/data/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conversationData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      const newConversation = await response.json();
      const conversationId = newConversation.id;
      
      // Update local state
      setConversations(prev => [...prev, newConversation]);
      
      // If an initial message was provided, send it
      if (initialMessage) {
        await sendMessage(conversationId, initialMessage);
      }
      
      return conversationId;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };
  
  return (
    <MessageContext.Provider
      value={{
        messages,
        conversations,
        unreadCount,
        activeConversationId,
        setActiveConversationId,
        sendMessage,
        markAsRead,
        createConversation,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
}; 