'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface DogImageUploaderProps {
  initialImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
}

export default function DogImageUploader({ initialImageUrl, onImageUploaded }: DogImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl || '');
  const [originalKey, setOriginalKey] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [useImgFallback, setUseImgFallback] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize the file upload function to avoid recreating it on each render
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image is too large. Maximum size is 5MB.');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    setUseImgFallback(false);
    
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prefix', 'dog-profiles');
      formData.append('metadata', JSON.stringify({
        fileType: 'dog-profile',
        timestamp: Date.now().toString()
      }));
      
      // Simulated progress - this is just for UI feedback
      setUploadProgress(30);
      
      // Upload directly to the server-side endpoint
      const uploadResponse = await fetch('/api/s3/direct-upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', errorText);
        throw new Error('Failed to upload image');
      }
      
      setUploadProgress(90);
      
      // Get the response data
      const result = await uploadResponse.json();
      
      // Update state and notify parent component
      console.log('Image upload successful, URL:', result.location);
      setImageUrl(result.location);
      setOriginalKey(result.originalKey || result.key); // Store the original key for refreshing URLs
      onImageUploaded(result.location);
      setUploadProgress(100);
      
      // Clear the file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Force a re-render by triggering a state update
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  }, [onImageUploaded]);
  
  // Function to refresh the URL if it expires
  const refreshImageUrl = useCallback(async () => {
    if (!originalKey) return;
    
    try {
      const refreshResponse = await fetch('/api/s3/refresh-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: originalKey,
          expiresIn: 60 * 60 * 24 * 7 // 7 days
        })
      });
      
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh image URL');
      }
      
      const result = await refreshResponse.json();
      console.log('URL refreshed successfully:', result.location);
      
      // Update the URL
      setImageUrl(result.location);
      onImageUploaded(result.location);
      setUseImgFallback(false); // Reset fallback if it was being used
    } catch (error) {
      console.error('Error refreshing image URL:', error);
    }
  }, [originalKey, onImageUploaded]);

  // Handle image loading errors by refreshing the URL
  const handleImageError = useCallback(() => {
    console.error('Image failed to load with Next/Image:', imageUrl);
    
    // First try the fallback
    setUseImgFallback(true);
    
    // If we have the original key, try to refresh the URL
    if (originalKey) {
      refreshImageUrl();
    }
  }, [imageUrl, originalKey, refreshImageUrl]);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Dog Profile Image
      </label>
      
      <div className="flex items-start space-x-4">
        <div 
          className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer"
          onClick={triggerFileInput}
        >
          {imageUrl ? (
            <div className="relative w-full h-full overflow-hidden rounded-lg">
              {useImgFallback ? (
                // Fallback to a standard img tag if Next/Image fails
                <img 
                  src={imageUrl} 
                  alt="Dog preview" 
                  className="w-full h-full object-cover"
                  onError={() => {
                    console.error('Image also failed to load with standard img tag:', imageUrl);
                    // If we have the original key, try to refresh instead of clearing
                    if (originalKey) {
                      refreshImageUrl();
                    } else {
                      setImageUrl('');
                      setUploadError('Image cannot be displayed. It was uploaded but may have restricted access.');
                    }
                  }}
                />
              ) : (
                <Image 
                  src={imageUrl} 
                  alt="Dog preview" 
                  fill 
                  loading="lazy"
                  unoptimized={true}
                  className="object-cover"
                  key={imageUrl}
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => handleImageError()}
                  sizes="128px"
                  priority={false}
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium opacity-0 hover:opacity-100">Change</span>
              </div>
            </div>
          ) : (
            <div className="text-center p-2">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="mt-1 block text-xs font-medium text-gray-700">Add Photo</span>
            </div>
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-gray-500">
            Upload a profile picture for your dog. Square images work best.
          </p>
          {isUploading && (
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}
          {uploadError && (
            <p className="text-sm text-red-600 mt-2">{uploadError}</p>
          )}
          {originalKey && (
            <button 
              type="button"
              onClick={refreshImageUrl}
              className="mt-2 text-xs text-primary-600 hover:text-primary-800 underline"
            >
              Refresh image
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 