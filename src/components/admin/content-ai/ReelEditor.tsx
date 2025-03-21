'use client';

import { useState, useEffect } from 'react';
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
  
  useEffect(() => {
    // Load templates
    try {
      const templates = getReelTemplates();
      setTemplates(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
      // Fallback templates in case the server-side function fails
      setTemplates([
        {
          id: 'instagram-story',
          name: 'Instagram Story',
          aspectRatio: '9:16',
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
          aspectRatio: '9:16',
          duration: 30,
          sections: [
            { type: 'intro', duration: 3, transition: 'slide' },
            { type: 'main', duration: 24 },
            { type: 'outro', duration: 3, transition: 'fade' },
          ],
        },
      ]);
    }
  }, []);
  
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setAspectRatio(template.aspectRatio);
        setDuration(template.duration);
      }
    }
  };
  
  const handleAssetsSelected = (assets: CloudinaryAsset[]) => {
    setSelectedAssets(assets);
  };
  
  const handleCreateReel = async () => {
    if (selectedAssets.length === 0) return;
    
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
      // Use the server-side API through our client-side API wrapper function
      const mediaItems = selectedAssets.map(asset => ({
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
  
  const handleReorderAsset = (dragIndex: number, dropIndex: number) => {
    const newAssets = [...selectedAssets];
    const draggedItem = newAssets[dragIndex];
    newAssets.splice(dragIndex, 1);
    newAssets.splice(dropIndex, 0, draggedItem);
    setSelectedAssets(newAssets);
  };
  
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
              <MediaLibrary 
                onSelect={handleAssetsSelected}
                selectedAssets={selectedAssets}
              />
              
              {selectedAssets.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Selected Media ({selectedAssets.length})</h4>
                  <p className="text-sm text-gray-500 mb-2">Drag to reorder. These will appear in the order shown.</p>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedAssets.map((asset, index) => (
                      <div 
                        key={asset.id}
                        className="relative border border-gray-200 rounded-md overflow-hidden"
                      >
                        {asset.type === 'image' ? (
                          <img 
                            src={asset.url} 
                            alt=""
                            className="w-full h-16 object-cover"
                          />
                        ) : (
                          <div className="w-full h-16 bg-gray-100 flex items-center justify-center relative">
                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute top-0 left-0 bg-gray-800 bg-opacity-70 text-white text-xs px-1">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8">
            <button
              type="button"
              onClick={handleCreateReel}
              disabled={selectedAssets.length === 0 || isCreating}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating Reel...' : 'Create Reel'}
            </button>
            
            {isCreating && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Processing... {progress}%</p>
              </div>
            )}
            
            {reelUrl && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
                <div className="relative pt-[177.78%] bg-black rounded-lg overflow-hidden">
                  {reelUrl.endsWith('.mp4') || reelUrl.includes('/video/') ? (
                    <video 
                      src={reelUrl} 
                      controls 
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <img 
                      src={reelUrl} 
                      alt="Generated reel preview" 
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  )}
                </div>
                
                <div className="mt-4 flex space-x-4">
                  <a
                    href={reelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      // This would integrate with social media platforms in a real implementation
                      alert('This would open a social media sharing dialog in a real implementation.');
                    }}
                    className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Share to Social Media
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 