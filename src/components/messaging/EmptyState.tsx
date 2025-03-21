'use client';

import React, { useState } from 'react';
import NewConversation from './NewConversation';

export default function EmptyState() {
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
      <div className="text-center max-w-md">
        <svg
          className="h-24 w-24 mx-auto text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Your messages
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Select a conversation from the sidebar or start a new conversation to begin messaging.
        </p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowNewConversationModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Start a new conversation
          </button>
        </div>
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