'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { getDogsByOwnerId } from '@/lib/dbOperations';

export default function DogsPage() {
  const [dogs, setDogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDogs = async () => {
      try {
        if (!user) {
          return;
        }

        // For walkers, fetch dogs assigned to them
        if (user.role === 'walker') {
          console.log('Fetching dogs for walker');
          
          // First check if the user object already has walkerId (from current-user API)
          let walkerId = (user as any).walkerId;
          
          // If not, try to get it from the current-user API
          if (!walkerId) {
            try {
              const response = await fetch('/api/auth/current-user');
              if (response.ok) {
                const userData = await response.json();
                console.log('Current user data from API:', userData);
                walkerId = userData.walkerId;
              }
            } catch (error) {
              console.error('Error fetching current user data:', error);
            }
          }
          
          if (walkerId) {
            const response = await fetch(`/api/walkers/${walkerId}/dogs`);
            if (response.ok) {
              const data = await response.json();
              setDogs(data);
            }
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dogs:', error);
        setIsLoading(false);
      }
    };

    fetchDogs();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Dogs</h1>
      </div>
      
      {dogs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center">
          <p className="text-gray-600">No dogs assigned to you yet.</p>
          <p className="text-gray-500 mt-2">Dogs will appear here after you are assigned to walk them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dogs.map((dog: any) => (
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

