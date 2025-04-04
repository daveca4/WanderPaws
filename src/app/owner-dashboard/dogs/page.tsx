'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import { useOwnerDogs, useEnsureOwnerProfile } from '@/lib/hooks/useDataHooks';
import DogCard from '@/components/dogs/DogCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Dog } from '@/lib/types';

// Interface for the dogs data response structure
interface DogsResponse {
  data?: Dog[];
}

export default function DogsPage() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  // Use React Query hook for data fetching
  const { 
    data: dogs = [], 
    isPending, 
    error: fetchError,
    refetch
  } = useOwnerDogs();
  
  console.log('DogsPage - Current user:', user);
  console.log('DogsPage - Dogs data:', dogs);
  
  // Owner profile creation mutation
  const {
    mutate: ensureOwnerProfile,
    isPending: isCreatingProfile,
    isSuccess: profileCreated,
    error: profileError
  } = useEnsureOwnerProfile();
  
  // Force refetch when component mounts
  useEffect(() => {
    if (user && user.profileId) {
      console.log('DogsPage - Forcing refetch on mount');
      refetch();
    }
  }, [user, refetch]);
  
  // Handle fetch errors
  useEffect(() => {
    if (fetchError) {
      console.error('Error fetching dogs:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load dogs');
    }
  }, [fetchError]);
  
  // Handle profile creation success
  useEffect(() => {
    if (profileCreated) {
      // Refetch dogs after profile is created
      console.log('Profile created, refetching dogs');
      refetch();
    }
  }, [profileCreated, refetch]);
  
  // Calculate if we have dogs to display
  const hasDogs = Array.isArray(dogs) && dogs.length > 0;
  const dogsArray = Array.isArray(dogs) ? dogs : [];
  
  console.log('DogsPage - Has dogs:', hasDogs, 'Count:', dogsArray.length);
  
  // If no profile exists, offer to create one
  const handleCreateProfile = () => {
    if (user) {
      ensureOwnerProfile({
        name: user.name || '',
        email: user.email || ''
      } as any); // Type cast to any to avoid type error
    }
  };

  if (isPending || !user) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!user.profileId && !isCreatingProfile) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">No Owner Profile Found</h2>
        <p className="text-gray-500 mb-4">You need to create an owner profile before you can add dogs.</p>
        <button
          onClick={handleCreateProfile}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          {isCreatingProfile ? 'Creating Profile...' : 'Create Owner Profile'}
        </button>
      </div>
    );
  }

  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'dogs' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Dogs</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              title="Toggle debug panel"
            >
              {showDebug ? 'Hide Debug' : 'Debug'}
            </button>
            <Link 
              href="/owner-dashboard/dogs/add" 
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Add New Dog
            </Link>
          </div>
        </div>
        
        {/* Debug Panel */}
        {showDebug && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Information</h3>
            <div className="space-y-2 text-xs">
              <div>
                <strong>User:</strong> 
                <pre className="mt-1 bg-white p-2 rounded overflow-auto max-h-24">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Dogs Data:</strong> 
                <pre className="mt-1 bg-white p-2 rounded overflow-auto max-h-48">
                  {JSON.stringify(dogs, null, 2)}
                </pre>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => refetch()}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Refetch Dogs
                </button>
                <button
                  onClick={handleCreateProfile}
                  className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Refresh Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {hasDogs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dogsArray.map((dog: Dog) => (
              <DogCard key={dog.id} dog={dog} />
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h2 className="text-lg font-medium text-gray-900 mb-2">No Dogs Added Yet</h2>
            <p className="text-gray-500 mb-4">Add your first dog to get started with scheduling walks!</p>
            <Link
              href="/owner-dashboard/dogs/add"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Add Your First Dog
            </Link>
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 