'use client';

import React from 'react';
import { Message as MessageType } from '@/lib/types';
import { format } from 'date-fns';

interface MessageProps {
  message: MessageType;
  isOwnMessage: boolean;
}

export default function Message({ message, isOwnMessage }: MessageProps) {
  const formattedTime = format(new Date(message.timestamp), 'h:mm a');
  
  // Get sender name
  const getSenderName = () => {
    // Return a placeholder until real user service is implemented
    return message.senderId || 'Unknown User';
  };
  
  // Determine if the message has any attachments
  const hasAttachments = message.attachments && message.attachments.length > 0;
  
  const renderAttachment = () => {
    if (!message.attachments || message.attachments.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-2">
        {message.attachments.map(attachment => (
          <div key={attachment.id} className="rounded-lg overflow-hidden border border-gray-200">
            {attachment.type === 'image' ? (
              <div className="max-w-xs">
                <img 
                  src={attachment.url} 
                  alt={attachment.name}
                  className="w-full h-auto object-cover"
                />
                <div className="p-2 bg-gray-50 text-xs text-gray-500">
                  {attachment.name}
                </div>
              </div>
            ) : attachment.type === 'audio' ? (
              <div className="p-2 bg-white">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <span className="text-sm">{attachment.name}</span>
                </div>
                <audio controls className="mt-2 w-full">
                  <source src={attachment.url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : (
              <div className="p-3 bg-white">
                <a 
                  href={attachment.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm font-medium">{attachment.name}</span>
                </a>
                <span className="block mt-1 text-xs text-gray-500">
                  {(attachment.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'bg-primary-50 text-gray-900' : 'bg-white text-gray-900'} rounded-lg px-4 py-2 shadow-sm`}>
        {!isOwnMessage && (
          <div className="mb-1">
            <span className="text-xs font-medium text-gray-900">{getSenderName()}</span>
          </div>
        )}
        
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>
        
        {renderAttachment()}
        
        <div className="mt-1 text-right">
          <span className="text-xs text-gray-500">
            {formattedTime} {message.readStatus === 'read' && isOwnMessage && '✓'}
          </span>
        </div>
      </div>
    </div>
  );
} 