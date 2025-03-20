'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getUpcomingWalks, formatDate, formatTime, getDogById } from '@/utils/helpers';
import Image from 'next/image';

export default function WalkerSchedulePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upcoming');

  // Redirect if not a walker or admin
  useEffect(() => {
    if (!loading && user && user.role !== 'walker' && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, loading, router]);

  // If loading or not walker/admin, show loading state
  if (loading || !user || (user.role !== 'walker' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const walkerId = user.profileId;
  const upcomingWalks = getUpcomingWalks(undefined, undefined, walkerId);

  // Group walks by date
  const walksByDate = upcomingWalks.reduce((acc, walk) => {
    if (!acc[walk.date]) {
      acc[walk.date] = [];
    }
    acc[walk.date].push(walk);
    return acc;
  }, {} as Record<string, typeof upcomingWalks>);

  // Sort dates
  const sortedDates = Object.keys(walksByDate).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'upcoming'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Upcoming Walks
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'calendar'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Calendar View
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'upcoming' ? (
            <div>
              {sortedDates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No upcoming walks scheduled</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {sortedDates.map(date => (
                    <div key={date}>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {formatDate(date).split(',')[0]}
                      </h2>
                      
                      <div className="space-y-4">
                        {walksByDate[date].map(walk => {
                          const dog = getDogById(walk.dogId);
                          
                          if (!dog) return null;
                          
                          return (
                            <div key={walk.id} className="flex items-center p-4 rounded-lg border border-gray-100 hover:bg-gray-50">
                              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                                <Image
                                  src={dog.imageUrl || 'https://via.placeholder.com/56'}
                                  alt={dog.name}
                                  width={56}
                                  height={56}
                                  className="object-cover"
                                />
                              </div>
                              
                              <div className="ml-4 flex-1">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                  <div>
                                    <p className="font-medium text-gray-900">{dog.name}</p>
                                    <p className="text-sm text-gray-500">{dog.breed} • {dog.size}</p>
                                  </div>
                                  <div className="mt-2 sm:mt-0">
                                    <p className="font-medium text-gray-900">
                                      {formatTime(walk.startTime)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {walk.duration} minutes
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                  {dog.specialNeeds && dog.specialNeeds.length > 0 && (
                                    <div className="flex items-center mr-4">
                                      <span className="mr-1">⚠️</span>
                                      <span>Special needs</span>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center">
                                    <span className="mr-1">🦮</span>
                                    <span>
                                      {dog.walkingPreferences.preferredTimes.join(', ')} walker
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="ml-2">
                                <button className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md">
                                  Details
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Calendar view coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 