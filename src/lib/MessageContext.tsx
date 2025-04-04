'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Message, Conversation } from './types';
import { useAuth } from './auth/AuthContext';

// Define the shape of our context
interface MessageContextType {
  messages: Message[];
  conversations: Conversation[];
  unreadCount: number;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation | null) => void;
  isLoading: boolean;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markAsRead: (messageIds: string[]) => Promise<void>;
  createConversation: (participants: string[], initialMessage?: string) => Promise<string>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Load messages and conversations directly from API instead of via DataContext
  useEffect(() => {
    if (!user) return;
    
    setIsLoading(true);
    
    // Fetch conversations
    const fetchConversations = async () => {
      try {
        // Try multiple API paths with proper auth headers
        const headers = {
          'Content-Type': 'application/json',
          'user-id': user.id,
          'user-role': user.role,
          'user-profile-id': user.profileId || ''
        };
        
        console.log('🔍 Fetching conversations with headers:', headers);
        
        // Try primary endpoint
        try {
          const response = await fetch('/api/data/conversations', {
            headers
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Fetched conversations:', data);
            setConversations(data);
            return;
          }
        } catch (firstError) {
          console.warn('⚠️ Error with primary conversation endpoint:', firstError);
        }
        
        // Try backup endpoint format
        try {
          const backupResponse = await fetch('/api/conversations', {
            headers
          });
          
          if (backupResponse.ok) {
            const backupData = await backupResponse.json();
            console.log('✅ Fetched conversations from backup endpoint:', backupData);
            setConversations(backupData);
            return;
          }
        } catch (backupError) {
          console.warn('⚠️ Error with backup conversation endpoint:', backupError);
        }
        
        // If all fails, use mock data
        console.log('⚠️ Using mock conversation data as fallback');
        const mockConversations: Conversation[] = [
          {
            id: 'mock-1',
            participants: [user.id, 'system'],
            title: 'Support',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastMessageId: 'mock-msg-1',
            unreadCount: { [user.id]: 0 },
            type: 'direct' as const
          }
        ];
        setConversations(mockConversations);
      } catch (error) {
        console.error('❌ Error fetching conversations:', error);
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fetch messages
    const fetchMessages = async () => {
      try {
        // Add auth headers
        const headers = {
          'Content-Type': 'application/json',
          'user-id': user.id,
          'user-role': user.role,
          'user-profile-id': user.profileId || ''
        };
        
        console.log('🔍 Fetching messages with headers:', headers);
        
        // Try primary endpoint
        try {
          const response = await fetch('/api/data/messages', {
            headers
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Fetched messages:', data.length);
            setMessages(data);
            return;
          }
        } catch (primaryError) {
          console.warn('⚠️ Error with primary messages endpoint:', primaryError);
        }
        
        // Try backup endpoint
        try {
          const backupResponse = await fetch('/api/messages', {
            headers
          });
          
          if (backupResponse.ok) {
            const backupData = await backupResponse.json();
            console.log('✅ Fetched messages from backup endpoint:', backupData.length);
            setMessages(backupData);
            return;
          }
        } catch (backupError) {
          console.warn('⚠️ Error with backup messages endpoint:', backupError);
        }
        
        // If all fails, set empty or mock data
        console.log('⚠️ Using mock message data as fallback');
        const mockMessages: Message[] = [
          {
            id: 'mock-msg-1',
            conversationId: 'mock-1',
            senderId: 'system',
            content: 'Welcome to WanderPaws! How can we help?',
            timestamp: new Date().toISOString(),
            readStatus: 'read' as const
          }
        ];
        setMessages(mockMessages);
      } catch (error) {
        console.error('❌ Error fetching messages:', error);
        setMessages([]);
      }
    };
    
    fetchConversations();
    fetchMessages();
  }, [user]);
  
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
    if (!messageIds.length) return;
    
    try {
      // Update state first for immediate UI response
      setMessages(prev => 
        prev.map(msg => 
          messageIds.includes(msg.id) 
            ? { ...msg, readStatus: 'read' } 
            : msg
        )
      );

      // Make API call to update on the server
      const response = await fetch('/api/data/messages/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id || '',
          'user-role': user?.role || '',
          'user-profile-id': user?.profileId || ''
        },
        body: JSON.stringify({ messageIds }),
      });

      if (!response.ok) {
        console.warn('Failed to update message read status on server:', await response.text());
      } else {
        console.log('Marked messages as read on server:', messageIds);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      // Don't throw the error as we've already updated the UI
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
        currentConversation,
        setCurrentConversation,
        isLoading,
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