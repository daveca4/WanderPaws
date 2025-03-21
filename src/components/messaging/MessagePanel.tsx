'use client';

import { useState, useRef, useEffect } from 'react';
import { Conversation, Message as MessageType, MessageAttachment } from '@/lib/types';
import { useMessages } from '@/lib/MessageContext';
import { useAuth } from '@/lib/AuthContext';
import { mockUsers } from '@/lib/mockUsers';
import { format } from 'date-fns';
import Message from './Message';

interface MessagePanelProps {
  conversation: Conversation;
}

export default function MessagePanel({ conversation }: MessagePanelProps) {
  const { messages, sendMessage } = useMessages();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get conversation title (group name or participant names)
  const getConversationTitle = () => {
    if (conversation.title) return conversation.title;
    
    if (user) {
      const otherParticipantIds = conversation.participants.filter(id => id !== user.id);
      const otherParticipants = otherParticipantIds.map(id => {
        const participant = mockUsers.find(u => u.id === id);
        return participant ? participant.email.split('@')[0] : 'Unknown User';
      });
      
      return otherParticipants.join(', ');
    }
    
    return 'Conversation';
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() && attachments.length === 0) return;
    
    setIsSending(true);
    
    try {
      await sendMessage(messageText, attachments.length > 0 ? attachments : undefined);
      setMessageText('');
      setAttachments([]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newAttachments: MessageAttachment[] = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substring(2, 11),
        name: file.name,
        size: file.size,
        type: file.type.startsWith('image/') 
          ? 'image' 
          : file.type.startsWith('audio/') 
            ? 'audio' 
            : 'document',
        url: URL.createObjectURL(file),
      }));
      
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const renderAttachmentPreview = () => {
    if (attachments.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {attachments.map(attachment => (
          <div key={attachment.id} className="relative">
            {attachment.type === 'image' ? (
              <div className="h-16 w-16 rounded overflow-hidden bg-gray-100">
                <img 
                  src={attachment.url} 
                  alt={attachment.name} 
                  className="h-full w-full object-cover" 
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
            <button
              onClick={() => removeAttachment(attachment.id)}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            {getConversationTitle()}
          </h2>
          <p className="text-sm text-gray-500">
            {conversation.type === 'group' ? `${conversation.participants.length} members` : 'Direct message'}
          </p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400">Be the first to send a message!</p>
          </div>
        ) : (
          messages.map(message => (
            <Message 
              key={message.id} 
              message={message} 
              isOwnMessage={user?.id === message.senderId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <div className="px-4 py-3 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage}>
          {renderAttachmentPreview()}
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <textarea
                className="block w-full rounded-lg border border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2"
                placeholder="Type your message..."
                rows={1}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={triggerFileInput}
              className="inline-flex items-center p-2 rounded-full text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            <button
              type="submit"
              disabled={isSending || (!messageText.trim() && attachments.length === 0)}
              className="inline-flex items-center p-2 rounded-full text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 