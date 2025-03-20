'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { mockDogs } from '@/lib/mockData';
import { useAuth } from '@/lib/AuthContext';
import { Dog } from '@/lib/types';

export default function OwnerDogsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myDogs, setMyDogs] = useState<Dog[]>([]);

  // Load owner's dogs
  useEffect(() => {
    if (!user) return;

    const loadDogs = () => {
      // In a real app, this would fetch from an API
      // For demo, filter the mock dogs where the ownerId matches the user's profileId
      const ownerDogs = mockDogs.filter(dog => dog.ownerId === user.profileId);
      setMyDogs(ownerDogs);
      setLoading(false);
    };

    // Simulate API call
    setTimeout(loadDogs, 500);
  }, [user]);

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
                    <Image
                      src={dog.imageUrl || 'https://via.placeholder.com/300x200'}
                      alt={dog.name}
                      fill
                      className="object-cover"
                    />
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