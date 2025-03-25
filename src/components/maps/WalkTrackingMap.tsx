import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN, DEFAULT_CENTER, DEFAULT_ZOOM, ROUTE_LINE_OPTIONS, walkRouteToGeoJSON } from '@/lib/mapboxConfig';
import DogMarker, { createDogMarkerElement } from './DogMarker';

// Configure Mapbox with access token
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

interface WalkPoint {
  location: LocationPoint;
  type: 'pickup' | 'dropoff' | 'start' | 'end';
  label: string;
}

interface WalkTrackingMapProps {
  walkId?: string;
  dogName: string;
  dogImageUrl?: string;
  routeCoordinates?: LocationPoint[];
  currentLocation?: LocationPoint | null;
  pickupLocation?: LocationPoint | null;
  dropoffLocation?: LocationPoint | null;
  walkStartLocation?: LocationPoint | null;
  walkEndLocation?: LocationPoint | null;
  isActive?: boolean;
  onViewportChange?: (viewport: any) => void;
  width?: string | number;
  height?: string | number;
  showControls?: boolean;
}

const WalkTrackingMap: React.FC<WalkTrackingMapProps> = ({
  walkId,
  dogName,
  dogImageUrl,
  routeCoordinates = [],
  currentLocation,
  pickupLocation,
  dropoffLocation,
  walkStartLocation,
  walkEndLocation,
  isActive = false,
  onViewportChange,
  width = '100%',
  height = '400px',
  showControls = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const dogMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude],
      zoom: DEFAULT_ZOOM
    });

    // Add navigation controls if needed
    if (showControls) {
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }));
    }

    // Handle map load event
    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add route source and layer
      map.current?.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });
      
      map.current?.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': ROUTE_LINE_OPTIONS.color,
          'line-width': ROUTE_LINE_OPTIONS.width,
          'line-opacity': ROUTE_LINE_OPTIONS.opacity
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [showControls]);

  // Update dog marker position
  useEffect(() => {
    if (!mapLoaded || !map.current || !currentLocation) return;

    const { lat, lng } = currentLocation;
    
    // Create dog marker if it doesn't exist
    if (!dogMarkerRef.current) {
      // Use the createDogMarkerElement helper function
      const el = createDogMarkerElement(dogName, dogImageUrl);
      
      // Create a popup for the dog marker
      const popup = new mapboxgl.Popup({ offset: 25 }).setText(
        `${dogName} - Current Location`
      );
      
      // Create the marker
      dogMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current);
        
      // Center map on dog's location
      map.current.flyTo({
        center: [lng, lat],
        zoom: 15
      });
      
    } else {
      // Update existing marker position
      dogMarkerRef.current.setLngLat([lng, lat]);
      
      // If active tracking is on, center map on dog
      if (isActive) {
        map.current.flyTo({
          center: [lng, lat],
          zoom: 15
        });
      }
    }
  }, [currentLocation, dogImageUrl, dogName, isActive, mapLoaded]);

  // Add or update walk route
  useEffect(() => {
    if (!mapLoaded || !map.current || routeCoordinates.length === 0) return;
    
    const routeSource = map.current.getSource('route') as mapboxgl.GeoJSONSource;
    
    if (routeSource) {
      const geoJson = walkRouteToGeoJSON(routeCoordinates);
      if (geoJson) {
        routeSource.setData(geoJson as GeoJSON.Feature);
      }
    }
    
    // If we have multiple points, fit the map to show the entire route
    if (routeCoordinates.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      
      routeCoordinates.forEach(coord => {
        bounds.extend([coord.lng, coord.lat]);
      });
      
      map.current.fitBounds(bounds, {
        padding: 50
      });
    }
  }, [routeCoordinates, mapLoaded]);

  // Add important points markers (pickup, dropoff, etc.)
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    
    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    const points: { location: LocationPoint, color: string, label: string }[] = [];
    
    // Add pickup location
    if (pickupLocation) {
      points.push({
        location: pickupLocation,
        color: '#10B981', // green-500
        label: 'Pickup Location'
      });
    }
    
    // Add dropoff location
    if (dropoffLocation) {
      points.push({
        location: dropoffLocation,
        color: '#EF4444', // red-500
        label: 'Dropoff Location'
      });
    }
    
    // Add walk start
    if (walkStartLocation) {
      points.push({
        location: walkStartLocation,
        color: '#8B5CF6', // purple-500
        label: 'Walk Start'
      });
    }
    
    // Add walk end
    if (walkEndLocation) {
      points.push({
        location: walkEndLocation,
        color: '#F59E0B', // amber-500
        label: 'Walk End'
      });
    }
    
    // Create markers for each point
    points.forEach(point => {
      const { location, color, label } = point;
      
      // Create marker element
      const el = document.createElement('div');
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.2), 0 0 5px rgba(0,0,0,0.3)';
      
      // Create popup for marker
      const popup = new mapboxgl.Popup({ offset: 25 }).setText(label);
      
      // Create and add marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(map.current!);
        
      markersRef.current.push(marker);
    });
    
    // If we have multiple points, fit the map to show all markers
    if (points.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      
      points.forEach(point => {
        bounds.extend([point.location.lng, point.location.lat]);
      });
      
      if (currentLocation) {
        bounds.extend([currentLocation.lng, currentLocation.lat]);
      }
      
      map.current.fitBounds(bounds, {
        padding: 50
      });
    }
  }, [pickupLocation, dropoffLocation, walkStartLocation, walkEndLocation, currentLocation, mapLoaded]);

  return (
    <div 
      ref={mapContainer}
      style={{ 
        width, 
        height, 
        borderRadius: '0.5rem',
        position: 'relative'
      }}
    >
      {!mapLoaded && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#e5e7eb',
            borderRadius: '0.5rem',
          }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default WalkTrackingMap; 