'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/AuthContext';
import { useWalkerDogs } from '@/lib/hooks/useWalkerHooks';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Dog } from '@/lib/types';

export default function DogsPage() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  // Use React Query hook for data fetching
  const { 
    data: dogs = [], 
    isPending: isLoading, 
    error: fetchError,
    refetch: refetchDogs
  } = useWalkerDogs();
  
  console.log('WalkerDogsPage - Current user:', user);
  console.log('WalkerDogsPage - Dogs data:', dogs);
  
  // Force refetch when component mounts
  useEffect(() => {
    if (user && user.profileId) {
      console.log('WalkerDogsPage - Forcing refetch on mount');
      refetchDogs();
    }
  }, [user, refetchDogs]);
  
  // Handle fetch errors
  useEffect(() => {
    if (fetchError) {
      console.error('Error fetching dogs:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load dogs');
    }
  }, [fetchError]);
  
  // Calculate if we have dogs to display
  const hasDogs = Array.isArray(dogs) && dogs.length > 0;
  const dogsArray = Array.isArray(dogs) ? dogs : [];
  
  console.log('WalkerDogsPage - Has dogs:', hasDogs, 'Count:', dogsArray.length);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Dogs</h1>
        <button
          onClick={() => refetchDogs()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {!hasDogs ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-600">No dogs assigned to you yet.</p>
          <p className="text-gray-500 mt-2">Dogs will appear here after you are assigned to walk them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dogsArray.map((dog: Dog) => (
            <div key={dog.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="relative h-48 w-full">
                {dog.imageUrl ? (
                  <Image
                    src={dog.imageUrl}
                    alt={dog.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xl">No image</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900">{dog.name}</h2>
                <p className="text-sm text-gray-500">{dog.breed}</p>
                <p className="text-sm text-gray-500 mt-1">Age: {dog.age} {dog.age === 1 ? 'year' : 'years'}</p>
                <div className="mt-4">
                  <Link 
                    href={`/walker-dashboard/dogs/${dog.id}`} 
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


