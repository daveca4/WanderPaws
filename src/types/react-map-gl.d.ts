declare module 'react-map-gl' {
  import * as React from 'react';
  
  export interface MapProps {
    mapboxAccessToken?: string;
    initialViewState?: {
      longitude?: number;
      latitude?: number;
      zoom?: number;
      [key: string]: any;
    };
    mapStyle?: string;
    onMove?: (evt: any) => void;
    style?: React.CSSProperties;
    ref?: React.RefObject<any>;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export interface MarkerProps {
    longitude: number;
    latitude: number;
    anchor?: string;
    offset?: number[];
    onClick?: () => void;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export interface LayerProps {
    id: string;
    type: string;
    paint?: {
      [key: string]: any;
    };
    [key: string]: any;
  }
  
  export interface SourceProps {
    id: string;
    type: string;
    data: any;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export interface PopupProps {
    longitude: number;
    latitude: number;
    anchor?: string;
    offset?: number[];
    onClose?: () => void;
    closeButton?: boolean;
    closeOnClick?: boolean;
    children?: React.ReactNode;
    [key: string]: any;
  }
  
  export interface NavigationControlProps {
    position?: string;
    [key: string]: any;
  }
  
  export interface GeolocateControlProps {
    position?: string;
    positionOptions?: {
      enableHighAccuracy?: boolean;
      [key: string]: any;
    };
    trackUserLocation?: boolean;
    [key: string]: any;
  }
  
  export const Map: React.FC<MapProps>;
  export const Marker: React.FC<MarkerProps>;
  export const Layer: React.FC<LayerProps>;
  export const Source: React.FC<SourceProps>;
  export const Popup: React.FC<PopupProps>;
  export const NavigationControl: React.FC<NavigationControlProps>;
  export const GeolocateControl: React.FC<GeolocateControlProps>;
} 