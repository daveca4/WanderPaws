'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MediaAsset } from '@/lib/contentAIService';
import { 
  ReelTemplate, 
  getReelTemplates, 
  createReel,
  CloudinaryAsset
} from '@/lib/cloudinaryService';
import MediaLibrary from './MediaLibrary';

interface ReelEditorProps {
  onComplete?: (reelUrl: string) => void;
  initialMedia?: MediaAsset[];
}

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
      const fallbackTemplates = [
        {
          id: 'instagram-story',
          name: 'Instagram Story',
          aspectRatio: '9:16' as const,
          duration: 15,
          sections: [
            { type: 'intro', duration: 3, transition: 'fade' },
            { type: 'main', duration: 10 },
            { type: 'outro', duration: 2, transition: 'fade' },
          ],
        },
        {
          id: 'tiktok-vertical',
          name: 'TikTok Video',
          aspectRatio: '9:16' as const,
          duration: 30,
          sections: [
            { type: 'intro', duration: 3, transition: 'slide' },
            { type: 'main', duration: 24 },
            { type: 'outro', duration: 3, transition: 'fade' },
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
    setTimeout(() => {
      setSelectedAssets(assets);
      setLoadingMedia(false);
    }, 50);
  }, []);
  
  const handleCreateReel = async () => {
    if (selectedAssets.length === 0) {
      alert("Please select at least one media item to create a reel");
      return;
    }
    
    setIsCreating(true);
    setProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + Math.floor(Math.random() * 5) + 1;
      });
    }, 500);
    
    try {
      // Limit the number of assets processed at once to prevent overload
      const limitedAssets = selectedAssets.slice(0, 20); // Limit to 20 assets max
      
      // Use the server-side API through our client-side API wrapper function
      const mediaItems = limitedAssets.map(asset => ({
        publicId: asset.publicId,
        // Include additional metadata if needed
        startTime: 0,
        endTime: asset.duration || undefined
      }));
      
      // Call createReel function which now uses the API endpoint in browser
      const result = await createReel({
        mediaItems,
        title: 'My Reel',
        aspectRatio,
        transitions: [transition],
        outputFormat: 'mp4',
        tags: ['reel', 'auto-generated'],
        template: templates.find(t => t.id === selectedTemplate)
      });
      
      // Update UI with the result
      setReelUrl(result.secure_url);
      if (onComplete) {
        onComplete(result.secure_url);
      }
      
    } catch (error) {
      console.error('Error creating reel:', error);
      // Show error to user
      alert(`Failed to create reel: ${(error as Error).message}`);
    } finally {
      clearInterval(interval);
      setProgress(100);
      setIsCreating(false);
    }
  };
  
  const handleReorderAsset = useCallback((dragIndex: number, dropIndex: number) => {
    setSelectedAssets(prev => {
      const newAssets = [...prev];
      const draggedItem = newAssets[dragIndex];
      newAssets.splice(dragIndex, 1);
      newAssets.splice(dropIndex, 0, draggedItem);
      return newAssets;
    });
  }, []);
  
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
      return null;
    }
    
    // Only display a maximum of 20 selected assets to maintain performance
    const displayAssets = selectedAssets.slice(0, 20);
    
    return (
      <div className="mt-6">
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
          {selectedAssets.length > 20 ? 
            `Showing 20 of ${selectedAssets.length} assets. All selected assets will be used in the reel.` : 
            'These will appear in the order shown. Click an item to remove it.'}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {displayAssets.map((asset, index) => (
            <div 
              key={asset.id}
              className="relative border border-gray-200 rounded-md overflow-hidden group cursor-pointer"
              onClick={() => {
                setSelectedAssets(prev => prev.filter(a => a.id !== asset.id));
              }}
            >
              {asset.type === 'image' ? (
                <div className="relative">
                  <img 
                    src={asset.url} 
                    alt=""
                    className="w-full h-16 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200">
                    <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-full h-16 bg-gray-100 flex items-center justify-center relative">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-200">
                    <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              )}
              <div className="absolute top-0 left-0 bg-gray-800 bg-opacity-70 text-white text-xs px-1">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [selectedAssets, loadingMedia]);

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
              {mediaGallery}
              
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
            
            {isCreating && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-500 text-center">
                  {progress < 100 ? 'Processing your reel...' : 'Reel created!'}
                </p>
                {progress === 100 && reelUrl && (
                  <div className="mt-4 text-center">
                    <p className="text-green-500 mb-2">Reel successfully created!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 