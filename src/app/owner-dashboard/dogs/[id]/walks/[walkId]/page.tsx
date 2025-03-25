'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import WalkTrackingMap from '@/components/maps/WalkTrackingMap';
import Image from 'next/image';

export default function DogWalkHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { getWalkById, getDogById } = useData();
  
  const dogId = params.id as string;
  const walkId = params.walkId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walkData, setWalkData] = useState<any>(null);
  
  // Fetch walk data
  useEffect(() => {
    const fetchWalkData = async () => {
      if (!walkId) return;
      
      try {
        const response = await fetch(`/api/walks/tracking?walkId=${walkId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch walk data');
        }
        
        const data = await response.json();
        
        if (data.success && data.walk) {
          // Verify that this walk belongs to the owner's dog
          if (data.walk.dogId !== dogId) {
            throw new Error('Unauthorized access to walk data');
          }
          
          setWalkData(data.walk);
        } else {
          throw new Error(data.error || 'Walk not found');
        }
      } catch (err) {
        console.error('Error fetching walk:', err);
        setError('Could not load walk data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWalkData();
  }, [walkId, dogId]);
  
  // Get walk data from context as fallback
  useEffect(() => {
    if (!walkData && walkId) {
      const walk = getWalkById(walkId);
      
      // Verify this walk belongs to the dog
      if (walk && walk.dogId === dogId) {
        const dog = getDogById(dogId);
        setWalkData({
          ...walk,
          dog: {
            name: dog?.name || 'Unknown',
            imageUrl: dog?.imageUrl || ''
          }
        });
        setLoading(false);
      } else if (walk) {
        setError('Unauthorized access to walk data');
        setLoading(false);
      }
    }
  }, [walkId, dogId, walkData, getWalkById, getDogById]);
  
  // If loading, show a loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  // If error or no walk data, show an error message
  if (error || !walkData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 text-xl mb-4">
          {error || 'Walk not found'}
        </div>
        <button
          onClick={() => router.push(`/owner-dashboard/dogs/${dogId}`)}
          className="px-4 py-2 bg-primary-500 text-white rounded-md"
        >
          Back to Dog Profile
        </button>
      </div>
    );
  }
  
  const dog = walkData.dog || {};
  const hasTracking = walkData.routeCoordinates?.length > 0 || 
                     walkData.pickupLocation || 
                     walkData.dropoffLocation || 
                     walkData.walkStartLocation || 
                     walkData.walkEndLocation;
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Walk History</h1>
          <p className="text-gray-600">
            {dog.name} | {new Date(walkData.date).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => router.push(`/owner-dashboard/dogs/${dogId}`)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back to Dog Profile
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Map */}
        <div className="lg:col-span-2">
          {hasTracking ? (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <WalkTrackingMap
                walkId={walkId}
                dogName={dog.name}
                dogImageUrl={dog.imageUrl}
                routeCoordinates={walkData.routeCoordinates || []}
                pickupLocation={walkData.pickupLocation}
                dropoffLocation={walkData.dropoffLocation}
                walkStartLocation={walkData.walkStartLocation}
                walkEndLocation={walkData.walkEndLocation}
                height="600px"
                showControls={false}
              />
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg p-8 flex flex-col items-center justify-center h-full">
              <div className="text-gray-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No GPS Data Available</h3>
              <p className="text-gray-500 text-center">
                This walk does not have GPS tracking data. We started tracking walks recently or the walker may have encountered issues with GPS during this walk.
              </p>
            </div>
          )}
        </div>
        
        {/* Right column - Information */}
        <div>
          {/* Walker info */}
          <div className="bg-white shadow-md rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Walker</h3>
            
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 mr-4">
                {walkData.walker?.imageUrl ? (
                  <Image
                    src={walkData.walker.imageUrl}
                    alt={walkData.walker.name || 'Walker'}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200 text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{walkData.walker?.name || 'Unknown Walker'}</h4>
                <div className="flex items-center mt-1">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <span className="ml-1 text-sm text-gray-700">{walkData.walker?.rating || '5.0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Walk details */}
          <div className="bg-white shadow-md rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Walk Details</h3>
            
            {/* Status */}
            <div className="mb-3">
              <span className="text-sm text-gray-500 block mb-1">Status</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                walkData.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                walkData.status === 'completed' ? 'bg-green-100 text-green-800' :
                walkData.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {walkData.status?.charAt(0).toUpperCase() + walkData.status?.slice(1)}
              </span>
            </div>
            
            {/* Date and Time */}
            <div className="mb-3">
              <span className="text-sm text-gray-500 block mb-1">Date & Time</span>
              <span className="text-gray-900">
                {new Date(walkData.date).toLocaleDateString()} at {walkData.startTime}
              </span>
            </div>
            
            {/* Duration */}
            <div className="mb-3">
              <span className="text-sm text-gray-500 block mb-1">Duration</span>
              <span className="text-gray-900">{walkData.duration} minutes</span>
            </div>
            
            {/* Notes */}
            {walkData.notes && (
              <div className="mb-3">
                <span className="text-sm text-gray-500 block mb-1">Notes</span>
                <div className="text-gray-900 bg-gray-50 p-2 rounded text-sm">
                  {walkData.notes}
                </div>
              </div>
            )}
          </div>
          
          {/* Feedback */}
          {walkData.feedback && (
            <div className="bg-white shadow-md rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Walker's Feedback</h3>
              
              {walkData.feedback.rating && (
                <div className="mb-3">
                  <span className="text-sm text-gray-500 block mb-1">Walk Rating</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 ${i < walkData.feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                </div>
              )}
              
              {walkData.feedback.comments && (
                <div className="mb-3">
                  <span className="text-sm text-gray-500 block mb-1">Comments</span>
                  <div className="text-gray-900 bg-gray-50 p-3 rounded text-sm italic">
                    "{walkData.feedback.comments}"
                  </div>
                </div>
              )}
              
              {walkData.feedback.behaviors && (
                <div className="mb-3">
                  <span className="text-sm text-gray-500 block mb-1">Behaviors</span>
                  <div className="flex flex-wrap gap-2">
                    {walkData.feedback.behaviors.map((behavior: string, index: number) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                      >
                        {behavior}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 