'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { useOwnerDogs, useEnsureOwnerProfile } from '@/lib/hooks/useDataHooks';
import DogCard from '@/components/dogs/DogCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Dog } from '@/lib/types';

export default function DogsPage() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  // Use React Query hook for data fetching
  const { 
    data: dogs = [], 
    isLoading, 
    error: fetchError,
    refetch
  } = useOwnerDogs();
  
  // Owner profile creation mutation
  const {
    mutate: ensureOwnerProfile,
    isLoading: isCreatingProfile,
    isSuccess: profileCreated,
    error: profileError
  } = useEnsureOwnerProfile();
  
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
      refetch();
    }
  }, [profileCreated, refetch]);
  
  // If no profile exists, offer to create one
  const handleCreateProfile = () => {
    ensureOwnerProfile({});
  };

  if (isLoading || !user) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }
  
  // If we have no owner profile, show a helpful message
  if (error && error.includes('owner profile not found')) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Owner Profile Required</h2>
        <p className="text-gray-500 mb-4">You need to set up your owner profile before adding dogs.</p>
        <button
          onClick={handleCreateProfile}
          disabled={isCreatingProfile}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
        >
          {isCreatingProfile ? 'Setting up profile...' : 'Set Up Owner Profile'}
        </button>
        {profileError && (
          <p className="mt-2 text-red-500 text-sm">
            {profileError instanceof Error ? profileError.message : 'Error creating profile'}
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Error</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'dogs' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Dogs</h1>
          <Link 
            href="/owner-dashboard/dogs/add" 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Add New Dog
          </Link>
        </div>

        {dogs.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dogs.map((dog: Dog) => (
              <DogCard key={dog.id} dog={dog} />
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 