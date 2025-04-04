'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/auth/AuthContext';
import { useMyWalkers } from '@/lib/hooks/useWalkerHooks';
import { Walker } from '@/lib/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function MyWalkersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  // Use React Query for data fetching
  const { 
    data: walkers = [], 
    isPending: isLoading, 
    error: fetchError 
  } = useMyWalkers();
  
  // Debug logging
  useEffect(() => {
    console.log('MyWalkersPage - Current user:', user);
    console.log('MyWalkersPage - Walkers:', walkers);
  }, [user, walkers]);
  
  // Handle fetch errors
  useEffect(() => {
    if (fetchError) {
      console.error('Error fetching walkers:', fetchError);
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load walkers');
    }
  }, [fetchError]);
  
  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'owner-dashboard' }}>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            My Walkers
          </h1>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading walkers</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : walkers.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No walkers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any walkers assigned yet. This may be because your dogs haven't been approved for walks.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push('/owner-dashboard/assessment/status')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                View Assessments
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {walkers.map((walker: Walker) => (
              <div key={walker.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  {walker.imageUrl ? (
                    <img src={walker.imageUrl} alt={walker.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <svg className="h-20 w-20 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{walker.name}</h3>
                  
                  {walker.rating && (
                    <div className="flex items-center mt-1">
                      <svg className="text-yellow-400 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 text-gray-600">{walker.rating.toFixed(1)}</span>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    {walker.specialties && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(Array.isArray(walker.specialties) ? walker.specialties : []).map((specialty, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {walker.bio && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                      {walker.bio}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 