'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ensurePresignedUrl } from '@/lib/s3Service';

interface S3ImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  defaultImage?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export default function S3Image({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  defaultImage = '/images/default-placeholder.png',
  sizes = '100vw',
  priority = false,
  onLoad,
  onError
}: S3ImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(defaultImage);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      if (!src) {
        if (isMounted) {
          setImageSrc(defaultImage);
          setIsLoading(false);
        }
        return;
      }
      
      try {
        setIsLoading(true);
        const presignedUrl = await ensurePresignedUrl(src, defaultImage);
        
        if (isMounted) {
          setImageSrc(presignedUrl);
          setIsLoading(false);
          setError(false);
        }
      } catch (err) {
        console.error('Failed to load S3 image:', err);
        if (isMounted) {
          setImageSrc(defaultImage);
          setIsLoading(false);
          setError(true);
          if (onError) onError();
        }
      }
    };
    
    loadImage();
    
    return () => {
      isMounted = false;
    };
  }, [src, defaultImage, onError]);

  const handleImageError = () => {
    console.warn(`Failed to load image: ${src}`);
    setImageSrc(defaultImage);
    setError(true);
    if (onError) onError();
  };

  const handleImageLoad = () => {
    if (onLoad) onLoad();
  };

  return (
    <>
      {isLoading && (
        <div className={`bg-gray-200 animate-pulse ${className}`} style={{ width, height }} />
      )}
      
      <Image
        src={imageSrc}
        alt={alt}
        width={fill ? undefined : width || 100}
        height={fill ? undefined : height || 100}
        fill={fill}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        sizes={sizes}
        priority={priority}
        onError={handleImageError}
        onLoad={handleImageLoad}
        unoptimized={true}
      />
    </>
  );
} 