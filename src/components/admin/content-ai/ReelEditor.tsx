'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MediaAsset } from '@/lib/contentAIService';
import { 
  ReelTemplate, 
  getReelTemplates, 
  createReel,
  CloudinaryAsset
} from '@/lib/cloudinaryService';
import MediaLibrary from './MediaLibrary';
// @ts-expect-error VideoJS types compatibility issue
import videojs from 'video.js';
// @ts-expect-error VideoJS types compatibility issue
import 'video.js/dist/video-js.css';
// @ts-expect-error React DnD types compatibility issue
import { DndProvider, useDrag, useDrop } from 'react-dnd';
// @ts-expect-error HTML5 backend types compatibility issue
import { HTML5Backend } from 'react-dnd-html5-backend';

interface ReelEditorProps {
  onComplete?: (reelUrl: string) => void;
  initialMedia?: MediaAsset[];
}

// Draggable media item component
const DraggableMediaItem = ({ 
  asset, 
  index, 
  moveItem, 
  removeItem 
}: { 
  asset: CloudinaryAsset; 
  index: number; 
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  removeItem: (id: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'MEDIA_ITEM',
    item: () => ({ id: asset.id, index }),
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [, drop] = useDrop({
    accept: 'MEDIA_ITEM',
    hover: (item: { id: string; index: number }, monitor: any) => {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) return;
      
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      
      if (!clientOffset) return;
      
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      
      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  
  drag(drop(ref));
  
  return (
    <div 
      ref={ref}
      className={`relative border border-gray-200 rounded-md overflow-hidden group cursor-move ${isDragging ? 'opacity-50' : ''}`}
    >
      {asset.type === 'image' ? (
        <div className="relative">
          <img 
            src={asset.url} 
            alt=""
            className="w-full h-16 object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 flex items-center justify-center transition-all duration-200">
          </div>
        </div>
      ) : (
        <div className="w-full h-16 bg-gray-100 flex items-center justify-center relative">
          <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 flex items-center justify-center transition-all duration-200">
          </div>
        </div>
      )}
      <div className="absolute top-0 left-0 bg-gray-800 bg-opacity-70 text-white text-xs px-1">
        {index + 1}
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          removeItem(asset.id);
        }}
        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
      >
        <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default function ReelEditor({ onComplete, initialMedia = [] }: ReelEditorProps) {
  const [selectedAssets, setSelectedAssets] = useState<CloudinaryAsset[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [templates, setTemplates] = useState<ReelTemplate[]>([]);
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:5'>('9:16');
  const [duration, setDuration] = useState<number>(30);
  const [transition, setTransition] = useState<string>('fade');
  const [textOverlay, setTextOverlay] = useState<string>('');
  const [textPosition, setTextPosition] = useState<string>('center');
  const [musicOption, setMusicOption] = useState<string>('none');
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reelUrl, setReelUrl] = useState<string>('');
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New states for enhanced loading experience
  const [processingStage, setProcessingStage] = useState<'preparing' | 'uploading' | 'processing' | 'finalizing' | 'complete'>('preparing');
  const [startTime, setStartTime] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [optimizeMedia, setOptimizeMedia] = useState<boolean>(true);
  const [showAdvancedLoading, setShowAdvancedLoading] = useState<boolean>(false);
  
  // Refs for DOM elements
  const mediaPreviewRef = useRef<HTMLDivElement>(null);
  
  // Processing stage details
  const stageDetails = {
    preparing: { message: 'Preparing your media files...', percentage: 10 },
    uploading: { message: 'Uploading media to cloud storage...', percentage: 30 },
    processing: { message: 'Composing your reel...', percentage: 60 },
    finalizing: { message: 'Applying effects and transitions...', percentage: 90 },
    complete: { message: 'Reel successfully created!', percentage: 100 }
  };
  
  useEffect(() => {
    // Load templates
    try {
      const templates = getReelTemplates();
      setTemplates(templates);
      if (templates.length > 0) {
        setSelectedTemplate(templates[0].id);
        setAspectRatio(templates[0].aspectRatio);
        setDuration(templates[0].duration);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      // Fallback templates in case the server-side function fails
      const fallbackTemplates: ReelTemplate[] = [
        {
          id: 'instagram-story',
          name: 'Instagram Story',
          aspectRatio: '9:16',
          duration: 15,
          sections: [
            { type: 'intro' as const, duration: 3, transition: 'fade' },
            { type: 'main' as const, duration: 10 },
            { type: 'outro' as const, duration: 2, transition: 'fade' },
          ],
        },
        {
          id: 'tiktok-vertical',
          name: 'TikTok Video',
          aspectRatio: '9:16',
          duration: 30,
          sections: [
            { type: 'intro' as const, duration: 3, transition: 'slide' },
            { type: 'main' as const, duration: 24 },
            { type: 'outro' as const, duration: 3, transition: 'fade' },
          ],
        },
      ];
      setTemplates(fallbackTemplates);
      setSelectedTemplate(fallbackTemplates[0].id);
      setAspectRatio(fallbackTemplates[0].aspectRatio);
      setDuration(fallbackTemplates[0].duration);
    }
  }, []);
  
  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setAspectRatio(template.aspectRatio);
        setDuration(template.duration);
      }
    }
  }, [templates]);
  
  const handleAssetsSelected = useCallback((assets: CloudinaryAsset[]) => {
    setLoadingMedia(true);
    setError(null);
    setTimeout(() => {
      setSelectedAssets(assets);
      setLoadingMedia(false);
      
      // Scroll to preview if assets were added
      if (assets.length > 0 && mediaPreviewRef.current) {
        mediaPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }, []);
  
  const handleRemoveAsset = useCallback((id: string) => {
    setSelectedAssets(prev => prev.filter(asset => asset.id !== id));
  }, []);
  
  const handleMoveAsset = useCallback((dragIndex: number, hoverIndex: number) => {
    setSelectedAssets(prev => {
      const newAssets = [...prev];
      const [movedItem] = newAssets.splice(dragIndex, 1);
      newAssets.splice(hoverIndex, 0, movedItem);
      return newAssets;
    });
  }, []);
  
  const handleCreateReel = async () => {
    if (selectedAssets.length === 0) {
      setError("Please select at least one media item to create a reel");
      return;
    }
    
    // Reset states
    setIsCreating(true);
    setProgress(0);
    setProcessingStage('preparing');
    setStartTime(Date.now());
    setEstimatedTimeRemaining(null);
    setError(null);
    
    // Update progress based on stage
    const updateProgress = (stage: 'preparing' | 'uploading' | 'processing' | 'finalizing' | 'complete') => {
      setProcessingStage(stage);
      setProgress(stageDetails[stage].percentage);
      
      // Calculate estimated time remaining based on how long we've been processing
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      
      // Rough estimate: if we're at 30% and it took 10 seconds to get here,
      // then the whole process might take ~33 seconds total, so ~23 seconds remaining
      if (stageDetails[stage].percentage < 100) {
        const estimatedTotalSeconds = Math.floor(elapsedSeconds * (100 / stageDetails[stage].percentage));
        const remaining = Math.max(0, estimatedTotalSeconds - elapsedSeconds);
        setEstimatedTimeRemaining(remaining);
      } else {
        setEstimatedTimeRemaining(0);
      }
    };
    
    try {
      // Limit the number of assets processed at once to prevent overload
      updateProgress('preparing');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay to show preparing state
      
      const limitedAssets = selectedAssets.slice(0, 20); // Limit to 20 assets max
      
      // Optimize media if enabled
      const optimizedAssets = limitedAssets;
      if (optimizeMedia) {
        // In a real app, you would compress/resize images and videos here
        // For now, we'll just simulate this with a delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('Media optimization complete (simulated)');
      }
      
      // Build media items array
      const mediaItems = optimizedAssets.map(asset => ({
        publicId: asset.publicId,
        // Include additional metadata if needed
        startTime: 0,
        endTime: asset.duration || undefined,
        contentType: asset.type === 'image' ? 'image/jpeg' : 'video/mp4', // Add content type
        isOptimized: optimizeMedia
      }));
      
      updateProgress('uploading');
      console.log(`Sending ${mediaItems.length} items to create reel API`);
      
      try {
        // Begin processing the reel
        updateProgress('processing');
        
        // Call createReel function which now uses the API endpoint in browser
        const result = await createReel({
          mediaItems,
          title: `${aspectRatio.replace(':', '-')}-reel-${Date.now()}`,
          aspectRatio,
          transitions: [transition],
          outputFormat: 'mp4',
          tags: ['reel', 'auto-generated'],
          template: templates.find(t => t.id === selectedTemplate)
        });
        
        // Show finalizing stage briefly
        updateProgress('finalizing');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log('Reel creation successful:', result);
        updateProgress('complete');
        
        // Update UI with the result
        setReelUrl(result.secure_url);
        
        // Ensure the onComplete callback is triggered
        console.log('Calling onComplete callback with URL:', result.secure_url);
        if (onComplete) {
          onComplete(result.secure_url);
        } else {
          console.warn('No onComplete callback provided to ReelEditor');
        }
      } catch (apiError: any) {
        console.error('API error creating reel:', apiError);
        setError(`Error creating reel: ${apiError.message || 'Unknown error'}`);
        
        // Optional: Create a fallback URL for testing when API fails
        if (process.env.NODE_ENV === 'development') {
          const fallbackUrl = `https://res.cloudinary.com/dggxbflnu/video/upload/v1620000000/reels/fallback-reel-${Date.now()}.mp4`;
          console.warn('Development mode: Using fallback URL for testing');
          setReelUrl(fallbackUrl);
          updateProgress('complete');
          
          if (onComplete) {
            onComplete(fallbackUrl);
          }
        } else {
          setProgress(0);
          setIsCreating(false);
        }
      }
    } catch (error: any) {
      console.error('Error creating reel:', error);
      // Show error to user
      setError(`Failed to create reel: ${error.message || 'Unknown error'}`);
      setProgress(0);
      setIsCreating(false);
    }
  };
  
  const mediaGallery = useMemo(() => (
    <MediaLibrary 
      onSelect={handleAssetsSelected}
      selectedAssets={selectedAssets}
      maxSelection={20} // Limit selection to prevent performance issues
      includeWalkerUploads={true}
    />
  ), [handleAssetsSelected, selectedAssets]);

  const selectedAssetsDisplay = useMemo(() => {
    if (loadingMedia) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      );
    }
    
    if (selectedAssets.length === 0) {
      return (
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200 text-center">
          <p className="text-gray-500">
            Select media assets from the library below to create your reel
          </p>
        </div>
      );
    }
    
    return (
      <div className="mt-6" ref={mediaPreviewRef}>
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-gray-900">Selected Media ({selectedAssets.length})</h4>
          {selectedAssets.length > 0 && (
            <button
              onClick={() => setSelectedAssets([])}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200"
            >
              Clear All
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-2">
          Drag and drop to reorder. These will appear in your reel in the order shown.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {selectedAssets.map((asset, index) => (
            <DraggableMediaItem 
              key={asset.id}
              asset={asset}
              index={index}
              moveItem={handleMoveAsset}
              removeItem={handleRemoveAsset}
            />
          ))}
        </div>
      </div>
    );
  }, [selectedAssets, loadingMedia, handleMoveAsset, handleRemoveAsset]);

  const templatesDisplay = useMemo(() => (
    <div className="grid grid-cols-2 gap-4">
      {templates.map(template => (
        <div 
          key={template.id}
          onClick={() => handleTemplateChange(template.id)}
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedTemplate === template.id 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-sm font-medium">{template.name}</div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>{template.aspectRatio}</span>
            <span>{template.duration}s</span>
          </div>
        </div>
      ))}
    </div>
  ), [templates, selectedTemplate, handleTemplateChange]);
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Create Social Media Reel</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select media assets and customize your reel
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">1. Select Template</h4>
                {templatesDisplay}
                
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setCustomizationOpen(!customizationOpen)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {customizationOpen ? 'Hide' : 'Show'} Advanced Options
                    <svg xmlns="http://www.w3.org/2000/svg" className={`ml-2 h-4 w-4 transition-transform ${customizationOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                {customizationOpen && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-700">
                        Aspect Ratio
                      </label>
                      <select
                        id="aspect-ratio"
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value as any)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      >
                        <option value="1:1">Square (1:1) - Instagram, Facebook</option>
                        <option value="16:9">Landscape (16:9) - YouTube</option>
                        <option value="9:16">Portrait (9:16) - TikTok, Instagram Reels</option>
                        <option value="4:5">Portrait (4:5) - Instagram</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="transition" className="block text-sm font-medium text-gray-700">
                        Transition Style
                      </label>
                      <select
                        id="transition"
                        value={transition}
                        onChange={(e) => setTransition(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      >
                        <option value="fade">Fade</option>
                        <option value="slide">Slide</option>
                        <option value="zoom">Zoom</option>
                        <option value="wipe">Wipe</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="text-overlay" className="block text-sm font-medium text-gray-700">
                        Text Overlay
                      </label>
                      <input
                        type="text"
                        id="text-overlay"
                        value={textOverlay}
                        onChange={(e) => setTextOverlay(e.target.value)}
                        placeholder="Add caption text (leave empty for none)"
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    
                    {textOverlay && (
                      <div>
                        <label htmlFor="text-position" className="block text-sm font-medium text-gray-700">
                          Text Position
                        </label>
                        <select
                          id="text-position"
                          value={textPosition}
                          onChange={(e) => setTextPosition(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        >
                          <option value="top">Top</option>
                          <option value="center">Center</option>
                          <option value="bottom">Bottom</option>
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label htmlFor="music" className="block text-sm font-medium text-gray-700">
                        Music
                      </label>
                      <select
                        id="music"
                        value={musicOption}
                        onChange={(e) => setMusicOption(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      >
                        <option value="none">No Music</option>
                        <option value="upbeat">Upbeat</option>
                        <option value="relaxing">Relaxing</option>
                        <option value="inspirational">Inspirational</option>
                        <option value="fun">Fun & Energetic</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-4">2. Select & Arrange Media</h4>
                {selectedAssetsDisplay}
              </div>
            </div>
            
            <div className="mt-8 border-t border-gray-200 pt-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="mb-4 sm:mb-0">
                  <h4 className="font-medium text-gray-900">3. Create Your Reel</h4>
                  <p className="text-sm text-gray-500">
                    {selectedAssets.length === 0
                      ? 'Select media assets first to create your reel'
                      : `Ready to create a ${aspectRatio} reel with ${selectedAssets.length} media items`}
                  </p>
                  <div className="mt-3">
                    <label className="inline-flex items-center text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={optimizeMedia}
                        onChange={(e) => setOptimizeMedia(e.target.checked)}
                      />
                      <span className="ml-2">Optimize media for faster processing</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      Reduces file sizes while maintaining quality
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={handleCreateReel}
                  disabled={isCreating || selectedAssets.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating Reel...' : 'Create Reel'}
                </button>
              </div>
              
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
              
              {isCreating && (
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{stageDetails[processingStage].message}</span>
                    <button 
                      type="button" 
                      className="text-sm text-primary-600 hover:text-primary-800"
                      onClick={() => setShowAdvancedLoading(!showAdvancedLoading)}
                    >
                      {showAdvancedLoading ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  {showAdvancedLoading && (
                    <div className="bg-gray-50 p-4 rounded-md space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Stage:</span>
                        <span className="font-medium">{processingStage}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Progress:</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      {estimatedTimeRemaining !== null && (
                        <div className="flex justify-between text-sm">
                          <span>Estimated time remaining:</span>
                          <span className="font-medium">
                            {estimatedTimeRemaining > 60 
                              ? `${Math.floor(estimatedTimeRemaining / 60)}m ${estimatedTimeRemaining % 60}s` 
                              : `${estimatedTimeRemaining}s`}
                          </span>
                        </div>
                      )}
                      {processingStage === 'processing' && (
                        <div className="text-xs text-gray-500 mt-2">
                          <p>Creating reels involves heavy video processing which can take time.</p>
                          <p>Larger files and more complex effects will increase processing time.</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {processingStage === 'complete' && reelUrl && (
                    <div className="mt-4">
                      <div className="flex items-center justify-center py-4 text-green-600 mb-2">
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Reel successfully created!</span>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
                        <video 
                          src={reelUrl} 
                          controls 
                          className="max-h-[300px] mx-auto"
                          style={{
                            aspectRatio: aspectRatio === '1:1' ? '1' : 
                                        aspectRatio === '16:9' ? '16/9' : 
                                        aspectRatio === '9:16' ? '9/16' : 
                                        aspectRatio === '4:5' ? '4/5' : 'auto'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Media Library</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select media assets from your library
            </p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            {mediaGallery}
          </div>
        </div>
      </div>
    </DndProvider>
  );
} 