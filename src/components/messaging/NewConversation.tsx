'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMessages } from '@/lib/MessageContext';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { User } from '@/lib/types';
import { getWalksByDogId, getWalksByWalkerId } from '@/utils/dataHelpers';

export default function NewConversation({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { createConversation } = useMessages();
  const { user: currentUser } = useAuth();
  const { owners, walkers, walks, dogs } = useData();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch users based on role
  useEffect(() => {
    async function fetchAllowedUsers() {
      if (!currentUser) return;
      setIsLoading(true);
      
      try {
        // For admins, get all users
        if (currentUser.role === 'admin') {
          const response = await fetch('/api/users');
          if (response.ok) {
            const data = await response.json();
            setAvailableUsers(data.users.filter((u: User) => u.id !== currentUser.id));
          }
        } 
        // For owners, get admins and assigned walkers
        else if (currentUser.role === 'owner') {
          const owner = owners.find(o => o.userId === currentUser.id);
          
          if (owner) {
            // Get admin users
            const adminResponse = await fetch('/api/users?role=admin');
            let adminUsers: User[] = [];
            
            if (adminResponse.ok) {
              const adminData = await adminResponse.json();
              adminUsers = adminData.users;
            }
            
            // Find assigned walkers
            const ownerDogs = dogs.filter(dog => dog.ownerId === owner.id);
            const assignedWalkerIds = new Set<string>();
            
            ownerDogs.forEach(dog => {
              const dogWalks = getWalksByDogId(walks, dog.id);
              dogWalks.forEach(walk => {
                assignedWalkerIds.add(walk.walkerId);
              });
            });
            
            if (assignedWalkerIds.size > 0) {
              // Fetch walker users
              const walkerResponse = await fetch(`/api/users?walkerIds=${Array.from(assignedWalkerIds).join(',')}`);
              if (walkerResponse.ok) {
                const walkerData = await walkerResponse.json();
                setAvailableUsers([...adminUsers, ...walkerData.users].filter(u => u.id !== currentUser.id));
              } else {
                setAvailableUsers(adminUsers.filter(u => u.id !== currentUser.id));
              }
            } else {
              setAvailableUsers(adminUsers.filter(u => u.id !== currentUser.id));
            }
          }
        } 
        // For walkers, get admins and assigned owners
        else if (currentUser.role === 'walker') {
          const walker = walkers.find(w => w.userId === currentUser.id);
          
          if (walker) {
            // Get admin users
            const adminResponse = await fetch('/api/users?role=admin');
            let adminUsers: User[] = [];
            
            if (adminResponse.ok) {
              const adminData = await adminResponse.json();
              adminUsers = adminData.users;
            }
            
            // Find assigned owners
            const walkerWalks = getWalksByWalkerId(walks, walker.id);
            const assignedOwnerIds = new Set<string>();
            
            walkerWalks.forEach(walk => {
              const dog = dogs.find(d => d.id === walk.dogId);
              if (dog) {
                assignedOwnerIds.add(dog.ownerId);
              }
            });
            
            if (assignedOwnerIds.size > 0) {
              // Fetch owner users
              const ownerResponse = await fetch(`/api/users?ownerIds=${Array.from(assignedOwnerIds).join(',')}`);
              if (ownerResponse.ok) {
                const ownerData = await ownerResponse.json();
                setAvailableUsers([...adminUsers, ...ownerData.users].filter(u => u.id !== currentUser.id));
              } else {
                setAvailableUsers(adminUsers.filter(u => u.id !== currentUser.id));
              }
            } else {
              setAvailableUsers(adminUsers.filter(u => u.id !== currentUser.id));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAllowedUsers();
  }, [currentUser, owners, walkers, walks, dogs]);

  // Filter users based on search query
  const filteredUsers = availableUsers.filter(user => {
    if (searchQuery.trim() === '') return true;
    
    return (
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-900">{user.name || 'Unknown User'}</p>
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