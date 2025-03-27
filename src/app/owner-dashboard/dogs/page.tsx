'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { useOwnerDogs } from '@/lib/hooks/useDogData';
import DogCard from '@/components/dogs/DogCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Dog } from '@/lib/types';

export default function DogsPage() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  // Use React Query for data fetching
  const { data: dogs, isLoading, error: fetchError } = useOwnerDogs(user?.profileId);
  
  useEffect(() => {
    if (fetchError) {
      console.error('Error fetching dogs:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load dogs');
    }
  }, [fetchError]);

  if (isLoading || !user?.profileId) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Error</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
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

        {(!dogs || dogs.length === 0) ? (
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