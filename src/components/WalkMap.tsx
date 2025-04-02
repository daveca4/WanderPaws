'use client';

import { useEffect, useState } from 'react';
import { Walk } from '@/lib/types';

interface WalkMapProps {
  walk: Walk & { 
    locations?: Array<{
      id: string;
      walkId: string;
      latitude: number;
      longitude: number;
      timestamp: string;
    }> 
  };
}

export function WalkMap({ walk }: WalkMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // This is a placeholder for actual map integration
    // In a real implementation, you would load and initialize a map library here
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // No locations available
  if (!walk.locations || walk.locations.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 h-96 flex items-center justify-center border">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-500">No Location Data</p>
          <p className="text-sm text-gray-400">
            {walk.status === 'scheduled' 
              ? 'This walk has not started yet.'
              : walk.status === 'completed' 
              ? 'No location data was recorded for this walk.'
              : 'Waiting for location updates...'}
          </p>
        </div>
      </div>
    );
  }

  // Sort locations by timestamp
  const sortedLocations = [...walk.locations].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Get start and end points
  const startPoint = sortedLocations[0];
  const endPoint = sortedLocations[sortedLocations.length - 1];

  return (
    <div className="relative bg-gray-100 rounded-lg overflow-hidden h-96 border">
      {!mapLoaded ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        // Placeholder for actual map UI
        <div className="absolute inset-0 p-6 flex flex-col items-center justify-center">
          <div className="text-center mb-6">
            <p className="text-lg font-medium text-gray-800">Walk Path</p>
            <p className="text-sm text-gray-500">{sortedLocations.length} location points recorded</p>
          </div>
          
          <div className="w-full max-w-md bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="block text-xs text-gray-500">Start</span>
                <span className="text-sm font-medium">
                  {new Date(startPoint.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="h-1 flex-grow mx-4 bg-primary-100 relative">
                <div className="absolute h-3 w-3 bg-primary-600 rounded-full -top-1 left-0"></div>
                <div className="absolute h-3 w-3 bg-primary-600 rounded-full -top-1 right-0"></div>
              </div>
              <div className="text-right">
                <span className="block text-xs text-gray-500">End</span>
                <span className="text-sm font-medium">
                  {new Date(endPoint.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500">Start Coordinates</span>
                <p className="text-sm font-mono">
                  {startPoint.latitude.toFixed(6)}, {startPoint.longitude.toFixed(6)}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500">End Coordinates</span>
                <p className="text-sm font-mono">
                  {endPoint.latitude.toFixed(6)}, {endPoint.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Note: This is a placeholder. In production, a real map would be displayed here with the walk path.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 