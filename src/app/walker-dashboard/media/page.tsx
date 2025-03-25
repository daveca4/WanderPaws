'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { S3Asset, getS3Assets, uploadFileToS3, getThumbnailUrl } from '@/lib/s3Service';
import RouteGuard from '@/components/RouteGuard';
import MediaViewer from '@/components/MediaViewer';

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// File types supported for upload
const supportedFileTypes = [
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'image/webp', 
  'video/mp4',
  'image/heic',
  'video/quicktime'
];

export default function WalkerMediaPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mediaAssets, setMediaAssets] = useState<S3Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<S3Asset[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingAssets, setLoadingAssets] = useState(true);
  
  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  // Add auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Add a Modal component for viewing media in full-screen
  const [previewAsset, setPreviewAsset] = useState<S3Asset | null>(null);
  
  // Set up auto-refresh
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;
    
    if (autoRefresh && !isUploading) {
      refreshInterval = setInterval(() => {
        console.log('Auto-refreshing media assets...');
        loadAssets();
      }, 30000); // Check for new assets every 30 seconds
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, isUploading]);

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
  };

  // Load assets on component mount
  useEffect(() => {
    if (user?.profileId) {
      loadAssets();
    }
  }, [user?.profileId]);

  const loadAssets = async () => {
    if (!user?.profileId) return;
    
    try {
      setLoadingAssets(true);
      
      // Get all media assets from S3
      const assets = await getS3Assets({
        maxResults: 500
      });
      
      console.log(`Loaded ${assets.length} total assets from S3`);
      
      // Filter to ONLY show the current walker's uploads
      const walkerAssets = assets.filter(asset => {
        // The walker's tag identifiers
        const walkerTag = `walker-${user.profileId}`;
        const walkerIdTag = user.profileId;
        
        // Check if the asset's tags include the walker's specific tag
        const hasWalkerTag = asset.tags?.some(tag => 
          tag === walkerTag || tag === walkerIdTag
        );
        
        // DEBUG: Log all tags on this asset for debugging
        if (asset.tags && asset.tags.length > 0) {
          console.log(`Asset ${asset.key} has tags: ${asset.tags.join(', ')}`);
        }
        
        // Only include the asset if it has the walker's specific tag
        if (hasWalkerTag) {
          console.log(`Including asset ${asset.key} - has walker tag matching ${user.profileId}`);
        }
        
        return hasWalkerTag;
      });
      
      console.log(`Filtered to ${walkerAssets.length} assets for walker ID ${user.profileId}`);
      
      setMediaAssets(walkerAssets);
      setFilteredAssets(walkerAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoadingAssets(false);
    }
  };

  // Filter and search assets
  useEffect(() => {
    let result = [...mediaAssets];
    
    // Apply content type filter
    if (selectedFilter !== 'all') {
      result = result.filter(asset => 
        asset.contentType.startsWith(selectedFilter)
      );
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(asset => 
        asset.key.toLowerCase().includes(query) || 
        asset.walkId?.toLowerCase().includes(query)
      );
    }
    
    // Sort by upload date, newest first
    result.sort((a, b) => {
      return new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime();
    });
    
    setFilteredAssets(result);
  }, [mediaAssets, selectedFilter, searchQuery]);

  // Get file icon based on content type
  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (contentType.startsWith('video/')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  // Handle file selection for upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    // Filter files by type (images and videos only)
    const validFiles = selectedFiles.filter(file => 
      supportedFileTypes.includes(file.type) || 
      file.name.toLowerCase().endsWith('.heic') || 
      file.name.toLowerCase().endsWith('.mov')
    );
    
    if (selectedFiles.length !== validFiles.length) {
      setUploadErrors(prev => [...prev, 'Some files were excluded because they are not supported.']);
    }
    
    setFilesToUpload(prev => [...prev, ...validFiles]);
    
    // Clear the input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove a file from the upload queue
  const removeFileFromUpload = (index: number) => {
    setFilesToUpload(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  // Handle files dropped into the drop zone
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    // Filter files by type (images and videos only)
    const validFiles = droppedFiles.filter(file => 
      supportedFileTypes.includes(file.type) || 
      file.name.toLowerCase().endsWith('.heic') || 
      file.name.toLowerCase().endsWith('.mov')
    );
    
    if (droppedFiles.length !== validFiles.length) {
      setUploadErrors(prev => [...prev, 'Some files were excluded because they are not supported.']);
    }
    
    setFilesToUpload(prev => [...prev, ...validFiles]);
  };

  // Handle file upload to S3
  const uploadFiles = async () => {
    if (filesToUpload.length === 0) return;
    
    setIsUploading(true);
    setUploadErrors([]);
    
    // For each file, create a file ID for tracking upload progress
    const fileIds = filesToUpload.map((_, index) => `file-${index}`);
    
    // Initialize progress for each file
    const initialProgress = fileIds.reduce((acc, id) => {
      acc[id] = 0;
      return acc;
    }, {} as {[key: string]: number});
    
    setUploadProgress(initialProgress);
    
    // Create a progress simulation interval for UI feedback
    const progressIntervals = fileIds.map((id, index) => {
      return setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[id] || 0;
          if (current >= 95) {
            return prev;
          }
          return {
            ...prev,
            [id]: current + Math.floor(Math.random() * 10) + 1
          };
        });
      }, 300);
    });
    
    try {
      // Ensure we have the walker's ID for tagging
      if (!user?.profileId) {
        throw new Error('Cannot upload files - walker ID is not available');
      }
      
      console.log(`Starting upload of ${filesToUpload.length} files as walker: ${user.profileId}`);
      
      // Upload each file to S3 using the updated S3 service
      const uploads = filesToUpload.map(async (file, index) => {
        const fileId = fileIds[index];
        
        try {
          // Make sure we have proper walker identification tags
          const walkerTag = user.profileId ? `walker-${user.profileId}` : 'unknown-walker';
          
          // These are the critical tags that will be used to filter assets for this walker
          const walkerTags = [
            'walk-media',
            'user-uploaded',
            walkerTag,
            user.profileId // This is important - include the raw profile ID as a tag
          ].filter(Boolean) as string[]; // Ensure all values are defined strings
          
          console.log(`Uploading ${file.name} with tags: ${walkerTags.join(', ')}`);
          
          // Use the updated uploadFileToS3 function with walker-specific tags
          const result = await uploadFileToS3(file, {
            tags: walkerTags
          });
          
          console.log(`Successfully uploaded ${file.name} to ${result.key} with tags: ${result.tags?.join(', ') || 'none'}`);
          
          // Set progress to 100% when complete
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: 100
          }));
          
          return result;
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          setUploadErrors(prev => [
            ...prev,
            `Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          ]);
          return null;
        }
      });
      
      // Wait for all uploads to complete
      const results = await Promise.all(uploads);
      const successfulUploads = results.filter(Boolean);
      console.log(`${successfulUploads.length} files successfully uploaded with walker tags`);
      
      // Clear all progress intervals
      progressIntervals.forEach(interval => clearInterval(interval));
      
      // Clear the files to upload
      setFilesToUpload([]);
      
      // Reload assets to show the newly uploaded files
      console.log('Reloading assets after upload to display walker-specific media...');
      await loadAssets();
      
      // Close the upload modal
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error during upload process:', error);
      setUploadErrors(prev => [
        ...prev,
        `An unexpected error occurred during the upload process.`
      ]);
    } finally {
      // Clear all progress intervals
      progressIntervals.forEach(interval => clearInterval(interval));
      setIsUploading(false);
    }
  };

  // Add this function to open the media preview
  const openMediaPreview = (asset: S3Asset) => {
    setPreviewAsset(asset);
  };

  // Add this function to close the media preview
  const closeMediaPreview = () => {
    setPreviewAsset(null);
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <RouteGuard requiredPermission={{ action: 'upload_walk_media', resource: 'media' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Media Gallery</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your walk photos and videos
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={toggleAutoRefresh}
                className="mr-2 h-4 w-4 rounded text-primary-600"
              />
              Auto-refresh
            </label>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Upload Media
            </button>
            <Link 
              href="/walker-dashboard/walks"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              My Walks
            </Link>
          </div>
        </div>
        
        {/* Filter controls */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  selectedFilter === 'all' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Media
              </button>
              <button 
                onClick={() => setSelectedFilter('image/')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  selectedFilter === 'image/' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Images
              </button>
              <button 
                onClick={() => setSelectedFilter('video/')}
                className={`px-3 py-1 text-sm font-medium rounded-md ${
                  selectedFilter === 'video/' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Videos
              </button>
            </div>
            
            <div className="w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:w-64 text-sm border-gray-300 rounded-md"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Media grid */}
        <div className="bg-white shadow rounded-lg p-6">
          {loadingAssets ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-lg">No media files found</p>
              {searchQuery && (
                <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
              )}
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                Upload Media
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredAssets.map(asset => (
                <div 
                  key={asset.id} 
                  className="relative group rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
                  onClick={() => openMediaPreview(asset)}
                >
                  {/* Media thumbnail */}
                  <div className="aspect-w-1 aspect-h-1 bg-gray-100 overflow-hidden">
                    {asset.contentType.startsWith('image/') ? (
                      <img
                        src={getThumbnailUrl(asset, 'medium')}
                        alt=""
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : asset.contentType.startsWith('video/') ? (
                      <div className="relative h-full w-full">
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        {getFileIcon(asset.contentType)}
                      </div>
                    )}
                  </div>
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="bg-white bg-opacity-90 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </span>
                  </div>
                  
                  {/* File info */}
                  <div className="p-2 text-xs text-gray-500">
                    <div className="truncate" title={asset.key.split('/').pop() || ''}>
                      {asset.key.split('/').pop()?.substring(0, 15)}{(asset.key.split('/').pop()?.length || 0) > 15 ? '...' : ''}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-gray-400">{new Date(asset.uploaded).toLocaleDateString()}</span>
                      {asset.walkId && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                          Walk
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            {/* Modal content */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Upload Media
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Upload photos and videos from your walks
                      </p>
                    </div>
                    
                    {/* Upload area */}
                    <div className="mt-4">
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <h4 className="mt-2 text-sm font-medium text-gray-900">
                          Drag files here or click to browse
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          Supported formats: JPEG, PNG, GIF, MP4, HEIC, MOV
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileSelect}
                          multiple
                          accept="image/*,video/*"
                        />
                      </div>
                      
                      {/* Files to upload */}
                      {filesToUpload.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Selected files ({filesToUpload.length})
                          </h4>
                          <ul className="max-h-40 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-200">
                            {filesToUpload.map((file, index) => (
                              <li key={index} className="px-3 py-2 flex items-center justify-between">
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
                                  <span className="text-sm truncate max-w-xs">{file.name}</span>
                                  <span className="text-xs text-gray-500 ml-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                                <button
                                  type="button"
                                  className="text-gray-400 hover:text-gray-500"
                                  onClick={() => removeFileFromUpload(index)}
                                  disabled={isUploading}
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Upload errors */}
                      {uploadErrors.length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 rounded-md">
                          <h4 className="text-sm font-medium text-red-800">Upload Errors</h4>
                          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                            {uploadErrors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Upload progress */}
                      {isUploading && Object.keys(uploadProgress).length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Upload Progress</h4>
                          <ul className="space-y-2">
                            {Object.entries(uploadProgress).map(([fileId, progress]) => (
                              <li key={fileId} className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>File {parseInt(fileId.split('-')[1]) + 1}</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-primary-600 h-1.5 rounded-full"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={uploadFiles}
                  disabled={isUploading || filesToUpload.length === 0}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media preview modal */}
      {previewAsset && (
        <MediaViewer 
          asset={previewAsset} 
          onClose={closeMediaPreview} 
          formatDate={formatDate}
        />
      )}
    </RouteGuard>
  );
} 