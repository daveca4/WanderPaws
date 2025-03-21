import React, { useState, useEffect } from 'react';
import { S3Asset } from '@/lib/s3Service';

interface MediaViewerProps {
  asset: S3Asset;
  onClose: () => void;
  formatDate?: (date: string) => string;
}

export default function MediaViewer({ asset, onClose, formatDate }: MediaViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string>(asset.url);
  
  useEffect(() => {
    // Reset state when asset changes
    setIsLoading(true);
    setLoadError(false);
    
    // Set initial URL from asset
    setMediaUrl(asset.url);
    
    // For HEIC files, try to get converted URL
    if (asset.key.toLowerCase().endsWith('.heic') && asset.contentType === 'image/heic') {
      // Get a converted URL for viewing
      const getConvertedUrl = async () => {
        try {
          const response = await fetch(`/api/s3/heic-convert?key=${encodeURIComponent(asset.key)}`);
          
          if (response.ok) {
            const data = await response.json();
            setMediaUrl(data.signedUrl);
          }
        } catch (error) {
          console.error('Error getting converted HEIC URL:', error);
          // Keep using original URL if conversion fails
        }
      };
      
      getConvertedUrl();
    }
  }, [asset]);
  
  // Format the date with a default formatter if none provided
  const formatDateString = (date: string) => {
    if (formatDate) return formatDate(date);
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle keyboard navigation (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
  // Format the file size in human-readable form
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-90 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        ></div>
        
        {/* Full-screen modal */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-transparent max-w-7xl w-full h-full flex flex-col items-center justify-center">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 z-50"
              aria-label="Close preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
            
            {/* Media content */}
            <div className="w-full h-full flex items-center justify-center">
              {asset.contentType.startsWith('image/') ? (
                <img
                  src={mediaUrl}
                  alt=""
                  className={`max-w-full max-h-[80vh] object-contain shadow-2xl transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setLoadError(true);
                  }}
                />
              ) : asset.contentType.startsWith('video/') ? (
                <div className={`max-w-full max-h-[80vh] w-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay
                    className="max-w-full max-h-[80vh] mx-auto shadow-2xl rounded"
                    onLoadedData={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setLoadError(true);
                    }}
                  />
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg shadow-lg">
                  <div className="flex items-center justify-center mb-4">
                    {asset.contentType.startsWith('audio/') ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-lg text-center font-medium">
                    {asset.key.split('/').pop()}
                  </p>
                  <p className="text-sm text-center text-gray-500 mt-2">
                    {asset.contentType}
                  </p>
                  <div className="mt-4 text-center">
                    <a
                      href={mediaUrl}
                      download={asset.key.split('/').pop()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Download File
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            {/* Error message */}
            {loadError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
                  <div className="flex items-center justify-center mb-4 text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-center">Failed to load media</h3>
                  <p className="mt-2 text-sm text-gray-500 text-center">
                    The media file could not be loaded. It may be inaccessible or in an unsupported format.
                  </p>
                  <div className="mt-4 flex justify-center">
                    <a
                      href={mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                      Try Opening Directly
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            {/* Media info */}
            <div className="mt-4 bg-white bg-opacity-90 px-4 py-3 rounded-lg text-gray-900">
              <p className="font-medium">{asset.key.split('/').pop()}</p>
              <div className="flex flex-wrap items-center text-sm mt-1 gap-4">
                <span>{formatDateString(asset.uploaded)}</span>
                <span>{formatFileSize(asset.size)}</span>
                <span>{asset.contentType}</span>
                {asset.walkId && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    Walk ID: {asset.walkId}
                  </span>
                )}
                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {asset.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 