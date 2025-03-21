'use client';

import { useState, useEffect } from 'react';
import { CloudinaryAsset, getAssets, uploadMedia } from '@/lib/cloudinaryService';
import Image from 'next/image';

interface MediaLibraryProps {
  onSelect?: (assets: CloudinaryAsset[]) => void;
  maxSelection?: number;
  selectedAssets?: CloudinaryAsset[];
  resourceType?: 'image' | 'video' | 'all';
}

export default function MediaLibrary({
  onSelect,
  maxSelection = 0,
  selectedAssets = [],
  resourceType = 'all'
}: MediaLibraryProps) {
  const [assets, setAssets] = useState<CloudinaryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedAssets.map(a => a.id));
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  useEffect(() => {
    loadAssets();
  }, []);
  
  const loadAssets = async () => {
    setLoading(true);
    try {
      // Use a flag to determine if we should load real assets or mock data
      const useMockData = true; // Change to false when API endpoint is properly configured
      
      if (useMockData) {
        // Mock data for development
        const imageAssets: CloudinaryAsset[] = Array.from({ length: 8 }).map((_, index) => ({
          id: `img-${index + 1}`,
          publicId: `sample-image-${index + 1}`,
          url: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1623456789/sample-${index + 1}.jpg`,
          format: 'jpg',
          type: 'image',
          createdAt: new Date(Date.now() - Math.random() * 10000000).toISOString(),
          fileSize: Math.floor(Math.random() * 1000000) + 500000,
          width: 1200,
          height: 800,
          tags: ['dogs', 'walking', 'outdoors'],
        }));
        
        const videoAssets: CloudinaryAsset[] = Array.from({ length: 4 }).map((_, index) => ({
          id: `vid-${index + 1}`,
          publicId: `sample-video-${index + 1}`,
          url: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/v1623456789/sample-video-${index + 1}.mp4`,
          format: 'mp4',
          type: 'video',
          createdAt: new Date(Date.now() - Math.random() * 10000000).toISOString(),
          fileSize: Math.floor(Math.random() * 50000000) + 1000000,
          width: 1920,
          height: 1080,
          duration: Math.floor(Math.random() * 60) + 10,
          tags: ['dogs', 'walking', 'promotional'],
        }));
        
        setAssets([...imageAssets, ...videoAssets]);
      } else {
        // Call our new API endpoint
        const queryParams = new URLSearchParams();
        if (resourceType !== 'all') {
          queryParams.set('resourceType', resourceType);
        }
        
        const response = await fetch(`/api/cloudinary/assets?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch assets');
        }
        
        const data = await response.json();
        setAssets(data);
      }
    } catch (error) {
      console.error('Error loading media assets:', error);
      // Fallback to empty array on error
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAssetSelect = (asset: CloudinaryAsset) => {
    if (selectedIds.includes(asset.id)) {
      // Deselect
      setSelectedIds(selectedIds.filter(id => id !== asset.id));
    } else {
      // Select (if within max selection limit)
      if (maxSelection === 0 || selectedIds.length < maxSelection) {
        setSelectedIds([...selectedIds, asset.id]);
      } else if (maxSelection === 1) {
        // Replace if only one selection allowed
        setSelectedIds([asset.id]);
      }
    }
  };
  
  useEffect(() => {
    if (onSelect) {
      const selected = assets.filter(asset => selectedIds.includes(asset.id));
      onSelect(selected);
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
  
  const filteredAssets = filter === 'all' 
    ? assets 
    : assets.filter(asset => asset.type === filter);
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Media Library</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'all' 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('image')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'image' 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Images
              </button>
              <button
                onClick={() => setFilter('video')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'video' 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Videos
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
      </div>
      
      <div className="px-4 py-5 sm:p-6">
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
            {filteredAssets.map(asset => (
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
                      src={asset.url}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative pt-[56.25%] bg-gray-100">
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                      <video
                        src={asset.url}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
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
                </div>
                
                {selectedIds.includes(asset.id) && (
                  <div className="absolute top-2 right-2 bg-primary-500 rounded-full w-6 h-6 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {maxSelection > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
          <p className="text-sm text-gray-500">
            {selectedIds.length} of {maxSelection} items selected
          </p>
        </div>
      )}
    </div>
  );
} 