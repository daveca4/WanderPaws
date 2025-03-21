'use client';

import { useState, useRef } from 'react';
import { uploadFileToS3, S3UploadResult, S3Asset, getS3Assets, getThumbnailUrl } from '@/lib/s3Service';
import Image from 'next/image';
import { useEffect } from 'react';
import MediaViewer from '@/components/MediaViewer';

interface MediaUploaderProps {
  walkId: string;
  maxFiles?: number;
  allowedFileTypes?: string[];
  onUploadComplete?: (assets: S3Asset[]) => void;
}

export default function MediaUploader({
  walkId,
  maxFiles = 10,
  allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'image/heic', 'video/quicktime'],
  onUploadComplete
}: MediaUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [uploadedAssets, setUploadedAssets] = useState<S3Asset[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<S3Asset | null>(null);

  // Load any existing assets for this walk
  useEffect(() => {
    loadExistingAssets();

    // Set up auto-refresh polling
    let refreshInterval: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        if (!uploading) {
          console.log('Auto-refreshing media assets...');
          loadExistingAssets();
        }
      }, 15000); // Check for new assets every 15 seconds
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [walkId, autoRefresh, uploading]);

  // Extract loadExistingAssets to a separate function to call after upload
  const loadExistingAssets = async () => {
    if (!walkId) return;
    
    try {
      setLoading(true);
      const assets = await getS3Assets({ walkId });
      console.log(`Loaded ${assets.length} assets for walk ${walkId}`);
      setUploadedAssets(assets);
      return assets; // Return the assets so we can use them directly
    } catch (error) {
      console.error('Error loading existing assets:', error);
      return []; // Return empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const selectedFiles = Array.from(e.target.files);
    
    // Filter out unsupported file types
    const validFiles = selectedFiles.filter(file => 
      allowedFileTypes.includes(file.type)
    );
    
    const invalidFiles = selectedFiles.length - validFiles.length;
    if (invalidFiles > 0) {
      setUploadErrors([...uploadErrors, `${invalidFiles} file(s) were not added because they're not supported.`]);
    }
    
    // Check if adding these would exceed the max
    if (files.length + validFiles.length > maxFiles) {
      setUploadErrors([...uploadErrors, `You can only upload a maximum of ${maxFiles} files.`]);
      // Only add files up to the max
      const remainingSlots = maxFiles - files.length;
      if (remainingSlots <= 0) return;
      
      setFiles([...files, ...validFiles.slice(0, remainingSlots)]);
    } else {
      setFiles([...files, ...validFiles]);
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    // Filter out unsupported file types
    const validFiles = droppedFiles.filter(file => 
      allowedFileTypes.includes(file.type)
    );
    
    const invalidFiles = droppedFiles.length - validFiles.length;
    if (invalidFiles > 0) {
      setUploadErrors([...uploadErrors, `${invalidFiles} file(s) were not added because they're not supported.`]);
    }
    
    // Check if adding these would exceed the max
    if (files.length + validFiles.length > maxFiles) {
      setUploadErrors([...uploadErrors, `You can only upload a maximum of ${maxFiles} files.`]);
      // Only add files up to the max
      const remainingSlots = maxFiles - files.length;
      if (remainingSlots <= 0) return;
      
      setFiles([...files, ...validFiles.slice(0, remainingSlots)]);
    } else {
      setFiles([...files, ...validFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    setUploadErrors([]);
    
    const uploads = files.map(async (file, index) => {
      try {
        // Create a unique ID for tracking progress
        const fileId = `${index}-${file.name}`;
        
        // Initialize progress for this file
        setProgress(prev => ({
          ...prev,
          [fileId]: 0
        }));
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const currentProgress = prev[fileId] || 0;
            if (currentProgress >= 95) {
              clearInterval(progressInterval);
              return prev;
            }
            return {
              ...prev,
              [fileId]: currentProgress + 5
            };
          });
        }, 300);
        
        // Upload the file with the new API that uses PUT request
        const result = await uploadFileToS3(file, {
          walkId,
          tags: ['walk-media', 'user-uploaded'],
        });
        
        // Set progress to 100% when complete
        clearInterval(progressInterval);
        setProgress(prev => ({
          ...prev,
          [fileId]: 100
        }));
        
        return result;
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Provide more helpful error message based on error type
        let errorMessage = `Failed to upload ${file.name}: `;
        
        if (error instanceof Error) {
          const errorLower = error.message.toLowerCase();
          if (errorLower.includes('timed out')) {
            errorMessage += 'Upload timed out. The file may be too large or your connection is slow.';
          } else if (errorLower.includes('too large')) {
            errorMessage += error.message;
          } else if (errorLower.includes('failed to fetch') || errorLower.includes('network error')) {
            if (file.name.toLowerCase().endsWith('.heic')) {
              errorMessage += 'HEIC file upload failed. Try converting the image to JPEG before uploading.';
            } else if (file.name.toLowerCase().endsWith('.mov')) {
              errorMessage += 'MOV file upload failed. Try converting to MP4 or compressing the video before uploading.';
            } else {
              errorMessage += 'Network connection error. Please check your internet connection and try again.';
            }
          } else {
            errorMessage += error.message;
          }
        } else {
          errorMessage += 'Unknown error';
        }
        
        setUploadErrors(prev => [...prev, errorMessage]);
        return null;
      }
    });
    
    try {
      const results = await Promise.all(uploads);
      const successfulUploads = results.filter(result => result !== null) as S3UploadResult[];
      
      if (successfulUploads.length > 0) {
        // Convert S3UploadResult to S3Asset
        const newAssets: S3Asset[] = successfulUploads.map(result => ({
          id: result.etag,
          key: result.key,
          url: result.location,
          contentType: result.contentType,
          size: 0, // We don't have this info from the upload result
          uploaded: new Date().toISOString(),
          walkId,
        }));
        
        // Clear the files queue
        setFiles([]);
        
        // Reload assets from the server to ensure the latest data
        const freshAssets = await loadExistingAssets() || [];
        
        // Call the onUploadComplete callback with the fresh assets
        if (onUploadComplete && freshAssets.length > 0) {
          console.log(`Calling onUploadComplete with ${freshAssets.length} assets`);
          onUploadComplete(freshAssets);
        }
      }
    } catch (error) {
      console.error('Error during upload process:', error);
      setUploadErrors(prev => [
        ...prev,
        `An unexpected error occurred during the upload process.`
      ]);
    } finally {
      setUploading(false);
    }
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
  };

  // Add functions to open and close the media preview
  const openMediaPreview = (asset: S3Asset) => {
    setPreviewAsset(asset);
  };

  const closeMediaPreview = () => {
    setPreviewAsset(null);
  };

  return (
    <div className="space-y-6">
      {/* File drop area */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-12 w-12 mx-auto text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Drag and drop files, or click to select
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          Supported formats: JPEG, PNG, GIF, MP4, HEIC, QuickTime
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Maximum {maxFiles} files
        </p>
        <input
          type="file"
          multiple
          accept={allowedFileTypes.join(',')}
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
      </div>

      {/* Selected files */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Selected files ({files.length})
          </h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={`${index}-${file.name}`} className="flex items-center justify-between">
                <div className="flex items-center">
                  {file.type.startsWith('image/') ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span className="text-sm text-gray-600 truncate max-w-xs">{file.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-gray-500"
                  disabled={uploading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <button 
              type="button"
              onClick={startUpload}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                'Upload Files'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && Object.keys(progress).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Upload Progress
          </h4>
          <div className="space-y-3">
            {files.map((file, index) => {
              const fileId = `${index}-${file.name}`;
              const fileProgress = progress[fileId] || 0;
              
              return (
                <div key={fileId} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 truncate">{file.name}</span>
                    <span className="text-xs text-gray-600">{fileProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-primary-600 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${fileProgress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error messages */}
      {uploadErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium mb-2">The following errors occurred:</p>
              <ul className="text-xs list-disc list-inside space-y-1">
                {uploadErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded files */}
      {!loading && uploadedAssets.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              Uploaded Media ({uploadedAssets.length})
            </h4>
            <div className="flex items-center space-x-4">
              <label className="flex items-center text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={toggleAutoRefresh}
                  className="mr-1.5 h-3.5 w-3.5 rounded text-primary-600"
                />
                Auto-refresh
              </label>
              <button 
                onClick={async () => {
                  setLoading(true);
                  const refreshedAssets = await loadExistingAssets() || [];
                  console.log(`Refreshed media gallery - found ${refreshedAssets.length} assets`);
                  setLoading(false);
                }}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {uploadedAssets.map(asset => (
              <div key={asset.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
                {/* Enhanced Media Preview */}
                <div 
                  className="aspect-w-16 aspect-h-9 bg-gray-100 overflow-hidden cursor-pointer" 
                  onClick={() => openMediaPreview(asset)}
                >
                  {asset.contentType.startsWith('image/') ? (
                    /* Image with hover zoom effect */
                    <div className="relative h-full w-full">
                      <img
                        src={getThumbnailUrl(asset, 'medium')}
                        alt=""
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          console.error(`Failed to load image: ${asset.url}`);
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItaW1hZ2UiPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiPjwvY2lyY2xlPjxwb2x5bGluZSBwb2ludHM9IjIxIDE1IDE2IDEwIDUgMjEiPjwvcG9seWxpbmU+PC9zdmc+';
                        }}
                      />
                      {/* Image overlay with view button */}
                      <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="bg-white bg-opacity-90 p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  ) : asset.contentType.startsWith('video/') ? (
                    /* Video with playable preview */
                    <div className="relative h-full w-full">
                      <video 
                        className="object-cover w-full h-full" 
                        src={asset.url}
                        preload="metadata"
                        muted
                        playsInline
                        onMouseOver={(e) => e.currentTarget.play().catch(err => console.log('Preview play prevented:', err))}
                        onMouseOut={(e) => e.currentTarget.pause()}
                        onError={(e) => {
                          console.error(`Failed to load video: ${asset.url}`);
                          e.currentTarget.parentElement!.innerHTML = `
                            <div class="flex items-center justify-center h-full w-full bg-gray-100">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                          `;
                        }}
                      />
                      {/* Video overlay with play button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-black bg-opacity-60 p-3 rounded-full hover:bg-opacity-80 transition-all duration-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  ) : (
                    /* Fallback for other file types */
                    <div className="h-full w-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-2 text-xs text-gray-500 flex justify-between items-center">
                  <span className="truncate" title={asset.key.split('/').pop() || ''}>
                    {asset.key.split('/').pop()?.substring(0, 12)}{(asset.key.split('/').pop()?.length || 0) > 12 ? '...' : ''}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(asset.uploaded).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media viewer modal */}
      {previewAsset && (
        <MediaViewer 
          asset={previewAsset}
          onClose={closeMediaPreview}
        />
      )}
    </div>
  );
} 