'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/lib/DataContext';
import { useAuth } from '@/lib/AuthContext';
import WalkTrackingMap from '@/components/maps/WalkTrackingMap';
import WalkTrackingControls from '@/components/walks/WalkTrackingControls';

interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

export default function WalkTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { walks, dogs, getWalkById, getDogById } = useData();
  
  const walkId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [walkData, setWalkData] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  // Fetch initial walk data
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
  }, [walkId]);
  
  // Get walk data from context as a fallback if API fails
  useEffect(() => {
    if (!walkData && walkId) {
      const walk = getWalkById(walkId);
      if (walk) {
        const dog = getDogById(walk.dogId);
        setWalkData({
          ...walk,
          dog: {
            name: dog?.name || 'Unknown',
            imageUrl: dog?.imageUrl || ''
          }
        });
        setLoading(false);
      }
    }
  }, [walkId, walkData, getWalkById, getDogById]);
  
  // Check if the walk is completed
  const isWalkComplete = walkData?.status === 'completed' || 
                         (walkData?.pickupLocation && walkData?.dropoffLocation && 
                          walkData?.walkStartLocation && walkData?.walkEndLocation);
  
  // Handle location updates from the tracking control
  const handleLocationUpdate = (location: LocationPoint) => {
    setCurrentLocation(location);
  };
  
  // Handle tracking state changes
  const handleTrackingStateChange = (trackingActive: boolean) => {
    setIsTracking(trackingActive);
  };
  
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
          onClick={() => router.push('/walker-dashboard/walks')}
          className="px-4 py-2 bg-primary-500 text-white rounded-md"
        >
          Back to Walks
        </button>
      </div>
    );
  }
  
  const dog = walkData.dog || {};
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Walk Tracking</h1>
          <p className="text-gray-600">
            Dog: {dog.name} | {new Date(walkData.date).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => router.push('/walker-dashboard/walks')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back to Walks
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Map */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <WalkTrackingMap
              walkId={walkId}
              dogName={dog.name}
              dogImageUrl={dog.imageUrl}
              routeCoordinates={walkData.routeCoordinates || []}
              currentLocation={isTracking ? currentLocation : null}
              pickupLocation={walkData.pickupLocation}
              dropoffLocation={walkData.dropoffLocation}
              walkStartLocation={walkData.walkStartLocation}
              walkEndLocation={walkData.walkEndLocation}
              isActive={isTracking}
              height="600px"
            />
          </div>
        </div>
        
        {/* Right column - Controls and info */}
        <div>
          {/* Tracking controls */}
          <WalkTrackingControls
            walkId={walkId}
            isComplete={isWalkComplete}
            onLocationUpdate={handleLocationUpdate}
            onTrackingStateChange={handleTrackingStateChange}
          />
          
          {/* Walk info */}
          <div className="bg-white shadow-md rounded-lg p-4">
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
            
            {/* Tracking Stats - Only show if tracking has started */}
            {(walkData.pickupLocation || walkData.walkStartLocation) && (
              <div className="mt-5 pt-5 border-t border-gray-200">
                <h4 className="text-md font-medium text-gray-800 mb-3">Tracking Stats</h4>
                
                {/* Points recorded */}
                <div className="mb-3">
                  <span className="text-sm text-gray-500 block mb-1">Points Recorded</span>
                  <span className="text-gray-900">
                    {(walkData.routeCoordinates?.length || 0).toLocaleString()}
                  </span>
                </div>
                
                {/* Time elapsed if walk is in progress */}
                {walkData.walkStartLocation && !walkData.walkEndLocation && (
                  <div className="mb-3">
                    <span className="text-sm text-gray-500 block mb-1">Time Elapsed</span>
                    <span className="text-gray-900">
                      Walk in progress
                    </span>
                  </div>
                )}
                
                {/* Times if available */}
                {walkData.pickupLocation && (
                  <div className="mb-2 text-xs text-gray-500">
                    Pickup: {new Date(walkData.pickupLocation.timestamp).toLocaleTimeString()}
                  </div>
                )}
                
                {walkData.walkStartLocation && (
                  <div className="mb-2 text-xs text-gray-500">
                    Walk Start: {new Date(walkData.walkStartLocation.timestamp).toLocaleTimeString()}
                  </div>
                )}
                
                {walkData.walkEndLocation && (
                  <div className="mb-2 text-xs text-gray-500">
                    Walk End: {new Date(walkData.walkEndLocation.timestamp).toLocaleTimeString()}
                  </div>
                )}
                
                {walkData.dropoffLocation && (
                  <div className="mb-2 text-xs text-gray-500">
                    Dropoff: {new Date(walkData.dropoffLocation.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 