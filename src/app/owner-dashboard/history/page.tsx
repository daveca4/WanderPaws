'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import RouteGuard from '@/components/RouteGuard';
import { mockWalks, mockDogs } from '@/lib/mockData';
import { useAuth } from '@/lib/AuthContext';
import { formatDate, formatTime, getDogById, getWalkerById } from '@/utils/helpers';
import { Walk } from '@/lib/types';

export default function WalkHistoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pastWalks, setPastWalks] = useState<Walk[]>([]);

  // Load owner's past walks
  useEffect(() => {
    if (!user) return;

    const loadPastWalks = () => {
      // Get the owner's dogs
      const ownersDogs = mockDogs.filter(dog => dog.ownerId === user.profileId);
      const ownerDogIds = ownersDogs.map(dog => dog.id);
      
      // Get past walks for those dogs
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const filteredWalks = mockWalks.filter(walk => {
        // Check if this walk is for one of the owner's dogs
        if (!ownerDogIds.includes(walk.dogId)) return false;
        
        // Check if the walk is completed
        if (walk.status !== 'completed') return false;
        
        return true;
      });
      
      // Sort by date and time, most recent first
      filteredWalks.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime(); // Descending
        }
        
        // If dates are the same, compare by time
        const [hoursA, minutesA] = a.startTime.split(':').map(Number);
        const [hoursB, minutesB] = b.startTime.split(':').map(Number);
        return (hoursB * 60 + minutesB) - (hoursA * 60 + minutesA); // Descending
      });
      
      setPastWalks(filteredWalks);
      setLoading(false);
    };

    // Simulate API call
    setTimeout(loadPastWalks, 500);
  }, [user]);

  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'walks' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Walk History</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : pastWalks.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500 mb-4">No walk history found.</p>
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
              {pastWalks.map((walk) => {
                const dog = getDogById(walk.dogId);
                const walker = getWalkerById(walk.walkerId);
                
                if (!dog || !walker || !walk.metrics) return null;
                
                return (
                  <div key={walk.id} className="p-6 hover:bg-gray-50">
                    <div className="sm:flex sm:items-start sm:justify-between">
                      <div className="sm:flex sm:items-start">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full relative overflow-hidden">
                            <Image
                              src={dog.imageUrl || 'https://via.placeholder.com/100'}
                              alt={dog.name}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div className="mt-3 sm:mt-0 sm:ml-4">
                          <div className="flex items-center">
                            <h3 className="text-lg font-medium text-gray-900">
                              {dog.name} with {walker.name}
                            </h3>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Completed
                            </span>
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(walk.date)} at {formatTime(walk.startTime)}</span>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-3 rounded-lg">
                            <div>
                              <span className="block text-xs text-gray-500">Distance</span>
                              <span className="font-medium">{walk.metrics.distanceCovered.toFixed(1)} km</span>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500">Duration</span>
                              <span className="font-medium">{walk.metrics.totalTime} min</span>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500">Mood</span>
                              <span className="font-medium">
                                {Array(walk.metrics.moodRating).fill('⭐').join('')}
                              </span>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500">Bathroom Breaks</span>
                              <span className="font-medium">
                                {walk.metrics.poopCount} 💩 / {walk.metrics.peeCount} 💧
                              </span>
                            </div>
                          </div>
                          
                          {walk.metrics.behaviorsObserved && walk.metrics.behaviorsObserved.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500">Behaviors:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {walk.metrics.behaviorsObserved.map((behavior, index) => (
                                  <span 
                                    key={index} 
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {behavior}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {walk.notes && (
                            <div className="mt-3 text-sm text-gray-700">
                              <span className="font-medium">Notes:</span> {walk.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-5 sm:mt-0">
                        <Link href={`/schedule/${walk.id}`} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                          View Details
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