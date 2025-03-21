'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConversationList from '@/components/messaging/ConversationList';
import MessagePanel from '@/components/messaging/MessagePanel';
import { useMessages } from '@/lib/MessageContext';
import RouteGuard from '@/components/RouteGuard';
import EmptyState from '@/components/messaging/EmptyState';

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversation');
  
  const { 
    conversations, 
    currentConversation, 
    setCurrentConversation, 
    isLoading 
  } = useMessages();

  // Set the current conversation based on the URL parameter
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
      } else if (conversations.length > 0) {
        // If the specified conversation doesn't exist, redirect to the first conversation
        router.replace(`/messages?conversation=${conversations[0].id}`);
      }
    } else if (conversations.length > 0 && !conversationId) {
      // If no conversation is specified, redirect to the first conversation
      router.replace(`/messages?conversation=${conversations[0].id}`);
    }
  }, [conversationId, conversations, router, setCurrentConversation]);

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'messages' }}>
      <div className="h-full flex flex-col">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden bg-gray-50">
          {/* Sidebar for conversation list */}
          <div className="w-80 border-r border-gray-200 bg-white flex-shrink-0 overflow-y-auto">
            <ConversationList
              conversations={conversations}
              currentConversationId={currentConversation?.id}
              isLoading={isLoading}
            />
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {currentConversation ? (
              <MessagePanel conversation={currentConversation} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 