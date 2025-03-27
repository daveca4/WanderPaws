import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { Dog, Owner, Walk } from '@/lib/types';
import S3Image from '@/components/S3Image';

export function DogList() {
  const { user } = useAuth();
  const { dogs, owners, walks, refreshData, deleteDog } = useData();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // If user is an owner, show only their dogs
  // If user is a walker, show dogs they've walked
  // If user is admin, show all dogs
  let filteredDogs = dogs;
  
  if (user) {
    if (user.role === 'owner' && user.profileId) {
      filteredDogs = dogs.filter(dog => dog.ownerId === user.profileId);
    } else if (user.role === 'walker' && user.profileId) {
      // Get all walks for this walker
      const walkerWalks = walks.filter(walk => walk.walkerId === user.profileId);
      // Get unique dog IDs from those walks
      const dogIds = Array.from(new Set(walkerWalks.map(walk => walk.dogId)));
      // Filter dogs by those IDs
      filteredDogs = dogs.filter(dog => dogIds.includes(dog.id));
    }
  }

  const handleDeleteDog = async (dogId: string, e: React.MouseEvent) => {
    e.preventDefault(); // Stop event propagation to prevent navigation
    e.stopPropagation(); // Ensure the event doesn't bubble up
    
    if (!confirm('Are you sure you want to delete this dog? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(dogId);
      setDeleteError(null);
      
      // Get the dog's name for the success message
      const dogToDelete = dogs.find(dog => dog.id === dogId);
      
      // Attempt to delete the dog
      const success = await deleteDog(dogId);
      
      if (!success) {
        throw new Error(`Failed to delete ${dogToDelete?.name || 'dog'}. Please try again.`);
      }
      
      // Success notification could be handled here if you want to show a success message
      
    } catch (error) {
      console.error('Error deleting dog:', error);
      
      // More user-friendly error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred while trying to delete the dog. Please try again.';
      
      setDeleteError(errorMessage);
      
      // If deletion failed, refresh to get accurate data
      await refreshData();
    } finally {
      setIsDeleting(null);
    }
  };

  if (filteredDogs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dogs</h2>
        <div className="text-gray-500 text-center py-4">
          {user?.role === 'owner' 
            ? "You don't have any dogs yet. Add your first dog to get started."
            : "No dogs found."}
        </div>
        
        {deleteError && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {deleteError}
          </div>
        )}
        
        {user?.role === 'owner' && (
          <div className="mt-4 text-center">
            <Link 
              href="/owner-dashboard/dogs/add" 
              className="inline-block px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
            >
              Add Your First Dog
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Dogs</h2>
        {user?.role === 'owner' && (
          <Link 
            href="/owner-dashboard/dogs/add" 
            className="text-sm px-3 py-1 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
          >
            Add Dog
          </Link>
        )}
      </div>
      
      {deleteError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {deleteError}
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredDogs.map(dog => {
          const dogOwner = owners.find(owner => owner.id === dog.ownerId);
          const dogImage = dog.profileImage || dog.imageUrl;
          const isOwner = user?.role === 'owner' && user?.profileId === dog.ownerId;
          
          return (
            <div key={dog.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
              <Link href={`/dogs/${dog.id}`} className="group">
                <div className="aspect-square relative">
                  <S3Image 
                    src={dogImage} 
                    alt={dog.name}
                    fill
                    className="object-cover"
                    defaultImage="/images/default-dog.png"
                    priority={true}
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition">{dog.name}</h3>
                  <p className="text-sm text-gray-500">{dog.breed}, {dog.age} year{dog.age !== 1 && 's'} old</p>
                  {dogOwner && (
                    <p className="text-xs text-gray-500 mt-1">
                      Owner: {dogOwner.name}
                    </p>
                  )}
                </div>
              </Link>
              
              {isOwner && (
                <div className="px-3 pb-3 mt-1 flex justify-end">
                  <button
                    onClick={(e) => handleDeleteDog(dog.id, e)}
                    disabled={isDeleting === dog.id}
                    className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition"
                    aria-label={`Delete ${dog.name}`}
                  >
                    {isDeleting === dog.id ? 'Deleting...' : 'Remove Dog'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 