'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ContentType, createContentItem, generateContentWithAI } from '@/lib/contentAIService';

export default function ContentQuickActionCard() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [contentType, setContentType] = useState<ContentType>('blog');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic) {
      alert('Please provide a topic');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Generate content
      const responses = await generateContentWithAI({
        contentType,
        tone: 'professional',
        topic,
        targetAudience: 'dog owners',
        keywords: 'dog walking, dog care, pet services',
        length: 'medium',
      });
      
      // Get the best response (highest score)
      const bestResponse = responses.sort((a, b) => b.score - a.score)[0];
      
      // Extract title from the first line of markdown content
      const title = bestResponse.content.split('\n')[0].replace('# ', '').trim();
      
      // Create summary from first paragraph after the title
      const paragraphs = bestResponse.content.split('\n\n');
      const summary = paragraphs.length > 1 
        ? paragraphs[1].substring(0, 120) + (paragraphs[1].length > 120 ? '...' : '')
        : 'AI-generated content';
      
      // Save as draft
      await createContentItem({
        title,
        content: bestResponse.content,
        type: contentType,
        status: 'draft',
        author: 'AI Assistant',
        tags: ['quick-generated', contentType],
        summary
      });
      
      alert('Content created successfully!');
      setTopic('');
      setShowForm(false);
      
      // Navigate to content management
      router.push('/admin/content-ai');
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
            <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">Content AI</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">Quick Content Generation</div>
              </dd>
            </dl>
          </div>
        </div>
        
        {showForm ? (
          <div className="mt-5 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="contentType" className="block text-sm font-medium text-gray-700">Content Type</label>
                <select
                  id="contentType"
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as ContentType)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="blog">Blog Post</option>
                  <option value="social">Social Media Post</option>
                  <option value="email">Email Newsletter</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700">Topic</label>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="E.g., Summer dog walking tips"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !topic}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
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
                    'Generate Now'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-gray-500">
              Quickly generate high-quality AI content for your needs.
            </p>
            <div className="flex justify-between">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Quick Generate
              </button>
              
              <Link
                href="/admin/content-ai"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Content Manager
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 