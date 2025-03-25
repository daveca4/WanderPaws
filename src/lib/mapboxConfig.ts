// Mapbox configuration for WanderPaws
export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZGF2ZWNhNCIsImEiOiJjbThuaXJzM3AwMWgwMndzY2o5enBjOXhsIn0.sj_J91E1Z4vN_POZKLRjkA'; 
// Note: We're using the public token here, not the secret token for security

// Default map center (UK - London)
export const DEFAULT_CENTER = {
  latitude: 51.509865,
  longitude: -0.118092
};

// Default zoom level
export const DEFAULT_ZOOM = 11;

// Map style
export const DEFAULT_STYLE = 'mapbox://styles/mapbox/streets-v12';

// Custom dog marker size
export const DOG_MARKER_SIZE = 50;

// Polyline options for walk routes
export const ROUTE_LINE_OPTIONS = {
  color: '#3B82F6', // blue-500
  width: 4,
  opacity: 0.8
};

// Function to convert Walk model route to GeoJSON
export const walkRouteToGeoJSON = (routeCoordinates: any[] = []) => {
  if (!routeCoordinates || routeCoordinates.length === 0) return null;
  
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: routeCoordinates.map(point => [point.lng, point.lat])
    }
  };
};

// Check if geolocation is available in the browser
export const isGeolocationAvailable = typeof navigator !== 'undefined' && 'geolocation' in navigator;

// Get current position as a promise
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!isGeolocationAvailable) {
      reject(new Error('Geolocation is not available'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  });
};

// Get formatted coordinates from position
export const getCoordinates = async () => {
  try {
    const position = await getCurrentPosition();
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}; 