'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { useData } from '@/lib/DataContext';
import { formatDate, formatTime } from '@/utils/helpers';
import { Walk } from '@/lib/types';

export default function OwnerBookingsPage() {
  const { user } = useAuth();
  const { dogs, walks, walkers, getDogById, getWalkerById } = useData();
  const [loading, setLoading] = useState(true);
  const [upcomingWalks, setUpcomingWalks] = useState<Walk[]>([]);

  // Load owner's upcoming walks
  useEffect(() => {
    if (!user || !dogs.length || !walks.length) return;

    const loadWalks = () => {
      // Get the owner's dogs
      const ownersDogs = dogs.filter(dog => dog.ownerId === user.profileId);
      const ownerDogIds = ownersDogs.map(dog => dog.id);
      
      // Get future walks for those dogs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const filteredWalks = walks.filter(walk => {
        // Check if this walk is for one of the owner's dogs
        if (!ownerDogIds.includes(walk.dogId)) return false;
        
        // Check if the walk is scheduled (not completed or cancelled)
        if (walk.status !== 'scheduled') return false;
        
        // Check if the walk date is in the future
        const walkDate = new Date(walk.date);
        return walkDate >= today;
      });
      
      // Sort by date and time
      filteredWalks.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        
        // If dates are the same, compare by time
        const [hoursA, minutesA] = a.startTime.split(':').map(Number);
        const [hoursB, minutesB] = b.startTime.split(':').map(Number);
        return (hoursA * 60 + minutesA) - (hoursB * 60 + minutesB);
      });
      
      setUpcomingWalks(filteredWalks);
      setLoading(false);
    };

    loadWalks();
  }, [user, dogs, walks]);

  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'walks' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Upcoming Bookings</h1>
          <Link
            href="/owner-dashboard/create-booking"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Book a Walk
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : upcomingWalks.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500 mb-4">You don't have any upcoming bookings.</p>
            <Link
              href="/schedule/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Book Your First Walk
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="divide-y divide-gray-200">
              {upcomingWalks.map((walk) => {
                const dog = getDogById(walk.dogId);
                const walker = getWalkerById(walk.walkerId);
                
                if (!dog || !walker) return null;
                
                return (
                  <div key={walk.id} className="p-6 hover:bg-gray-50">
                    <div className="sm:flex sm:items-center sm:justify-between">
                      <div className="sm:flex sm:items-center">
                        <div className="flex-shrink-0">
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full relative overflow-hidden">
                              <Image
                                src={dog.imageUrl || '/images/default-dog.png'}
                                alt={dog.name}
                                width={48}
                                height={48}
                                className="object-cover"
                              />
                            </div>
                            <div className="h-12 w-12 rounded-full relative overflow-hidden -ml-4 ring-2 ring-white">
                              <Image
                                src={walker.imageUrl || '/images/default-walker.png'}
                                alt={walker.name}
                                width={48}
                                height={48}
                                className="object-cover"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 sm:mt-0 sm:ml-4">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              {dog.name} with {walker.name}
                            </h3>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Scheduled
                            </span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(walk.date)} at {formatTime(walk.startTime)}</span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{walk.duration} minutes</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 sm:mt-0 sm:flex sm:items-center">
                        <Link href={`/schedule/${walk.id}`} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                          View Details
                        </Link>
                        <Link href={`/schedule/${walk.id}/edit`} className="mt-2 sm:mt-0 sm:ml-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 