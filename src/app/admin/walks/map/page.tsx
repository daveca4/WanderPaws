'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

// Simple placeholder component until Mapbox issues are resolved
export default function AdminWalksMapPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Check if user is admin
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, router]);
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Walk Routes Map</h1>
          <p className="text-gray-600">
            View all dog walks with GPS tracking data
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/walks')}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Back to Walks
        </button>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Map Feature Coming Soon</h2>
          <p className="text-gray-500 text-center max-w-md">
            We're currently working on integrating the map visualization feature. This will allow you to view all dog walk routes on an interactive map.
          </p>
          <button
            onClick={() => router.push('/admin/walks')}
            className="mt-6 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
          >
            View Walks Table
          </button>
        </div>
      </div>
    </div>
  );
}