'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { 
  ContentType, 
  PromptResponseItem, 
  generateContentWithAI, 
  createContentItem 
} from '@/lib/contentAIService';

export default function CreateContentPage() {
  const router = useRouter();
  
  // Content creation form state
  const [contentType, setContentType] = useState<ContentType>('blog');
  const [tone, setTone] = useState('professional');
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('dog owners');
  const [keywords, setKeywords] = useState('');
  const [length, setLength] = useState('medium');
  const [prompt, setPrompt] = useState('');
  
  // Generated content state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResponses, setGeneratedResponses] = useState<PromptResponseItem[]>([]);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  
  // Form steps
  const [currentStep, setCurrentStep] = useState(1);
  
  // Handle content generation
  const generateContent = async () => {
    setIsGenerating(true);
    
    try {
      // Use the service to generate content
      const responses = await generateContentWithAI({
        contentType,
        tone,
        topic,
        targetAudience,
        keywords,
        length,
        prompt
      });
      
      setGeneratedResponses(responses);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle content selection
  const selectResponse = (index: number) => {
    setSelectedResponseIndex(index);
    setEditedContent(generatedResponses[index].content);
  };
  
  // Toggle editing mode
  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };
  
  // Save or publish content
  const saveContent = async (publish: boolean = false) => {
    if (selectedResponseIndex === null) return;
    
    try {
      const content = isEditing ? editedContent : generatedResponses[selectedResponseIndex].content;
      const status = publish ? 'published' : 'draft';
      
      // Extract title from the first line of markdown content
      const title = content.split('\n')[0].replace('# ', '').trim();
      
      // Create summary from first paragraph after the title
      const paragraphs = content.split('\n\n');
      const summary = paragraphs.length > 1 
        ? paragraphs[1].substring(0, 120) + (paragraphs[1].length > 120 ? '...' : '')
        : 'AI-generated content';
      
      // Extract tags from keywords
      const tags = keywords
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      // Save the content using the service
      await createContentItem({
        title,
        content,
        type: contentType,
        status,
        author: 'AI Assistant',
        tags,
        summary
      });
      
      // Redirect back to content management
      router.push('/admin/content-ai');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content. Please try again.');
    }
  };
  
  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create AI Content</h1>
            <p className="mt-1 text-sm text-gray-500">
              Generate high-quality content using AI
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
            <div style={{ width: `${(currentStep / 3) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 transition-all duration-500"></div>
          </div>
          <div className="flex justify-between">
            <div className={`text-xs ${currentStep >= 1 ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>Configure</div>
            <div className={`text-xs ${currentStep >= 2 ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>Choose Content</div>
            <div className={`text-xs ${currentStep >= 3 ? 'text-primary-600 font-semibold' : 'text-gray-500'}`}>Review & Publish</div>
          </div>
        </div>
        
        {currentStep === 1 && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Content Configuration</h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="content-type" className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                  <select
                    id="content-type"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as ContentType)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    <option value="blog">Blog Post</option>
                    <option value="social">Social Media Post</option>
                    <option value="email">Email Newsletter</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                  <select
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                    <option value="enthusiastic">Enthusiastic</option>
                  </select>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <input
                    type="text"
                    name="topic"
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Summer dog walking tips"
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="target-audience" className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                  <input
                    type="text"
                    name="target-audience"
                    id="target-audience"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g., Dog owners"
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-1">Content Length</label>
                  <select
                    id="length"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    <option value="short">Short (300-500 words)</option>
                    <option value="medium">Medium (500-800 words)</option>
                    <option value="long">Long (800-1500 words)</option>
                    <option value="comprehensive">Comprehensive (1500+ words)</option>
                  </select>
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="keywords"
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g., dog walking, summer, heat safety, hydration"
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Instructions (optional)
                  </label>
                  <textarea
                    id="prompt"
                    name="prompt"
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Any specific points to include or style guidance"
                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="mt-5">
                <button
                  type="button"
                  onClick={generateContent}
                  disabled={isGenerating || !topic}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    'Generate Content'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Generated Content Options</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Select the content variation you prefer. You can edit it further in the next step.
                </p>
                
                <div className="space-y-4">
                  {generatedResponses.map((response, index) => (
                    <div 
                      key={index} 
                      className={`border rounded-lg p-4 hover:border-primary-500 cursor-pointer transition-colors ${selectedResponseIndex === index ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                      onClick={() => selectResponse(index)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">Version {index + 1}</div>
                        <div className="text-xs px-2 py-1 rounded-full bg-gray-100">
                          Quality: {Math.round(response.score * 100)}%
                        </div>
                      </div>
                      <div className="text-sm text-gray-800 line-clamp-3 mb-2">
                        {response.content.split('\n')[0]}
                      </div>
                      <button className="text-xs text-primary-600 hover:text-primary-700">
                        Preview full content
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-5 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Back
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={selectedResponseIndex === null}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 3 && selectedResponseIndex !== null && (
          <div className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Review & Finalize Content</h3>
                  
                  <button
                    type="button"
                    onClick={toggleEditing}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {isEditing ? 'Preview' : 'Edit'}
                  </button>
                </div>
                
                {isEditing ? (
                  <div className="mt-2">
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={20}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                ) : (
                  <div className="mt-2 prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-200" style={{ whiteSpace: 'pre-wrap' }}>
                      {editedContent || generatedResponses[selectedResponseIndex].content}
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Back
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => saveContent(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Save as Draft
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => saveContent(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Publish Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 