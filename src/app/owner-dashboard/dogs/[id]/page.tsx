'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import RouteGuard from '@/components/RouteGuard';
import { useDog, useDeleteDog } from '@/lib/hooks/useDogData';

export default function DogDetailsPage() {
  const params = useParams();
  const dogId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  
  // Use React Query for data fetching
  const { data: dog, isLoading, error: fetchError } = useDog(dogId);
  const deleteDogMutation = useDeleteDog();
  
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (!dogId) return;
    
    setIsDeleting(true);
    setError('');
    
    try {
      await deleteDogMutation.mutateAsync(dogId);
      router.push('/owner-dashboard/dogs');
    } catch (err) {
      console.error("Error deleting dog:", err);
      setError('Failed to delete dog');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (fetchError || !dog) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Error</h2>
        <p className="text-gray-500 mb-4">
          {fetchError instanceof Error ? fetchError.message : "Failed to load dog details"}
        </p>
        <Link
          href="/owner-dashboard/dogs"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Back to My Dogs
        </Link>
      </div>
    );
  }

  return (
    <RouteGuard requiredPermission={{ action: 'view', resource: 'dogs' }}>
      <div className="space-y-6">
        {/* Top section with navigation */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{dog.name}</h1>
            <p className="text-sm text-gray-500">
              {dog.breed} • {dog.age} years old • {dog.size.charAt(0).toUpperCase() + dog.size.slice(1)} Size
            </p>
          </div>
          <div className="flex space-x-3">
            <Link 
              href={`/owner-dashboard/dogs/${dogId}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Edit Dog
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Delete
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Dog Image */}
            <div className="md:w-1/3 h-64 md:h-auto relative bg-gray-200">
              {dog.imageUrl ? (
                <Image 
                  src={dog.imageUrl} 
                  alt={dog.name} 
                  fill 
                  className="object-cover"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = '/dog-placeholder.png';
                  }}
                />
              ) : (
                <Image 
                  src="/dog-placeholder.png" 
                  alt="Dog placeholder" 
                  fill 
                  className="object-cover"
                />
              )}
            </div>
            
            {/* Dog Details */}
            <div className="p-6 md:w-2/3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Temperament */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-3">Temperament</h2>
                  {dog.temperament && dog.temperament.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {dog.temperament.map((trait: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No temperament traits added yet</p>
                  )}
                </div>
                
                {/* Special Needs */}
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-3">Special Needs</h2>
                  {dog.specialNeeds && dog.specialNeeds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {dog.specialNeeds.map((need: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800"
                        >
                          {need}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No special needs</p>
                  )}
                </div>
                
                {/* Address */}
                <div className="md:col-span-2">
                  <h2 className="text-lg font-medium text-gray-900 mb-3">Address</h2>
                  {dog.address ? (
                    <address className="not-italic text-gray-700">
                      {dog.address.street}<br />
                      {dog.address.city}, {dog.address.state} {dog.address.zip}
                    </address>
                  ) : (
                    <p className="text-gray-500 italic">No address added yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scheduled walks section would go here */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Scheduled Walks</h2>
          <p className="text-gray-500">No walks scheduled for {dog.name} yet.</p>
          <div className="mt-4">
            <Link
              href={`/owner-dashboard/schedule-walk?dogId=${dog.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Schedule a Walk
            </Link>
          </div>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Delete {dog.name}</h3>
            <p className="text-gray-500 mb-4">
              Are you sure you want to delete {dog.name}? This action cannot be undone, and you'll lose all associated walk history.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || deleteDogMutation.isLoading}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting || deleteDogMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </RouteGuard>
  );
} 