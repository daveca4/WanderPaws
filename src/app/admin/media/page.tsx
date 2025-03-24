'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { S3Asset, getS3Assets, uploadFileToS3, getThumbnailUrl } from '@/lib/s3Service';
// Removed mock data import
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

// Add a local interface that extends S3Asset with our admin-specific fields
interface AdminMediaAsset extends S3Asset {
  uploaderInfo?: string;
}

export default function AdminMediaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mediaAssets, setMediaAssets] = useState<AdminMediaAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AdminMediaAsset[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
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
    loadAssets();
  }, []);

  // Function to load assets from S3
  const loadAssets = async () => {
    try {
      setLoading(true);
      
      // Load ALL media from the root of bucket - admin sees everything
      const assets = await getS3Assets({
        maxResults: 500
      });
      
      console.log(`Admin view: Loaded ${assets.length} total assets from S3`);
      
      // No filtering by walker ID - admins see all media
      // Add some additional metadata for display purposes
      const enhancedAssets = assets.map(asset => {
        // Log tags for debugging
        if (asset.tags && asset.tags.length > 0) {
          console.log(`Asset ${asset.key} has tags: ${asset.tags.join(', ')}`);
        }
        
        // Check if this asset is associated with a specific walker
        const walkerTag = asset.tags?.find(tag => tag.startsWith('walker-'));
        const walkerInfo = walkerTag ? walkerTag.replace('walker-', '') : 'Unknown';
        
        // Return enhanced asset with additional metadata
        return {
          ...asset,
          // Add information about the uploader - in a real app, you'd look up the walker name
          uploaderInfo: walkerInfo
        };
      });
      
      console.log(`Admin view: Processing ${enhancedAssets.length} assets for display`);
      
      setMediaAssets(enhancedAssets);
      setFilteredAssets(enhancedAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
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
        (asset as any).dogName?.toLowerCase().includes(query) ||
        (asset as any).walkerName?.toLowerCase().includes(query) ||
        asset.walkId?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        comparison = new Date(a.uploaded).getTime() - new Date(b.uploaded).getTime();
      } else if (sortBy === 'size') {
        comparison = a.size - b.size;
      } else if (sortBy === 'name') {
        comparison = a.key.localeCompare(b.key);
      } else if (sortBy === 'type') {
        comparison = a.contentType.localeCompare(b.contentType);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredAssets(result);
  }, [mediaAssets, selectedFilter, searchQuery, sortBy, sortOrder]);

  // Toggle asset selection
  const toggleSelectAsset = (assetId: string) => {
    if (selectedAssets.includes(assetId)) {
      setSelectedAssets(selectedAssets.filter(id => id !== assetId));
    } else {
      setSelectedAssets([...selectedAssets, assetId]);
    }
  };

  // Select/deselect all assets
  const toggleSelectAll = () => {
    if (selectedAssets.length === filteredAssets.length) {
      setSelectedAssets([]);
    } else {
      setSelectedAssets(filteredAssets.map(asset => asset.id));
    }
  };

  // Delete selected assets (mock implementation)
  const handleDeleteSelected = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedAssets.length} selected items?`)) {
      setIsDeleting(true);
      
      try {
        // In a real implementation, this would call an API to delete the assets
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Remove deleted assets from state
        const remainingAssets = mediaAssets.filter(asset => !selectedAssets.includes(asset.id));
        setMediaAssets(remainingAssets);
        setSelectedAssets([]);
        
        alert('Selected media files have been deleted');
      } catch (error) {
        console.error('Error deleting assets:', error);
        alert('Failed to delete media files');
      } finally {
        setIsDeleting(false);
      }
    }
  };

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
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (selectedFiles.length !== validFiles.length) {
      setUploadErrors(prev => [...prev, 'Some files were excluded because they are not supported. Only images and videos are allowed.']);
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
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (droppedFiles.length !== validFiles.length) {
      setUploadErrors(prev => [...prev, 'Some files were excluded because they are not supported. Only images and videos are allowed.']);
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
      // Upload each file to S3 using the updated S3 service
      const uploads = filesToUpload.map(async (file, index) => {
        const fileId = fileIds[index];
        
        try {
          // Use the updated uploadFileToS3 function with no prefix to put in root of bucket
          const result = await uploadFileToS3(file, {
            tags: ['admin-upload', 'media-library']
          });
          
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
      await Promise.all(uploads);
      
      // Clear all progress intervals
      progressIntervals.forEach(interval => clearInterval(interval));
      
      // Clear the files to upload
      setFilesToUpload([]);
      
      // Reload assets to show the newly uploaded files
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

  // Function to copy URL to clipboard
  const copyUrlToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
      .then(() => {
        // Show success message (would implement toast notification in real app)
        console.log('URL copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
      });
  };

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Gallery</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage uploaded media from dog walkers and admin uploads
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
              href="/admin/content-ai"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Content AI
            </Link>
            <Link 
              href="/admin"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Dashboard
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
          
          {/* Sort controls and bulk actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0 mt-4">
            <div className="flex items-center space-x-2">
              <label htmlFor="sort" className="text-sm text-gray-500">Sort by:</label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm border-gray-300 rounded-md"
              >
                <option value="date">Upload Date</option>
                <option value="size">File Size</option>
                <option value="name">File Name</option>
                <option value="type">File Type</option>
              </select>
              <button 
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 rounded-md hover:bg-gray-100"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                )}
              </button>
            </div>
            
            {selectedAssets.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{selectedAssets.length} selected</span>
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Selected'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Media grid */}
        <div className="bg-white shadow rounded-lg">
          {loading ? (
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploader</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssets.map(asset => (
                    <tr key={asset.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {asset.contentType.startsWith('image/') ? (
                            <div 
                              className="flex-shrink-0 h-16 w-16 rounded overflow-hidden cursor-pointer"
                              onClick={() => openMediaPreview(asset)}
                            >
                              <img
                                className="h-16 w-16 rounded object-cover hover:opacity-80 transition-opacity"
                                src={getThumbnailUrl(asset, 'small')}
                                alt=""
                                loading="lazy"
                              />
                            </div>
                          ) : asset.contentType.startsWith('video/') ? (
                            <div 
                              className="flex-shrink-0 h-16 w-16 rounded overflow-hidden relative cursor-pointer bg-gray-100"
                              onClick={() => openMediaPreview(asset)}
                            >
                              <video
                                className="h-16 w-16 object-cover"
                                src={asset.url}
                                muted
                                preload="metadata"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                          ) : (
                            <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded flex items-center justify-center">
                              {getFileIcon(asset.contentType)}
                            </div>
                          )}
                          <div className="ml-4 max-w-xs truncate">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {asset.key.split('/').pop()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {asset.contentType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          asset.contentType.startsWith('image/') 
                            ? 'bg-blue-100 text-blue-800' 
                            : asset.contentType.startsWith('video/') 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {asset.contentType.split('/')[0]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(asset.uploaded)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Display the uploader information */}
                        <div className="text-sm text-gray-900">
                          {asset.uploaderInfo && asset.uploaderInfo !== 'Unknown' ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Walker: {asset.uploaderInfo}
                            </span>
                          ) : asset.tags?.some(tag => tag === 'admin-upload') ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                              Admin Upload
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              Unknown
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(asset.size / 1024 / 1024).toFixed(2)} MB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => openMediaPreview(asset)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => copyUrlToClipboard(asset.url)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Copy URL
                          </button>
                          <button
                            onClick={() => toggleSelectAsset(asset.id)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            {selectedAssets.includes(asset.id) ? 'Deselect' : 'Select'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                        Upload images and videos for use in content creation and marketing materials.
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
                          Supported formats: JPEG, PNG, GIF, MP4, MOV
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