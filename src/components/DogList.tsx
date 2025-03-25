import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { Dog, Owner, Walk } from '@/lib/types';

export function DogList() {
  const { user } = useAuth();
  const { dogs, owners, walks } = useData();
  
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

  if (filteredDogs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dogs</h2>
        <div className="text-gray-500 text-center py-4">
          {user?.role === 'owner' 
            ? "You don't have any dogs yet. Add your first dog to get started."
            : "No dogs found."}
        </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredDogs.map(dog => {
          const dogOwner = owners.find(owner => owner.id === dog.ownerId);
          const dogImage = dog.profileImage || dog.imageUrl;
          
          return (
            <Link href={`/dogs/${dog.id}`} key={dog.id} className="group">
              <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
                {dogImage ? (
                  <div className="aspect-square relative">
                    <Image 
                      src={dogImage} 
                      alt={dog.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-200 flex items-center justify-center">
                    <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm9-7h-1V7c0-1.1-.9-2-2-2h-4c0-1.1-.9-2-2-2s-2 .9-2 2H5C3.9 5 3 5.9 3 7v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zM5 19V7h14v12H5z"/>
                    </svg>
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 group-hover:text-primary-600 transition">{dog.name}</h3>
                  <p className="text-sm text-gray-500">{dog.breed}, {dog.age} year{dog.age !== 1 && 's'} old</p>
                  {dogOwner && (
                    <p className="text-xs text-gray-500 mt-1">
                      Owner: {dogOwner.name}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 