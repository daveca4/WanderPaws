'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Walk } from '@/lib/types';
import { useUpcomingWalks, useCancelWalk } from '@/lib/hooks/useBookingHooks';

export default function BookingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Use React Query hooks
  const { 
    data: walks = [], 
    isPending, 
    error, 
    refetch 
  } = useUpcomingWalks();
  
  // Convert error to string for display
  const errorMessage = error 
    ? error instanceof Error 
      ? error.message 
      : 'Failed to load walks'
    : '';
  
  const {
    mutate: cancelWalk,
    isPending: isCancelling
  } = useCancelWalk();

  // Function to format date
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to format time
  const formatTime = (timeString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(timeString).toLocaleTimeString(undefined, options);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Handle cancellation
  const handleCancelWalk = (walkId: string) => {
    if (window.confirm('Are you sure you want to cancel this walk?')) {
      cancelWalk({ walkId });
    }
  };

  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'walks' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upcoming Walks</h1>
            <p className="mt-1 text-sm text-gray-500">View and manage your scheduled dog walks</p>
          </div>
          <Link
            href="/owner-dashboard/create-booking"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Book a Walk
          </Link>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            {errorMessage}
          </div>
        )}

        {isPending ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : walks.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {walks.map((walk) => (
                <li key={walk.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-cover bg-center rounded-full overflow-hidden border border-gray-200">
                          {walk.dog?.profileImage ? (
                            <img src={walk.dog.profileImage} alt={walk.dog.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <h2 className="text-sm font-medium text-gray-900">
                            {walk.dogName || walk.dog?.name || 'Unknown Dog'}
                          </h2>
                          <div className="flex items-center mt-1">
                            <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs text-gray-500">
                              {walk.date ? formatDate(walk.date) : 'Date not set'} {walk.timeSlot && `(${walk.timeSlot})`}
                            </p>
                          </div>
                          {(walk.walkerName || walk.walker?.name) && (
                            <div className="flex items-center mt-1">
                              <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                              </svg>
                              <p className="text-xs text-gray-500">
                                Walker: {walk.walkerName || walk.walker?.name}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(walk.status)}`}>
                          {walk.status === 'in_progress' ? 'In Progress' : 
                           walk.status.charAt(0).toUpperCase() + walk.status.slice(1).replace('_', ' ')}
                        </span>
                        <div className="mt-2 flex space-x-2">
                          <Link
                            href={`/owner-dashboard/dogs/${walk.dogId}/walks/${walk.id}`}
                            className="text-xs text-primary-600 hover:text-primary-900"
                          >
                            View details
                          </Link>
                          {(walk.status === 'pending' || walk.status === 'confirmed' || walk.status === 'scheduled') && (
                            <button
                              onClick={() => handleCancelWalk(walk.id)}
                              disabled={isCancelling}
                              className="text-xs text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
            <div className="py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming walks</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by booking a walk for your dog.
              </p>
              <div className="mt-6">
                <Link
                  href="/owner-dashboard/create-booking"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  Book a Walk
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 