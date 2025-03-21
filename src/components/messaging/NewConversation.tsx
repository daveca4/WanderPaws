'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMessages } from '@/lib/MessageContext';
import { useAuth } from '@/lib/AuthContext';
import { mockUsers } from '@/lib/mockUsers';
import { mockOwners, mockWalkers, mockWalks } from '@/lib/mockData';
import { User } from '@/lib/types';

export default function NewConversation({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { createConversation } = useMessages();
  const { user: currentUser } = useAuth();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get allowed recipients based on user role
  const getAllowedRecipients = () => {
    if (!currentUser) return [];

    // Admin can message everyone
    if (currentUser.role === 'admin') {
      return mockUsers;
    }

    // Owner can only message admins or walkers assigned to them
    if (currentUser.role === 'owner') {
      // Get owner's profile
      const owner = mockOwners.find(o => {
        const user = mockUsers.find(u => u.id === currentUser.id);
        return user && o.id === user.profileId;
      });
      
      if (!owner) return mockUsers.filter(u => u.role === 'admin');

      // Find walkers assigned to owner's dogs
      const assignedWalkerIds = new Set<string>();
      mockWalks.forEach(walk => {
        if (owner.dogs.includes(walk.dogId)) {
          const walker = mockWalkers.find(w => w.id === walk.walkerId);
          if (walker) {
            const walkerUser = mockUsers.find(u => u.profileId === walker.id);
            if (walkerUser) assignedWalkerIds.add(walkerUser.id);
          }
        }
      });

      // Return admins and assigned walkers
      return mockUsers.filter(
        u => u.role === 'admin' || (u.role === 'walker' && assignedWalkerIds.has(u.id))
      );
    }

    // Walker can only message admins or owners assigned to them
    if (currentUser.role === 'walker') {
      // Get walker's profile
      const walker = mockWalkers.find(w => {
        const user = mockUsers.find(u => u.id === currentUser.id);
        return user && w.id === user.profileId;
      });
      
      if (!walker) return mockUsers.filter(u => u.role === 'admin');

      // Find owners whose dogs are walked by this walker
      const assignedOwnerIds = new Set<string>();
      mockWalks.forEach(walk => {
        if (walk.walkerId === walker.id) {
          // Find the dog's owner
          const dogOwner = mockOwners.find(owner => 
            owner.dogs.includes(walk.dogId)
          );
          
          if (dogOwner) {
            const ownerUser = mockUsers.find(u => u.profileId === dogOwner.id);
            if (ownerUser) assignedOwnerIds.add(ownerUser.id);
          }
        }
      });

      // Return admins and assigned owners
      return mockUsers.filter(
        u => u.role === 'admin' || (u.role === 'owner' && assignedOwnerIds.has(u.id))
      );
    }

    return [];
  };

  // Filter users based on search query and permissions
  const filteredUsers = getAllowedRecipients().filter(user => {
    // Exclude current user
    if (user.id === currentUser?.id) return false;
    
    if (searchQuery.trim() === '') return true;
    
    // Get user's full name from profile if available
    const userName = getUserDisplayName(user);
    
    return (
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Get display name from user profile
  const getUserDisplayName = (user: User): string => {
    if (user.role === 'admin') {
      return 'Admin';
    } else if (user.role === 'owner') {
      const owner = mockOwners.find(o => o.id === user.profileId);
      return owner ? owner.name : user.email.split('@')[0];
    } else if (user.role === 'walker') {
      const walker = mockWalkers.find(w => w.id === user.profileId);
      return walker ? walker.name : user.email.split('@')[0];
    }
    return user.email.split('@')[0];
  };

  // Handle user selection
  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      
      // If we now have less than 2 users, disable group chat option
      if (selectedUsers.length <= 2) {
        setIsGroup(false);
      }
    } else {
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  // Handle conversation creation
  const handleCreateConversation = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (selectedUsers.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    if (isGroup && !groupTitle.trim()) {
      setError('Please provide a title for the group conversation');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const conversation = await createConversation(
        selectedUsers,
        isGroup ? groupTitle : undefined
      );

      if (conversation) {
        // Redirect to the new conversation
        router.push(`/messages?conversation=${conversation.id}`);
        onClose();
      } else {
        setError('Failed to create conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Render user item with checkbox
  const renderUserItem = (user: User) => {
    const isSelected = selectedUsers.includes(user.id);
    const displayName = getUserDisplayName(user);

    return (
      <div 
        key={user.id}
        className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-primary-50' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleUserSelection(user.id);
        }}
      >
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
        </div>
        <div className="ml-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              toggleUserSelection(user.id);
            }}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full" onClick={(e) => e.stopPropagation()}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">New Conversation</h2>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          <span className="sr-only">Close</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        {/* Search input */}
        <div className="mb-4">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Find Recipients
          </label>
          <input
            type="text"
            id="search"
            placeholder="Search by name or role"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>

        {/* Group chat option */}
        {selectedUsers.length >= 2 && (
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="group-chat"
              checked={isGroup}
              onChange={(e) => {
                e.stopPropagation();
                setIsGroup(e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="group-chat" className="ml-2 block text-sm text-gray-700">
              Create group conversation
            </label>
          </div>
        )}

        {/* Group title input */}
        {isGroup && (
          <div className="mb-4">
            <label htmlFor="group-title" className="block text-sm font-medium text-gray-700 mb-1">
              Group Title
            </label>
            <input
              type="text"
              id="group-title"
              placeholder="Enter a title for your group"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        )}

        {/* Users list */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Recipients
          </label>
          <div className="border border-gray-300 rounded-md h-60 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredUsers.map(renderUserItem)}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-sm">No recipients available</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Selected users count */}
        <div className="mt-2 text-sm text-gray-500">
          {selectedUsers.length} recipient{selectedUsers.length !== 1 ? 's' : ''} selected
        </div>

        {/* Create button */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateConversation}
            disabled={isCreating || selectedUsers.length === 0}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Conversation'}
          </button>
        </div>
      </div>
    </div>
  );
} 