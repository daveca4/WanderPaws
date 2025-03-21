'use client';

import { useState, useEffect, useMemo } from 'react';
import { CloudinaryAsset, getAssets, uploadMedia } from '@/lib/cloudinaryService';
import { S3Asset, getS3Assets } from '@/lib/s3Service';
import Image from 'next/image';

interface MediaLibraryProps {
  onSelect?: (assets: CloudinaryAsset[]) => void;
  maxSelection?: number;
  selectedAssets?: CloudinaryAsset[];
  resourceType?: 'image' | 'video' | 'all';
  includeWalkerUploads?: boolean;
}

// Convert S3Asset to CloudinaryAsset format for compatibility
const convertS3ToCloudinaryFormat = (s3Asset: S3Asset): CloudinaryAsset => {
  return {
    id: s3Asset.id,
    publicId: s3Asset.key,
    url: s3Asset.url,
    format: s3Asset.contentType.split('/')[1] || 'unknown',
    type: s3Asset.contentType.startsWith('image/') ? 'image' : 'video',
    createdAt: s3Asset.uploaded,
    fileSize: s3Asset.size,
    tags: s3Asset.tags || [],
  };
};

export default function MediaLibrary({
  onSelect,
  maxSelection = 0,
  selectedAssets = [],
  resourceType = 'all',
  includeWalkerUploads = true
}: MediaLibraryProps) {
  const [assets, setAssets] = useState<CloudinaryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedAssets.map(a => a.id));
  const [filter, setFilter] = useState<'all' | 'image' | 'video' | 'walker' | 'admin'>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isSelectionThrottled, setIsSelectionThrottled] = useState(false);
  
  useEffect(() => {
    const delayedLoad = setTimeout(() => {
      loadAssets();
    }, 100);
    
    return () => clearTimeout(delayedLoad);
  }, []);
  
  const loadAssets = async () => {
    setLoading(true);
    try {
      // Load existing Cloudinary assets
      let cloudinaryAssets: CloudinaryAsset[] = [];
      try {
        cloudinaryAssets = await loadCloudinaryAssets();
      } catch (cloudinaryError) {
        console.error('Error loading Cloudinary assets:', cloudinaryError);
        // Continue with empty Cloudinary assets
      }
      
      // Load walker uploads from S3 if that option is enabled
      let walkerAssets: CloudinaryAsset[] = [];
      try {
        if (includeWalkerUploads) {
          walkerAssets = await loadWalkerUploads();
        }
      } catch (s3Error) {
        console.error('Error loading S3 assets:', s3Error);
      }
      
      // Combine both sets of assets
      const combinedAssets = [...cloudinaryAssets, ...walkerAssets];
      console.log(`Loaded ${cloudinaryAssets.length} Cloudinary assets and ${walkerAssets.length} S3 assets`);
      
      setAssets(combinedAssets);
    } catch (error) {
      console.error('Error loading media assets:', error);
      // Fallback to empty array on error
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // Load Cloudinary assets (existing implementation)
  const loadCloudinaryAssets = async (): Promise<CloudinaryAsset[]> => {
    // API endpoint call implementation
    const queryParams = new URLSearchParams();
    if (resourceType !== 'all') {
      queryParams.set('resourceType', resourceType);
    }
    
    try {
      const response = await fetch(`/api/cloudinary/assets?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Cloudinary assets');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Cloudinary assets:', error);
      return [];
    }
  };

  // Load walker uploads from S3
  const loadWalkerUploads = async (): Promise<CloudinaryAsset[]> => {
    try {
      // Get S3 assets using the updated AWS SDK v3 implementation
      const s3Assets = await getS3Assets();
      
      // Convert S3 assets to CloudinaryAsset format for compatibility
      return s3Assets.map(asset => convertS3ToCloudinaryFormat(asset));
    } catch (error) {
      console.error('Error loading walker uploads:', error);
      return [];
    }
  };
  
  const handleAssetSelect = (asset: CloudinaryAsset) => {
    if (isSelectionThrottled) return;
    
    setIsSelectionThrottled(true);
    setTimeout(() => setIsSelectionThrottled(false), 50);
    
    if (selectedIds.includes(asset.id)) {
      // Deselect
      setSelectedIds(prevSelected => prevSelected.filter(id => id !== asset.id));
    } else {
      // Select (if within max selection limit)
      if (maxSelection === 0 || selectedIds.length < maxSelection) {
        setSelectedIds(prevSelected => [...prevSelected, asset.id]);
      } else if (maxSelection === 1) {
        // Replace if only one selection allowed
        setSelectedIds([asset.id]);
      }
    }
  };
  
  useEffect(() => {
    if (onSelect) {
      const debouncedSelection = setTimeout(() => {
        const selected = assets.filter(asset => selectedIds.includes(asset.id));
        onSelect(selected);
      }, 100);
      
      return () => clearTimeout(debouncedSelection);
    }
  }, [selectedIds, assets, onSelect]);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);
      
      const file = e.target.files[0];
      // In a real implementation, you'd call uploadMedia
      // await uploadMedia(file);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Reload assets after upload
      await loadAssets();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  const filteredAssets = useMemo(() => {
    if (filter === 'all') return assets;
    if (filter === 'image') return assets.filter(asset => asset.type === 'image');
    if (filter === 'video') return assets.filter(asset => asset.type === 'video');
    if (filter === 'walker') return assets.filter(asset => asset.tags.includes('user-uploaded') || asset.tags.includes('walk-media'));
    if (filter === 'admin') return assets.filter(asset => asset.tags.includes('admin-upload') || asset.publicId.includes('admin-uploads'));
    return assets;
  }, [assets, filter]);
  
  const paginatedAssets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAssets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAssets, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    document.querySelector('.media-library-grid')?.scrollTo(0, 0);
  };
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Media Library</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {setFilter('all'); setCurrentPage(1);}}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'all' 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {setFilter('image'); setCurrentPage(1);}}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'image' 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Images
              </button>
              <button
                onClick={() => {setFilter('video'); setCurrentPage(1);}}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'video' 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Videos
              </button>
              {includeWalkerUploads && (
                <button
                  onClick={() => {setFilter('walker'); setCurrentPage(1);}}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filter === 'walker' 
                      ? 'bg-primary-100 text-primary-800' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Walker Uploads
                </button>
              )}
              <button
                onClick={() => {setFilter('admin'); setCurrentPage(1);}}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'admin' 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Admin Uploads
              </button>
            </div>
            <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 cursor-pointer">
              Upload
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
        
        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Uploading... {uploadProgress}%</p>
          </div>
        )}
        
        {!loading && filteredAssets.length > 0 && (
          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <div className="flex space-x-2 items-center">
              <span>Showing {paginatedAssets.length} of {filteredAssets.length} items</span>
              {maxSelection > 0 && selectedIds.length > 0 && (
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Clear Selection
                </button>
              )}
              {maxSelection > 0 && filteredAssets.length > 0 && selectedIds.length < Math.min(maxSelection, filteredAssets.length) && (
                <button
                  onClick={() => {
                    // Select all visible assets, up to the max selection limit
                    const availableSpace = maxSelection - selectedIds.length;
                    if (availableSpace <= 0) return;
                    
                    const newIds = [...selectedIds];
                    const idsToAdd = paginatedAssets
                      .filter(asset => !selectedIds.includes(asset.id))
                      .slice(0, availableSpace)
                      .map(asset => asset.id);
                    
                    setSelectedIds([...newIds, ...idsToAdd]);
                  }}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  Select Page
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span>Page {currentPage} of {totalPages}</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-sm border-gray-300 rounded-md"
              >
                <option value="20">20 per page</option>
                <option value="40">40 per page</option>
                <option value="60">60 per page</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-4 py-5 sm:p-6 media-library-grid" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No media assets found. Upload some to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {paginatedAssets.map(asset => (
              <div 
                key={asset.id}
                onClick={() => handleAssetSelect(asset)}
                className={`relative rounded-lg overflow-hidden border ${
                  selectedIds.includes(asset.id) 
                    ? 'border-primary-500 ring-2 ring-primary-500' 
                    : 'border-gray-200 hover:border-gray-300'
                } cursor-pointer transition-all duration-200`}
              >
                {asset.type === 'image' ? (
                  <div className="relative pt-[56.25%] bg-gray-100">
                    <img
                      loading="lazy" 
                      src={asset.url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative pt-[56.25%] bg-gray-100">
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-2">
                  <p className="text-xs text-gray-500 truncate">
                    {asset.publicId.split('/').pop()}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      {asset.type === 'image' ? 'Image' : 'Video'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {(asset.fileSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  {asset.tags.includes('user-uploaded') && (
                    <div className="mt-1">
                      <span className="text-xs bg-blue-100 px-2 py-0.5 rounded text-blue-600">
                        Walker Upload
                      </span>
                    </div>
                  )}
                  {(asset.tags.includes('admin-upload') || asset.publicId.includes('admin-uploads')) && (
                    <div className="mt-1">
                      <span className="text-xs bg-purple-100 px-2 py-0.5 rounded text-purple-600">
                        Admin Upload
                      </span>
                    </div>
                  )}
                </div>
                
                {selectedIds.includes(asset.id) && (
                  <>
                    <div className="absolute top-2 right-2 bg-primary-500 rounded-full w-6 h-6 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <button 
                      className="absolute top-2 left-2 bg-white bg-opacity-90 rounded-full w-6 h-6 flex items-center justify-center text-red-600 hover:text-red-800 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIds(prev => prev.filter(id => id !== asset.id));
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {!loading && totalPages > 1 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
          <nav className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredAssets.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredAssets.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </nav>
        </div>
      )}
      
      {maxSelection > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {selectedIds.length} of {maxSelection} items selected
            </p>
            {selectedIds.length > 0 && (
              <button
                onClick={() => setSelectedIds([])}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 