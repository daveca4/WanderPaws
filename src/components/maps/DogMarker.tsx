import React from 'react';
import { Marker } from 'react-map-gl';
import Image from 'next/image';
import { DOG_MARKER_SIZE } from '@/lib/mapboxConfig';

interface DogMarkerProps {
  latitude: number;
  longitude: number;
  dogName: string;
  imageUrl?: string;
  onClick?: () => void;
  size?: number;
  // For direct mapbox-gl usage without react-map-gl
  useMapboxDirect?: boolean;
}

/**
 * Dog marker for maps
 * Can be used with both react-map-gl (default) or directly with mapbox-gl
 */
const DogMarker: React.FC<DogMarkerProps> = ({
  latitude,
  longitude,
  dogName,
  imageUrl,
  onClick,
  size = DOG_MARKER_SIZE,
  useMapboxDirect = false
}) => {
  // Default dog image if none provided
  const dogImage = imageUrl || '/images/default-dog.png';
  
  // Use basic marker props that work with all versions
  const markerProps: any = {
    latitude,
    longitude
  };
  
  const dogMarkerContent = (
    <div 
      className="relative group cursor-pointer" 
      onClick={onClick}
    >
      {/* Dog image in a circular frame with drop shadow */}
      <div 
        className="rounded-full overflow-hidden border-2 border-white shadow-lg transform transition-transform duration-300 group-hover:scale-110"
        style={{ width: size, height: size }}
      >
        <Image
          src={dogImage}
          alt={dogName}
          width={size}
          height={size}
          className="object-cover w-full h-full"
        />
      </div>
      
      {/* Dog name tooltip */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded-md shadow-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {dogName}
      </div>
      
      {/* Bottom pointer */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary-500 rotate-45 shadow-md"></div>
    </div>
  );

  // If using for direct mapbox-gl integration, just return the content
  if (useMapboxDirect) {
    return dogMarkerContent;
  }
  
  // Otherwise, wrap in a react-map-gl Marker
  return (
    <Marker {...markerProps}>
      {dogMarkerContent}
    </Marker>
  );
};

/**
 * Creates a DOM element for a dog marker that can be used with mapbox-gl
 */
export const createDogMarkerElement = (
  dogName: string,
  dogImageUrl?: string,
  size = DOG_MARKER_SIZE
): HTMLDivElement => {
  // Create container element
  const el = document.createElement('div');
  el.className = 'dog-marker';
  
  // Create marker element with styles
  const markerElement = document.createElement('div');
  markerElement.style.width = `${size}px`;
  markerElement.style.height = `${size}px`;
  markerElement.style.borderRadius = '50%';
  markerElement.style.overflow = 'hidden';
  markerElement.style.border = '3px solid #3B82F6';
  markerElement.style.boxShadow = '0 0 0 2px white, 0 0 10px rgba(0,0,0,0.3)';
  
  if (dogImageUrl) {
    // Add dog image if available
    const img = document.createElement('img');
    img.src = dogImageUrl;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    markerElement.appendChild(img);
  } else {
    // Fallback to colored div with first letter
    markerElement.style.backgroundColor = '#3B82F6';
    markerElement.style.color = 'white';
    markerElement.style.display = 'flex';
    markerElement.style.alignItems = 'center';
    markerElement.style.justifyContent = 'center';
    markerElement.style.fontSize = '18px';
    markerElement.style.fontWeight = 'bold';
    markerElement.textContent = dogName.charAt(0).toUpperCase();
  }
  
  el.appendChild(markerElement);
  return el;
};

export default DogMarker; 