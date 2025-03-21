'use client';

import { useState, Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import ReelEditor from '@/components/admin/content-ai/ReelEditor';
import TitleGenerator from '@/components/admin/content-ai/TitleGenerator';
import { createContentItem } from '@/lib/contentAIService';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Reel Editor error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <h3 className="text-lg font-medium">Something went wrong</h3>
          <p className="mt-2 text-sm">There was an error loading the reel editor. Please try refreshing the page.</p>
          <p className="mt-2 text-xs text-gray-600">{this.state.error?.message}</p>
          <button 
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded text-sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface AIGeneratedContent {
  titles: string[];
  descriptions: string[];
  suggestedTags: string[];
}

export default function CreateReelPage() {
  const router = useRouter();
  const [reelUrl, setReelUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<'create' | 'details'>('create');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    platforms: [] as ('instagram' | 'tiktok' | 'facebook' | 'twitter')[],
  });
  
  // AI title and description generation
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIGeneratedContent | null>(null);
  const [selectedTheme, setSelectedTheme] = useState('dogs');
  const [selectedTone, setSelectedTone] = useState('professional');
  
  // Title generator modal
  const [showTitleGenerator, setShowTitleGenerator] = useState(false);
  
  const handleReelCreated = (url: string) => {
    setReelUrl(url);
    setStep('details');
    // Auto-generate AI content when we reach the details step
    generateAIContent();
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handlePlatformToggle = (platform: 'instagram' | 'tiktok' | 'facebook' | 'twitter') => {
    if (formData.platforms.includes(platform)) {
      setFormData({
        ...formData,
        platforms: formData.platforms.filter(p => p !== platform)
      });
    } else {
      setFormData({
        ...formData,
        platforms: [...formData.platforms, platform]
      });
    }
  };
  
  const generateAIContent = async () => {
    setIsGeneratingAI(true);
    
    try {
      const response = await fetch('/api/ai/generate-reel-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaTypes: ['video'],
          theme: selectedTheme,
          tone: selectedTone
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate AI content');
      }
      
      const data = await response.json();
      setAiSuggestions(data);
    } catch (error) {
      console.error('Error generating AI content:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };
  
  const applyAISuggestion = (type: 'title' | 'description', index: number) => {
    if (!aiSuggestions) return;
    
    if (type === 'title' && aiSuggestions.titles[index]) {
      setFormData({
        ...formData,
        title: aiSuggestions.titles[index]
      });
    } else if (type === 'description' && aiSuggestions.descriptions[index]) {
      setFormData({
        ...formData,
        description: aiSuggestions.descriptions[index]
      });
    }
  };
  
  const applyAITags = () => {
    if (!aiSuggestions?.suggestedTags?.length) return;
    
    setFormData({
      ...formData,
      tags: aiSuggestions.suggestedTags.join(', ')
    });
  };
  
  const handleTitleSelect = (title: string) => {
    setFormData({
      ...formData,
      title
    });
    setShowTitleGenerator(false);
  };
  
  const handleSave = async (publish: boolean = false) => {
    if (!reelUrl) return;
    if (!formData.title.trim()) {
      alert('Please enter a title for your reel');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Extract tags from the tags field
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Parse video dimensions and duration from URL or set defaults
      // In a real implementation, this would be available from Cloudinary metadata
      const aspectRatio = '9:16'; // Default for reels
      const duration = 30; // Default duration in seconds
      
      // Create the content item
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
            id: '1',
            publicId: 'reel-1',
            url: reelUrl,
            type: 'video',
            format: 'mp4'
          }
        ],
        thumbnailUrl: reelUrl.replace('/video/', '/image/').replace('.mp4', '.jpg'), 
        aspectRatio,
        duration,
        socialPlatforms: formData.platforms
      });
      
      // Redirect back to content management
      router.push('/admin/content-ai');
    } catch (error) {
      console.error('Error saving reel:', error);
      alert('Failed to save reel. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Social Media Reel</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and customize video reels for social media
            </p>
          </div>
          
          <div>
            <Link
              href="/admin/content-ai"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to Content Management
            </Link>
          </div>
        </div>
        
        {/* Step indicators */}
        <div className="relative">
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
            <div style={{ width: step === 'create' ? '50%' : '100%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 transition-all duration-500"></div>
          </div>
          <div className="flex justify-between">
            <div className="text-xs text-primary-600 font-semibold">Create Reel</div>
            <div className={`text-xs ${step === 'details' ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>Add Details & Publish</div>
          </div>
        </div>
        
        {step === 'create' && (
          <div>
            <ErrorBoundary>
              <ReelEditor onComplete={handleReelCreated} />
            </ErrorBoundary>
          </div>
        )}
        
        {step === 'details' && reelUrl && (
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Reel Details</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add information about your reel
              </p>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  {/* AI Content Generation Options */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-gray-900">AI Content Generator</h4>
                      <div className="flex space-x-2">
                        <select
                          value={selectedTheme}
                          onChange={(e) => setSelectedTheme(e.target.value)}
                          className="text-xs border-gray-300 rounded-md"
                        >
                          <option value="dogs">Dogs</option>
                          <option value="walking">Walking</option>
                          <option value="training">Training</option>
                          <option value="care">Pet Care</option>
                        </select>
                        <select
                          value={selectedTone}
                          onChange={(e) => setSelectedTone(e.target.value)}
                          className="text-xs border-gray-300 rounded-md"
                        >
                          <option value="professional">Professional</option>
                          <option value="casual">Casual</option>
                          <option value="humorous">Humorous</option>
                          <option value="inspirational">Inspirational</option>
                        </select>
                        <button
                          type="button"
                          onClick={generateAIContent}
                          disabled={isGeneratingAI}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 disabled:opacity-50"
                        >
                          {isGeneratingAI ? 'Generating...' : 'Generate'}
                        </button>
                      </div>
                    </div>
                    
                    {aiSuggestions && (
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 mb-1">Title Suggestions</h5>
                          <div className="space-y-1">
                            {aiSuggestions.titles.map((title, idx) => (
                              <div key={`title-${idx}`} className="flex justify-between bg-white p-2 rounded border border-gray-100 hover:border-gray-300 text-sm">
                                <span>{title}</span>
                                <button
                                  type="button"
                                  onClick={() => applyAISuggestion('title', idx)}
                                  className="text-xs text-primary-600 hover:text-primary-800"
                                >
                                  Use
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-xs font-medium text-gray-700 mb-1">Description Suggestions</h5>
                          <div className="space-y-1">
                            {aiSuggestions.descriptions.map((desc, idx) => (
                              <div key={`desc-${idx}`} className="flex justify-between bg-white p-2 rounded border border-gray-100 hover:border-gray-300 text-sm">
                                <span className="line-clamp-1">{desc}</span>
                                <button
                                  type="button"
                                  onClick={() => applyAISuggestion('description', idx)}
                                  className="text-xs text-primary-600 hover:text-primary-800 flex-shrink-0 ml-2"
                                >
                                  Use
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between">
                            <h5 className="text-xs font-medium text-gray-700 mb-1">Suggested Tags</h5>
                            <button
                              type="button"
                              onClick={applyAITags}
                              className="text-xs text-primary-600 hover:text-primary-800"
                            >
                              Apply All
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {aiSuggestions.suggestedTags.map((tag, idx) => (
                              <span key={`tag-${idx}`} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!aiSuggestions && !isGeneratingAI && (
                      <div className="text-sm text-gray-500 text-center py-2">
                        Click "Generate" to create AI-powered suggestions
                      </div>
                    )}
                    
                    {isGeneratingAI && (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Title
                      </label>
                      <button
                        type="button" 
                        onClick={() => setShowTitleGenerator(true)}
                        className="text-xs text-primary-600 hover:text-primary-800"
                      >
                        More title ideas →
                      </button>
                    </div>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="Enter a catchy title for your reel"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      placeholder="Describe the content of your reel"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleChange}
                      placeholder="reel, dogs, walking, summer"
                      className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                      Target Platforms
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { id: 'instagram', label: 'Instagram' },
                        { id: 'tiktok', label: 'TikTok' },
                        { id: 'facebook', label: 'Facebook' },
                        { id: 'twitter', label: 'Twitter' }
                      ].map(platform => (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => handlePlatformToggle(platform.id as any)}
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            formData.platforms.includes(platform.id as any)
                              ? 'bg-primary-100 text-primary-800 border-primary-300'
                              : 'bg-gray-100 text-gray-800 border-gray-300'
                          } border`}
                        >
                          {platform.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
                  <div className="relative pt-[177.78%] bg-black rounded-lg overflow-hidden">
                    {reelUrl && (
                      <video 
                        src={reelUrl} 
                        controls 
                        className="absolute inset-0 w-full h-full object-contain"
                        onError={(e) => {
                          console.error("Video load error:", e);
                          e.currentTarget.src = ""; // Clear source on error
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('create')}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Editor
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isSaving ? 'Publishing...' : 'Publish Now'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Title Generator Modal */}
        {showTitleGenerator && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Title Generator</h3>
                <button
                  onClick={() => setShowTitleGenerator(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <TitleGenerator
                onSelect={handleTitleSelect}
                initialTitle={formData.title}
              />
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 