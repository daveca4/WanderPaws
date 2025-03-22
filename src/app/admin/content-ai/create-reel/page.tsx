'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { createContentItem } from '@/lib/contentAIService';
import { S3Asset, getS3Assets } from '@/lib/s3Service';
import { CloudinaryAsset } from '@/lib/cloudinaryService';
import Image from 'next/image';

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

// Icons for advanced options
const ExpandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const CollapseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
  </svg>
);

export default function CreateReelPage() {
  const router = useRouter();
  
  // Media selection states
  const [selectedMedia, setSelectedMedia] = useState<CloudinaryAsset[]>([]);
  const [availableMedia, setAvailableMedia] = useState<CloudinaryAsset[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [orderableSelectedMedia, setOrderableSelectedMedia] = useState<CloudinaryAsset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMediaTab, setSelectedMediaTab] = useState<'all' | 'images' | 'videos'>('all');
  
  // Reel creation states
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [createdReelUrl, setCreatedReelUrl] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState('Preparing media...');
  const [apiResponse, setApiResponse] = useState<any>(null); // Store the full API response
  const [videoLoadingState, setVideoLoadingState] = useState<'loading'|'error'|'success'>('loading');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Advanced Cloudinary options
  const [advancedOptions, setAdvancedOptions] = useState({
    transition: 'fade', // fade, slide, zoom, wipe, pixelate
    transitionDuration: 0.8,
    addTextOverlay: false,
    textOverlay: 'WanderPaws',
    textPosition: 'center', // center, bottom, top
    textColor: '#ffffff',
    textSize: 40,
    applyFilter: false,
    filterType: 'auto_contrast', // auto_contrast, grayscale, sepia, blur, improve
    addAudioTrack: false,
    audioTrack: 'cheerful', // cheerful, relaxing, upbeat, dramatic
    addLogo: false,
    logoPosition: 'bottom_right', // bottom_right, bottom_left, top_right, top_left
    speedAdjustment: 1.0, // 0.5 (slow), 1.0 (normal), 1.5 (fast)
    addAutoCaption: false,
    captionLanguage: 'en',
    addEndCard: false,
    endCardText: 'Follow for more!',
    smartCrop: true,
  });
  
  // Reel details form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    platforms: [] as ('instagram' | 'tiktok' | 'facebook')[],
  });
  
  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs to maintain scroll position
  const mediaListRef = useRef<HTMLDivElement>(null);
  const reelFormRef = useRef<HTMLDivElement>(null);
  
  // Load media assets from S3
  const loadMediaAssets = async () => {
    try {
      setLoadingMedia(true);
      const s3Assets = await getS3Assets();
      const convertedAssets = s3Assets.map(convertS3ToCloudinaryFormat);
      setAvailableMedia(convertedAssets);
    } catch (error) {
      console.error('Failed to load media assets:', error);
    } finally {
      setLoadingMedia(false);
    }
  };
  
  // Load media on mount
  useEffect(() => {
    loadMediaAssets();
  }, []);
  
  // Reset the video loading state when the URL changes
  useEffect(() => {
    if (createdReelUrl) {
      setVideoLoadingState('loading');

      // Set up retry mechanism in case Cloudinary is still processing the video
      let retryCount = 0;
      const maxRetries = 5;
      const retryInterval = 5000; // 5 seconds between retries

      const retryTimer = setInterval(() => {
        if (videoLoadingState === 'error' && retryCount < maxRetries) {
          console.log(`Retry ${retryCount + 1}/${maxRetries} for loading video...`);
          retryCount++;
          
          // Force reload the video element
          setCreatedReelUrl(currentUrl => {
            if (currentUrl) {
              // Add a cache-busting parameter
              return `${currentUrl}${currentUrl.includes('?') ? '&' : '?'}retry=${Date.now()}`;
            }
            return currentUrl;
          });
          
          // Reset loading state
          setVideoLoadingState('loading');
        } else if (retryCount >= maxRetries || videoLoadingState === 'success') {
          // Stop retrying if we've hit max retries or succeeded
          clearInterval(retryTimer);
        }
      }, retryInterval);

      // Clean up
      return () => clearInterval(retryTimer);
    }
  }, [createdReelUrl, videoLoadingState]);
  
  // Handle media item selection
  const toggleMediaSelection = (asset: CloudinaryAsset) => {
    if (selectedMedia.some(item => item.id === asset.id)) {
      setSelectedMedia(selectedMedia.filter(item => item.id !== asset.id));
      setOrderableSelectedMedia(orderableSelectedMedia.filter(item => item.id !== asset.id));
    } else {
      const newSelectedMedia = [...selectedMedia, asset];
      setSelectedMedia(newSelectedMedia);
      setOrderableSelectedMedia(newSelectedMedia);
    }
  };
  
  // Clear all selected media
  const clearMediaSelection = () => {
    setSelectedMedia([]);
    setOrderableSelectedMedia([]);
  };
  
  // Handle reordering of media
  const handleReorder = (dragIndex: number, hoverIndex: number) => {
    const draggedItem = orderableSelectedMedia[dragIndex];
    if (draggedItem) {
      const newItems = [...orderableSelectedMedia];
      newItems.splice(dragIndex, 1);
      newItems.splice(hoverIndex, 0, draggedItem);
      setOrderableSelectedMedia(newItems);
      setSelectedMedia(newItems);
    }
  };

  // Filter available media based on search and tab
  const filteredMedia = useMemo(() => {
    return availableMedia.filter(asset => {
      // Filter by search term
      const matchesSearch = searchTerm === '' || 
        asset.publicId.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by media type
      const matchesType = selectedMediaTab === 'all' || 
        (selectedMediaTab === 'images' && asset.type === 'image') ||
        (selectedMediaTab === 'videos' && asset.type === 'video');
      
      return matchesSearch && matchesType;
    });
  }, [availableMedia, searchTerm, selectedMediaTab]);
  
  // Create reel from selected media
  const createReel = async () => {
    if (orderableSelectedMedia.length === 0) {
      alert('Please select at least one media item');
      return;
    }
    
    setIsCreating(true);
    setCreationProgress(0);
    setProcessingMessage('Preparing media...');
    setApiResponse(null); // Reset previous response
    
    // Simulation of progress for UX
    const progressInterval = setInterval(() => {
      setCreationProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
      
      // Update processing message based on progress
      if (creationProgress < 20) {
        setProcessingMessage('Preparing media...');
      } else if (creationProgress < 40) {
        setProcessingMessage('Uploading to cloud...');
      } else if (creationProgress < 70) {
        setProcessingMessage('Creating reel...');
      } else {
        setProcessingMessage('Finalizing output...');
      }
    }, 1000);
    
    try {
      // Log selected media for debugging
      console.log('Selected media for reel:', orderableSelectedMedia);
      
      // Prepare media items for the API with better content type handling
      const mediaItems = orderableSelectedMedia.map(asset => {
        // Ensure we have a valid content type format for the API
        const assetType = asset.type; // This is 'image' or 'video'
        let mimeType = ''; // This will hold the full MIME type for the server

        // Determine proper MIME type from URL for server processing
        if (assetType === 'image') {
          const url = asset.url.toLowerCase();
          if (url.includes('.jpg') || url.includes('.jpeg')) {
            mimeType = 'image/jpeg';
          } else if (url.includes('.png')) {
            mimeType = 'image/png';
          } else if (url.includes('.gif')) {
            mimeType = 'image/gif';
          } else if (url.includes('.webp')) {
            mimeType = 'image/webp';
          } else {
            mimeType = 'image/jpeg'; // Default to JPEG
          }
        } else if (assetType === 'video') {
          const url = asset.url.toLowerCase();
          if (url.includes('.mp4')) {
            mimeType = 'video/mp4';
          } else if (url.includes('.mov')) {
            mimeType = 'video/quicktime';
          } else if (url.includes('.webm')) {
            mimeType = 'video/webm';
          } else {
            mimeType = 'video/mp4'; // Default to MP4
          }
        }
        
        console.log(`Processing media item: ${asset.publicId}, type: ${assetType}, MIME: ${mimeType}`);
        
        return {
          publicId: asset.publicId,
          startTime: 0,
          endTime: 0,
          isS3Asset: true,
          contentType: assetType, // Keep this as 'image' or 'video' for CloudinaryAsset compatibility
          mimeType: mimeType,    // Add this for proper server-side content type handling
        };
      });
      
      console.log('Prepared media items for API:', mediaItems);
      
      // Prepare advanced options for the API
      const advancedApiOptions = {
        transition: advancedOptions.transition,
        transitionDuration: advancedOptions.transitionDuration,
        textOverlay: advancedOptions.addTextOverlay ? {
          text: advancedOptions.textOverlay,
          position: advancedOptions.textPosition,
          color: advancedOptions.textColor,
          fontSize: advancedOptions.textSize
        } : null,
        filter: advancedOptions.applyFilter ? advancedOptions.filterType : null,
        audioTrack: advancedOptions.addAudioTrack ? advancedOptions.audioTrack : null,
        logo: advancedOptions.addLogo ? {
          position: advancedOptions.logoPosition
        } : null,
        speedAdjustment: advancedOptions.speedAdjustment,
        autoCaption: advancedOptions.addAutoCaption ? {
          language: advancedOptions.captionLanguage
        } : null,
        endCard: advancedOptions.addEndCard ? {
          text: advancedOptions.endCardText
        } : null,
        smartCrop: advancedOptions.smartCrop
      };
      
      // Call the API to create the reel
      const response = await fetch('/api/cloudinary/create-reel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaItems,
          title: 'Reel',
          aspectRatio: '9:16',
          tags: ['auto-generated'],
          advancedOptions: advancedApiOptions // Include advanced options
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to create reel: ${response.status} - ${errorData.error || response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Reel created successfully:', result);
      
      clearInterval(progressInterval);
      setCreationProgress(100);
      setProcessingMessage(result.error?.wasError 
        ? 'Reel created with some issues - you may need to refresh to see it'
        : 'Reel created successfully!');
      setCreatedReelUrl(result.secure_url);
      setApiResponse(result);
      
      // Scroll to the reel section
      setTimeout(() => {
        reelFormRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
      
      // Pre-fill the title
      setFormData({
        ...formData,
        title: `Reel - ${new Date().toLocaleDateString()}`
      });
      
    } catch (error) {
      console.error('Error creating reel:', error);
      clearInterval(progressInterval);
      setProcessingMessage(`Error: ${error instanceof Error ? error.message : 'Failed to create reel'}`);
      setCreationProgress(0);
    } finally {
      setIsCreating(false);
    }
  };
  
  // Form change handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Toggle social platform
  const togglePlatform = (platform: 'instagram' | 'tiktok' | 'facebook') => {
    if (formData.platforms.includes(platform)) {
      setFormData({
        ...formData,
        platforms: formData.platforms.filter(p => p !== platform),
      });
    } else {
      setFormData({
        ...formData,
        platforms: [...formData.platforms, platform],
      });
    }
  };
  
  // Save the reel
  const saveReel = async (publish: boolean = false) => {
    if (!createdReelUrl) {
      alert('Please create a reel first');
      return;
    }
    
    if (!formData.title.trim()) {
      alert('Please provide a title for your reel');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Process tags
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Create content item
      await createContentItem({
        title: formData.title,
        content: formData.description,
        type: 'reel',
        status: publish ? 'published' : 'draft',
        author: 'AI Assistant',
        tags,
        summary: formData.description.slice(0, 120) + (formData.description.length > 120 ? '...' : ''),
        mediaAssets: [
          {
            id: 'reel-1',
            publicId: 'reel-1',
            url: createdReelUrl,
            type: 'video',
            format: 'mp4',
          },
        ],
        thumbnailUrl: createdReelUrl.replace('/video/', '/image/').replace('.mp4', '.jpg'),
        aspectRatio: '9:16',
        duration: 30,
        socialPlatforms: formData.platforms,
      });
      
      router.push('/admin/content-ai');
      
    } catch (error) {
      console.error('Error saving reel:', error);
      alert(`Failed to save reel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Social Media Reel</h1>
            <p className="mt-1 text-sm text-gray-500">
              Select and arrange media to create an engaging social reel
            </p>
          </div>
          
          <Link
            href="/admin/content-ai"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to Content Management
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Media Selection - Left Column */}
          <div className="lg:col-span-5 space-y-6" ref={mediaListRef}>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">1. Select Media</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Choose and arrange media for your reel
                </p>
              </div>
              
              <div className="p-4">
                {/* Search and filter controls */}
                <div className="mb-4">
                  <div className="relative rounded-md shadow-sm mb-3">
                    <input
                      type="text"
                      className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Search media..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex border border-gray-200 rounded-md overflow-hidden divide-x divide-gray-200">
                    <button
                      className={`flex-1 py-2 text-sm font-medium ${selectedMediaTab === 'all' ? 'bg-primary-50 text-primary-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setSelectedMediaTab('all')}
                    >
                      All
                    </button>
                    <button
                      className={`flex-1 py-2 text-sm font-medium ${selectedMediaTab === 'images' ? 'bg-primary-50 text-primary-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setSelectedMediaTab('images')}
                    >
                      Images
                    </button>
                    <button
                      className={`flex-1 py-2 text-sm font-medium ${selectedMediaTab === 'videos' ? 'bg-primary-50 text-primary-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setSelectedMediaTab('videos')}
                    >
                      Videos
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-medium text-gray-700">
                    {selectedMedia.length} items selected
                  </p>
                  {selectedMedia.length > 0 && (
                    <button
                      onClick={clearMediaSelection}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                {loadingMedia ? (
                  <div className="py-12 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {availableMedia.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No media found. Upload some media files first.
                      </div>
                    ) : (
                      <>
                        {/* Media Grid */}
                        <div className="grid grid-cols-3 gap-2">
                          {filteredMedia.map((asset) => (
                            <div 
                              key={asset.publicId} 
                              onClick={() => toggleMediaSelection(asset)}
                              className={`group relative cursor-pointer rounded-md overflow-hidden border-2 transition-all duration-150 transform hover:scale-[1.02] ${
                                selectedMedia.some(item => item.publicId === asset.publicId)
                                  ? 'border-primary-500 ring-2 ring-primary-200'
                                  : 'border-transparent hover:border-gray-300'
                              }`}
                            >
                              <div className="aspect-square">
                                <img 
                                  src={asset.url} 
                                  alt={asset.publicId} 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {asset.type === 'video' && (
                                <div className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              {selectedMedia.some(item => item.publicId === asset.publicId) && (
                                <div className="absolute top-1 left-1 bg-primary-500 rounded-full p-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-200"></div>
                            </div>
                          ))}
                        </div>

                        {/* Selected Media Ordering Section */}
                        {selectedMedia.length > 0 && (
                          <div className="mt-6 border-t border-gray-200 pt-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Media Order</h3>
                            <p className="text-xs text-gray-500 mb-3">Drag and drop to reorder media items for your reel</p>
                            
                            <div className="flex overflow-x-auto pb-2 space-x-2">
                              {orderableSelectedMedia.map((asset, index) => (
                                <div 
                                  key={asset.id}
                                  className="relative flex-shrink-0 w-20 h-20 border border-gray-200 rounded-md overflow-hidden group"
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('text/plain', index.toString());
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                    handleReorder(dragIndex, index);
                                  }}
                                >
                                  <img 
                                    src={asset.url} 
                                    alt={asset.publicId} 
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-0 left-0 bg-primary-500 text-white text-xs font-medium px-1.5 rounded-br">
                                    {index + 1}
                                  </div>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleMediaSelection(asset);
                                    }}
                                    className="absolute top-0 right-0 bg-white bg-opacity-75 rounded-bl p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <svg className="h-3 w-3 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Reel Creation Controls - Right Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Reel Options */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">2. Configure Your Reel</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Customize how your reel will look and feel
                </p>
              </div>
              
              <div className="p-6">
                {/* Quick Options */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div>
                    <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-700 mb-1">
                      Aspect Ratio
                    </label>
                    <div className="relative">
                      <select
                        id="aspect-ratio"
                        value="9:16"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      >
                        <option value="9:16">Vertical (9:16) - TikTok, Reels</option>
                        <option value="16:9">Landscape (16:9) - YouTube</option>
                        <option value="4:5">Portrait (4:5) - Instagram</option>
                        <option value="1:1">Square (1:1) - Facebook</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="music-track" className="block text-sm font-medium text-gray-700 mb-1">
                      Music Track
                    </label>
                    <div className="relative">
                      <select
                        id="music-track"
                        value={advancedOptions.audioTrack}
                        onChange={(e) => setAdvancedOptions({...advancedOptions, addAudioTrack: e.target.value !== 'none', audioTrack: e.target.value === 'none' ? 'cheerful' : e.target.value})}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      >
                        <option value="none">No music</option>
                        <option value="cheerful">Cheerful</option>
                        <option value="relaxing">Relaxing</option>
                        <option value="upbeat">Upbeat</option>
                        <option value="dramatic">Dramatic</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Advanced Options Section - Simplified UI */}
                <div className="mt-8 border rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-md"
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium text-gray-800">Advanced Options</span>
                    </div>
                    {showAdvancedOptions ? <CollapseIcon /> : <ExpandIcon />}
                  </button>
                  
                  {showAdvancedOptions && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Transitions */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-800 mb-3">Transitions</h4>
                          <div className="space-y-3">
                            <div>
                              <label htmlFor="transition-type" className="block text-sm text-gray-600 mb-1">Style</label>
                              <select
                                id="transition-type"
                                value={advancedOptions.transition}
                                onChange={(e) => setAdvancedOptions({...advancedOptions, transition: e.target.value})}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                              >
                                <option value="fade">Fade</option>
                                <option value="slide">Slide</option>
                                <option value="zoom">Zoom</option>
                                <option value="wipe">Wipe</option>
                                <option value="pixelate">Pixelate</option>
                              </select>
                            </div>
                            
                            <div>
                              <label htmlFor="transition-duration" className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Duration</span>
                                <span className="text-gray-500">{advancedOptions.transitionDuration}s</span>
                              </label>
                              <input
                                id="transition-duration"
                                type="range"
                                min="0.2"
                                max="2"
                                step="0.1"
                                value={advancedOptions.transitionDuration}
                                onChange={(e) => setAdvancedOptions({...advancedOptions, transitionDuration: parseFloat(e.target.value)})}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Text Overlay */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-800">Text Overlay</h4>
                            <div className="flex items-center">
                              <input
                                id="add-text-overlay"
                                type="checkbox"
                                checked={advancedOptions.addTextOverlay}
                                onChange={(e) => setAdvancedOptions({...advancedOptions, addTextOverlay: e.target.checked})}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <label htmlFor="add-text-overlay" className="ml-2 text-sm text-gray-600">Enable</label>
                            </div>
                          </div>
                          
                          {advancedOptions.addTextOverlay && (
                            <div className="space-y-3">
                              <div>
                                <input
                                  type="text"
                                  value={advancedOptions.textOverlay}
                                  onChange={(e) => setAdvancedOptions({...advancedOptions, textOverlay: e.target.value})}
                                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                                  placeholder="Enter text overlay"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label htmlFor="text-position" className="block text-sm text-gray-600 mb-1">Position</label>
                                  <select
                                    id="text-position"
                                    value={advancedOptions.textPosition}
                                    onChange={(e) => setAdvancedOptions({...advancedOptions, textPosition: e.target.value})}
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                                  >
                                    <option value="center">Center</option>
                                    <option value="bottom">Bottom</option>
                                    <option value="top">Top</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label htmlFor="text-color" className="block text-sm text-gray-600 mb-1">Color</label>
                                  <div className="flex items-center">
                                    <input
                                      id="text-color"
                                      type="color"
                                      value={advancedOptions.textColor}
                                      onChange={(e) => setAdvancedOptions({...advancedOptions, textColor: e.target.value})}
                                      className="h-8 rounded"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Quick Toggles for Other Options */}
                      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="flex items-center">
                          <input
                            id="smart-crop"
                            type="checkbox"
                            checked={advancedOptions.smartCrop}
                            onChange={(e) => setAdvancedOptions({...advancedOptions, smartCrop: e.target.checked})}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="smart-crop" className="ml-2 text-sm text-gray-700">AI Smart Crop</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="add-logo"
                            type="checkbox"
                            checked={advancedOptions.addLogo}
                            onChange={(e) => setAdvancedOptions({...advancedOptions, addLogo: e.target.checked})}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="add-logo" className="ml-2 text-sm text-gray-700">Add Logo</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="apply-filter"
                            type="checkbox"
                            checked={advancedOptions.applyFilter}
                            onChange={(e) => setAdvancedOptions({...advancedOptions, applyFilter: e.target.checked})}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="apply-filter" className="ml-2 text-sm text-gray-700">Apply Filter</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="add-auto-caption"
                            type="checkbox"
                            checked={advancedOptions.addAutoCaption}
                            onChange={(e) => setAdvancedOptions({...advancedOptions, addAutoCaption: e.target.checked})}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="add-auto-caption" className="ml-2 text-sm text-gray-700">Auto Captions</label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Create Reel Button */}
                <div className="mt-8">
                  <button
                    onClick={createReel}
                    disabled={selectedMedia.length === 0 || isCreating}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreating ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Reel...
                      </span>
                    ) : (
                      'Create Reel'
                    )}
                  </button>
                </div>
                
                {isCreating && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2 overflow-hidden">
                      <div 
                        className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${creationProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-center text-sm text-gray-500">{processingMessage}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Reel Preview & Form */}
            <div ref={reelFormRef} className={`bg-white shadow rounded-lg overflow-hidden ${!createdReelUrl ? 'opacity-50' : ''}`}>
              <div className="px-4 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">3. Reel Details</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Preview and finalize your reel
                </p>
              </div>
              
              <div className="p-6">
                {!createdReelUrl ? (
                  <div className="text-center py-12 text-gray-500">
                    Create a reel first to preview and add details
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Reel Preview */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                      <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
                        {/* Warning for mock videos */}
                        {apiResponse?.error?.wasError ? (
                          <div className="absolute inset-0 flex items-center justify-center flex-col p-4 bg-gray-800 text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-center text-sm">
                              The video was created with errors and might not play correctly.
                            </p>
                            <p className="text-center text-xs mt-2 text-gray-300">
                              You can still publish anyway, but consider recreating the reel with fewer or different media items.
                            </p>
                          </div>
                        ) : null}
                        
                        {/* Loading indicator */}
                        {videoLoadingState === 'loading' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent inline-block mb-2"></div>
                              <p className="text-white text-sm">Loading video preview...</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Error message */}
                        {videoLoadingState === 'error' && (
                          <div className="absolute inset-0 flex items-center justify-center flex-col p-4 bg-gray-800 text-white z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-center text-sm">Error loading video preview.</p>
                            <p className="text-center text-xs mt-2 text-gray-300">
                              The video might still be processing. Retry attempts will happen automatically.
                            </p>
                          </div>
                        )}
                        
                        {/* Video player */}
                        <video 
                          key={createdReelUrl}
                          src={createdReelUrl} 
                          controls 
                          autoPlay
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-contain"
                          onLoadStart={() => setVideoLoadingState('loading')}
                          onCanPlay={() => setVideoLoadingState('success')}
                          onError={() => setVideoLoadingState('error')}
                        />
                      </div>
                    </div>
                    
                    {/* Details Form - Simplified UI */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Details</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="Enter a title for your reel"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={formData.description}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="Describe your reel"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                            Tags
                          </label>
                          <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            placeholder="Enter tags separated by commas"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Post to Platforms
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: 'instagram', label: 'Instagram', icon: '📸' },
                              { id: 'tiktok', label: 'TikTok', icon: '🎵' },
                              { id: 'facebook', label: 'Facebook', icon: '👍' }
                            ].map(platform => (
                              <button
                                key={platform.id}
                                type="button"
                                onClick={() => togglePlatform(platform.id as 'instagram' | 'tiktok' | 'facebook')}
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm transition-colors ${
                                  formData.platforms.includes(platform.id as any)
                                    ? 'bg-primary-100 text-primary-800 border-primary-300'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                } border`}
                              >
                                <span className="mr-1">{platform.icon}</span>
                                {platform.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="pt-4 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => saveReel(false)}
                            disabled={isSaving}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Save Draft
                          </button>
                          <button
                            type="button"
                            onClick={() => saveReel(true)}
                            disabled={isSaving}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                          >
                            {isSaving ? 'Publishing...' : 'Publish'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 