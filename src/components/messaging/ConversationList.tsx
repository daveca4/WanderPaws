'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Conversation, User } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { getUsersByIds } from '@/lib/userService';
import { useAuth } from '@/lib/AuthContext';
import NewConversation from './NewConversation';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId?: string;
  isLoading: boolean;
}

export default function ConversationList({
  conversations,
  currentConversationId,
  isLoading,
}: ConversationListProps) {
  const { user } = useAuth();
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [participantUsers, setParticipantUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch users data for all participants
  useEffect(() => {
    const fetchParticipantUsers = async () => {
      if (conversations.length === 0) return;
      
      // Get unique participant IDs from all conversations
      const participantIds = Array.from(new Set(
        conversations.flatMap(conv => conv.participants)
      ));
      
      if (participantIds.length === 0) return;
      
      try {
        setLoadingUsers(true);
        const users = await getUsersByIds(participantIds);
        setParticipantUsers(users);
      } catch (error) {
        console.error('Error fetching participant users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchParticipantUsers();
  }, [conversations]);

  // Helper function to get participants excluding current user
  const getOtherParticipants = (conversation: Conversation) => {
    if (!user) return [];
    return conversation.participants.filter(id => id !== user.id);
  };

  // Helper function to get user by ID
  const getUserById = (userId: string): User | undefined => {
    return participantUsers.find(u => u.id === userId);
  };

  // Helper function to get conversation title
  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;
    
    const otherParticipants = getOtherParticipants(conversation);
    if (otherParticipants.length === 0) return 'Conversation';
    
    const names = otherParticipants.map(id => {
      const participant = getUserById(id);
      if (!participant) return 'Unknown User';
      
      // Get the participant's display name
      return participant.name || participant.email.split('@')[0];
    });
    
    return names.join(', ');
  };

  // Helper function to get conversation subtitle (last message excerpt)
  const getConversationSubtitle = (conversation: Conversation) => {
    // This would normally fetch the last message from an API
    // For now, just return a placeholder
    return 'Click to view conversation';
  };

  // Helper function to get unread count for current user
  const getUnreadCount = (conversation: Conversation) => {
    if (!user || !conversation.unreadCount) return 0;
    return conversation.unreadCount[user.id] || 0;
  };

  if (isLoading || loadingUsers) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-4">
              <div className="rounded-full bg-gray-300 h-12 w-12"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No conversations yet</p>
        <button 
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          onClick={() => setShowNewConversationModal(true)}
        >
          Start a new conversation
        </button>

        {showNewConversationModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
                onClick={() => setShowNewConversationModal(false)}
              ></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              {/* Modal panel */}
              <div 
                className="inline-block align-bottom sm:align-middle sm:max-w-lg sm:w-full relative z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <NewConversation onClose={() => setShowNewConversationModal(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* New conversation button */}
      <div className="px-4 py-3 border-b border-gray-200">
        <button
          onClick={() => setShowNewConversationModal(true)}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Conversation
        </button>
      </div>

      {/* Conversation list */}
      <div className="divide-y divide-gray-200">
        {conversations.map(conversation => {
          const isActive = conversation.id === currentConversationId;
          const unreadCount = getUnreadCount(conversation);
          const updatedAt = formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true });
          
          return (
            <Link
              key={conversation.id}
              href={`/messages?conversation=${conversation.id}`}
              className={`block p-4 hover:bg-gray-50 ${isActive ? 'bg-primary-50' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getConversationTitle(conversation)}
                  </p>
                  <p className={`text-sm ${unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-500'} truncate`}>
                    {getConversationSubtitle(conversation)}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <p className="text-xs text-gray-500">{updatedAt}</p>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary-600 text-xs font-medium text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* New conversation modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={() => setShowNewConversationModal(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal panel */}
            <div 
              className="inline-block align-bottom sm:align-middle sm:max-w-lg sm:w-full relative z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <NewConversation onClose={() => setShowNewConversationModal(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 