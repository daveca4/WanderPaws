import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocationTracking } from '@/lib/hooks/useLocationTracking';

interface WalkTrackingControlsProps {
  walkId: string;
  isComplete?: boolean;
  onLocationUpdate?: (location: any) => void;
  onTrackingStateChange?: (isTracking: boolean) => void;
}

const WalkTrackingControls: React.FC<WalkTrackingControlsProps> = ({
  walkId,
  isComplete = false,
  onLocationUpdate,
  onTrackingStateChange
}) => {
  const router = useRouter();
  const [trackingState, setTrackingState] = useState<
    'idle' | 'pickup' | 'walking' | 'dropoff' | 'complete'
  >(isComplete ? 'complete' : 'idle');
  
  // Controls for the location tracking
  const {
    isTracking,
    currentLocation,
    locationHistory,
    error,
    startTracking,
    stopTracking,
    clearHistory
  } = useLocationTracking({
    enabled: trackingState !== 'idle' && trackingState !== 'complete',
    interval: 5000, // 5 seconds tracking interval
    onLocationUpdate: (location) => {
      if (onLocationUpdate) onLocationUpdate(location);
    }
  });
  
  // Notify parent component when tracking state changes
  useEffect(() => {
    if (onTrackingStateChange) {
      onTrackingStateChange(isTracking);
    }
  }, [isTracking, onTrackingStateChange]);
  
  // Save tracking data to the API
  const saveTrackingData = async (action: string, data: any = {}) => {
    try {
      const payload = {
        walkId,
        action,
        ...data
      };
      
      const response = await fetch('/api/walks/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save tracking data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving tracking data:', error);
      return null;
    }
  };
  
  // Handle pickup action
  const handlePickup = async () => {
    if (!currentLocation) {
      await startTracking();
    }
    
    if (currentLocation) {
      await saveTrackingData('pickup', {
        pickupLocation: currentLocation
      });
      
      setTrackingState('pickup');
    }
  };
  
  // Handle start walk action
  const handleStartWalk = async () => {
    if (!currentLocation) {
      await startTracking();
    }
    
    if (currentLocation) {
      await saveTrackingData('start', {
        walkStartLocation: currentLocation,
        routeCoordinates: [currentLocation],
        isTrackingActive: true
      });
      
      setTrackingState('walking');
    }
  };
  
  // Handle update route
  const handleUpdateRoute = async () => {
    if (locationHistory.length > 0) {
      // Only send the last 5 points to reduce payload size
      const lastPoints = locationHistory.slice(Math.max(locationHistory.length - 5, 0));
      
      await saveTrackingData('update', {
        routeCoordinates: lastPoints
      });
    }
  };
  
  // Handle end walk action
  const handleEndWalk = async () => {
    if (currentLocation) {
      await saveTrackingData('end', {
        walkEndLocation: currentLocation,
        routeCoordinates: [currentLocation],
        isTrackingActive: false
      });
      
      setTrackingState('dropoff');
    }
  };
  
  // Handle dropoff action
  const handleDropoff = async () => {
    if (currentLocation) {
      await saveTrackingData('dropoff', {
        dropoffLocation: currentLocation,
        isTrackingActive: false
      });
      
      // Stop tracking and complete the walk
      stopTracking();
      setTrackingState('complete');
    }
  };
  
  // Periodically update the route when walking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (trackingState === 'walking' && locationHistory.length > 0) {
      // Update route every 30 seconds
      interval = setInterval(handleUpdateRoute, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [trackingState, locationHistory]);
  
  // Render different buttons based on the tracking state
  const renderActionButton = () => {
    switch (trackingState) {
      case 'idle':
        return (
          <button
            onClick={handlePickup}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2 shadow-md"
          >
            <span>📍 Record Pickup</span>
          </button>
        );
        
      case 'pickup':
        return (
          <button
            onClick={handleStartWalk}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2 shadow-md"
          >
            <span>▶️ Start Walk</span>
          </button>
        );
        
      case 'walking':
        return (
          <button
            onClick={handleEndWalk}
            className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2 shadow-md"
          >
            <span>⏹️ End Walk</span>
          </button>
        );
        
      case 'dropoff':
        return (
          <button
            onClick={handleDropoff}
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2 shadow-md"
          >
            <span>🏠 Record Dropoff</span>
          </button>
        );
        
      case 'complete':
        return (
          <button
            onClick={() => router.push(`/walker-dashboard/walks`)}
            className="w-full py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2 shadow-md"
          >
            <span>✅ Walk Complete</span>
          </button>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Walk Tracking</h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full 
          ${trackingState === 'idle' ? 'bg-gray-100 text-gray-800' : ''} 
          ${trackingState === 'pickup' ? 'bg-green-100 text-green-800' : ''} 
          ${trackingState === 'walking' ? 'bg-blue-100 text-blue-800' : ''} 
          ${trackingState === 'dropoff' ? 'bg-amber-100 text-amber-800' : ''} 
          ${trackingState === 'complete' ? 'bg-teal-100 text-teal-800' : ''}
        `}>
          {trackingState === 'idle' && 'Not Started'}
          {trackingState === 'pickup' && 'Pickup Recorded'}
          {trackingState === 'walking' && 'Walking...'}
          {trackingState === 'dropoff' && 'Walk Ended'}
          {trackingState === 'complete' && 'Complete'}
        </span>
      </div>
      
      {/* Track status */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className={`h-3 w-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="text-sm text-gray-600">
            {isTracking ? 'GPS tracking active' : 'GPS tracking inactive'}
          </span>
        </div>
        
        {/* Show location data if available */}
        {currentLocation && (
          <div className="text-xs text-gray-500 mb-2">
            Current location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </div>
        )}
        
        {/* Show error if any */}
        {error && (
          <div className="text-xs text-red-500 mb-2">
            Error: {error}
          </div>
        )}
      </div>
      
      {/* Progress steps */}
      <div className="flex items-center mb-6 relative">
        <div className="flex-grow flex items-center relative">
          {/* Line connecting all steps */}
          <div className="absolute h-0.5 bg-gray-200 left-0 right-0 z-0"></div>
          
          {/* Step 1: Pickup */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 relative
            ${trackingState === 'idle' ? 'bg-gray-200 text-gray-600' : 'bg-green-500 text-white'}
          `}>
            1
          </div>
          
          {/* Line 1-2 */}
          <div className={`flex-grow h-0.5 z-0 
            ${trackingState === 'idle' ? 'bg-gray-200' : 'bg-green-500'}
          `}></div>
          
          {/* Step 2: Start Walk */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 relative
            ${trackingState === 'idle' || trackingState === 'pickup' ? 'bg-gray-200 text-gray-600' : 'bg-blue-500 text-white'}
          `}>
            2
          </div>
          
          {/* Line 2-3 */}
          <div className={`flex-grow h-0.5 z-0 
            ${trackingState === 'idle' || trackingState === 'pickup' ? 'bg-gray-200' : 
              trackingState === 'walking' ? 'bg-blue-500' : 'bg-purple-500'}
          `}></div>
          
          {/* Step 3: End Walk */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 relative
            ${trackingState === 'idle' || trackingState === 'pickup' || trackingState === 'walking' ? 
              'bg-gray-200 text-gray-600' : 'bg-purple-500 text-white'}
          `}>
            3
          </div>
          
          {/* Line 3-4 */}
          <div className={`flex-grow h-0.5 z-0 
            ${trackingState === 'idle' || trackingState === 'pickup' || trackingState === 'walking' ? 
              'bg-gray-200' : trackingState === 'dropoff' ? 'bg-red-500' : 'bg-teal-500'}
          `}></div>
          
          {/* Step 4: Dropoff */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 relative
            ${trackingState === 'complete' ? 'bg-teal-500 text-white' : 
              trackingState === 'dropoff' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}
          `}>
            4
          </div>
        </div>
      </div>
      
      {/* Action Button */}
      {renderActionButton()}
    </div>
  );
};

export default WalkTrackingControls; 