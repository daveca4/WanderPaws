import { useState, useEffect, useCallback, useRef } from 'react';
import { getCoordinates, isGeolocationAvailable } from '../mapboxConfig';

interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

interface UseLocationTrackingProps {
  enabled: boolean;
  interval?: number; // milliseconds
  onLocationUpdate?: (location: LocationPoint) => void;
}

export const useLocationTracking = ({
  enabled = false,
  interval = 10000, // Default to 10 seconds
  onLocationUpdate
}: UseLocationTrackingProps) => {
  const [tracking, setTracking] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  
  // Start tracking
  const startTracking = useCallback(async () => {
    if (!isGeolocationAvailable) {
      setError('Geolocation is not available on this device');
      return false;
    }
    
    try {
      // Get initial location
      const initialLocation = await getCoordinates();
      if (initialLocation) {
        setCurrentLocation(initialLocation);
        setLocationHistory([initialLocation]);
        if (onLocationUpdate) onLocationUpdate(initialLocation);
      }
      
      // Set up interval tracking
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      
      intervalIdRef.current = setInterval(async () => {
        try {
          const newLocation = await getCoordinates();
          if (newLocation) {
            setCurrentLocation(newLocation);
            setLocationHistory(prev => [...prev, newLocation]);
            if (onLocationUpdate) onLocationUpdate(newLocation);
          }
        } catch (err) {
          console.error('Error tracking location:', err);
        }
      }, interval);
      
      setTracking(true);
      setError(null);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start location tracking';
      setError(errorMessage);
      return false;
    }
  }, [interval, onLocationUpdate]);
  
  // Stop tracking
  const stopTracking = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    setTracking(false);
    return locationHistory;
  }, [locationHistory]);
  
  // Clear history
  const clearHistory = useCallback(() => {
    setLocationHistory([]);
  }, []);
  
  // Start/stop tracking based on enabled prop
  useEffect(() => {
    if (enabled && !tracking) {
      startTracking();
    } else if (!enabled && tracking) {
      stopTracking();
    }
    
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [enabled, tracking, startTracking, stopTracking]);
  
  return {
    isTracking: tracking,
    currentLocation,
    locationHistory,
    error,
    startTracking,
    stopTracking,
    clearHistory
  };
};

export default useLocationTracking; 