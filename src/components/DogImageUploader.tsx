'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface DogImageUploaderProps {
  initialImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
}

export default function DogImageUploader({ initialImageUrl, onImageUploaded }: DogImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl || '');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    try {
      // Step 1: Get a presigned URL for the upload
      const presignedUrlResponse = await fetch('/api/s3/presigned-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          prefix: 'dog-profiles',
          metadata: {
            fileType: 'dog-profile',
            timestamp: new Date().toISOString()
          }
        })
      });
      
      if (!presignedUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }
      
      const { uploadUrl, key, bucket } = await presignedUrlResponse.json();
      
      // Simulated progress - this is just for UI feedback
      setUploadProgress(30);
      
      // Step 2: Upload the file to S3 using the presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type
        },
        body: file
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }
      
      setUploadProgress(90);
      
      // Step 3: Construct the full URL to the uploaded image
      const fullImageUrl = `https://${bucket}.s3.amazonaws.com/${key}`;
      
      // Update state and notify parent component
      console.log('Upload complete, setting image URL:', fullImageUrl);
      setImageUrl(fullImageUrl);
      onImageUploaded(fullImageUrl);
      setUploadProgress(100);
      
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
  };

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
              <Image 
                src={imageUrl} 
                alt="Dog preview" 
                fill 
                unoptimized={true}
                className="object-cover"
                key={imageUrl}
                onError={() => setImageUrl('')}
                onLoad={() => console.log('Image loaded successfully:', imageUrl)}
              />
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
        </div>
      </div>
    </div>
  );
} 