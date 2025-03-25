'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { Dog } from '@/lib/types';

export default function OwnerDogsPage() {
  const { user } = useAuth();
  const { dogs } = useData();
  const [loading, setLoading] = useState(true);
  const [myDogs, setMyDogs] = useState<Dog[]>([]);

  // Load owner's dogs
  useEffect(() => {
    if (!user || !user.profileId) return;

    const loadDogs = () => {
      console.log("Looking for dogs belonging to owner:", user.profileId);
      // Filter dogs by owner ID
      const ownerDogs = dogs.filter(dog => dog.ownerId === user.profileId);
      console.log("Found dogs:", ownerDogs);
      setMyDogs(ownerDogs);
      setLoading(false);
    };

    loadDogs();
  }, [user, dogs]);

  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'dogs' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Dogs</h1>
          <Link
            href="/owner-dashboard/dogs/add"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Dog
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : myDogs.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500 mb-4">You don't have any dogs yet.</p>
            <Link
              href="/owner-dashboard/dogs/add"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Add Your First Dog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myDogs.map((dog) => (
              <Link key={dog.id} href={`/owner-dashboard/dogs/${dog.id}`} className="block">
                <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow border border-gray-200">
                  <div className="h-48 relative">
                    {dog.imageUrl ? (
                      <Image
                        src={dog.imageUrl}
                        alt={dog.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full bg-gray-200 flex items-center justify-center">
                        <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3zm9-7h-1V7c0-1.1-.9-2-2-2h-4c0-1.1-.9-2-2-2s-2 .9-2 2H5C3.9 5 3 5.9 3 7v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zM5 19V7h14v12H5z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{dog.name}</h3>
                        <p className="text-sm text-gray-500">{dog.breed}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-primary-100 text-primary-800">
                        {dog.size}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-500">Age: {dog.age} {dog.age === 1 ? 'year' : 'years'}</div>
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 