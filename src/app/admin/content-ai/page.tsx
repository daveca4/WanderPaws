'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { ContentItem, getAllContentItems } from '@/lib/contentAIService';

// Define content types
type ContentType = 'blog' | 'social' | 'email' | 'announcement' | 'video' | 'reel';
type ContentStatus = 'draft' | 'published' | 'scheduled';

export default function ContentAIPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('generate');
  const [loading, setLoading] = useState(true);
  
  // Use state for content items, loaded from service
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);

  // Load content on component mount
  useEffect(() => {
    const loadContent = async () => {
      try {
        const content = await getAllContentItems();
        setRecentContent(content);
      } catch (error) {
        console.error('Error loading content:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadContent();
  }, []);

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get content type badge color
  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'blog':
        return 'bg-purple-100 text-purple-800';
      case 'social':
        return 'bg-pink-100 text-pink-800';
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'announcement':
        return 'bg-orange-100 text-orange-800';
      case 'video':
        return 'bg-cyan-100 text-cyan-800';
      case 'reel':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Content Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create, manage, and schedule AI-generated content for your business
            </p>
          </div>
          
          <div className="flex space-x-2">
            <div className="relative inline-block text-left">
              <div>
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-primary-500"
                  id="content-options-menu"
                  onClick={() => router.push('/admin/content-ai/create')}
                >
                  Create New Content
                </button>
              </div>
            </div>

            <Link
              href="/admin/content-ai/create-reel"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Create Reel
            </Link>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('generate')}
              className={`${
                activeTab === 'generate'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Content Generation
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`${
                activeTab === 'templates'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`${
                activeTab === 'analytics'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${
                activeTab === 'settings'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Settings
            </button>
          </nav>
        </div>
        
        {/* Content Generation Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-6">
            {/* Recent Content */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Content</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {recentContent.map((item) => (
                    <li key={item.id}>
                      <Link href={`/admin/content-ai/${item.id}`} className="block hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="truncate">
                              <p className="text-sm font-medium text-primary-600 truncate">
                                {item.title}
                              </p>
                              <div className="mt-1">
                                <p className="text-xs text-gray-500 truncate">
                                  {new Date(item.updatedAt).toLocaleDateString()} • {item.summary}
                                </p>
                              </div>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeClass(item.type)}`}>
                                {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                              </span>
                              <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(item.status)}`}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* AI Content Ideas */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">AI Content Ideas</h2>
              <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="border rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-colors">
                      <h3 className="text-sm font-medium text-gray-900">Season-Specific Dog Care Tips</h3>
                      <p className="mt-1 text-sm text-gray-500">AI-generated content about caring for dogs in current season.</p>
                    </div>
                    <div className="border rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-colors">
                      <h3 className="text-sm font-medium text-gray-900">Breed Spotlight Series</h3>
                      <p className="mt-1 text-sm text-gray-500">Weekly content highlighting different dog breeds and their needs.</p>
                    </div>
                    <div className="border rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-colors">
                      <h3 className="text-sm font-medium text-gray-900">Walker Success Stories</h3>
                      <p className="mt-1 text-sm text-gray-500">Testimonials and success stories from our top-rated dog walkers.</p>
                    </div>
                    <div className="border rounded-lg p-4 hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-colors">
                      <h3 className="text-sm font-medium text-gray-900">Local Dog-Friendly Places</h3>
                      <p className="mt-1 text-sm text-gray-500">Content about dog-friendly parks, cafes, and attractions in your area.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Content Templates</h2>
              <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Create Template
              </button>
            </div>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                <li className="cursor-pointer hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-primary-600">Blog Post Template</h3>
                        <p className="mt-1 text-xs text-gray-500">Standard blog format with intro, body sections, and conclusion</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Blog</span>
                        <button className="text-gray-400 hover:text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
                <li className="cursor-pointer hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-primary-600">Social Media Post</h3>
                        <p className="mt-1 text-xs text-gray-500">Short-form content with hashtags and call to action</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-pink-100 text-pink-800">Social</span>
                        <button className="text-gray-400 hover:text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
                <li className="cursor-pointer hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-primary-600">Social Media Reel</h3>
                        <p className="mt-1 text-xs text-gray-500">Engaging video reel with transition effects and music</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">Reel</span>
                        <button className="text-gray-400 hover:text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
                <li className="cursor-pointer hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-primary-600">Email Newsletter</h3>
                        <p className="mt-1 text-xs text-gray-500">Email format with header, main content, and footer sections</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Email</span>
                        <button className="text-gray-400 hover:text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Content Performance</h2>
            
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Views</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">2,457</div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="sr-only">Increased by</span>
                            12.5%
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Engagement Rate</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">8.3%</div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                            <svg className="self-center flex-shrink-0 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="sr-only">Increased by</span>
                            2.1%
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">3.6%</div>
                          <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                            <svg className="self-center flex-shrink-0 h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="sr-only">Decreased by</span>
                            0.5%
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Top Performing Content</h3>
                <div className="mt-4">
                  <div className="flex flex-col">
                    <div className="overflow-x-auto">
                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
                          <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Title</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Views</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Engagement</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Conversions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              <tr>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Top 10 Dog Walking Tips for Summer</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Blog</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">1,245</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">12.8%</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">4.2%</td>
                              </tr>
                              <tr>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">How to Choose the Perfect Dog Walker</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Blog</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">986</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">9.5%</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">3.8%</td>
                              </tr>
                              <tr>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">Monthly Dog Care Newsletter - June</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">Email</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">754</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">7.2%</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">2.9%</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Content Management Settings</h2>
            
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">AI Content Generation</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Configure your AI content generation settings and preferences.</p>
                </div>
                <div className="mt-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label htmlFor="tone" className="block text-sm font-medium text-gray-700">Default Tone</label>
                        <select
                          id="tone"
                          name="tone"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          defaultValue="professional"
                        >
                          <option value="professional">Professional</option>
                          <option value="friendly">Friendly</option>
                          <option value="casual">Casual</option>
                          <option value="formal">Formal</option>
                          <option value="enthusiastic">Enthusiastic</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="language" className="block text-sm font-medium text-gray-700">Default Language</label>
                        <select
                          id="language"
                          name="language"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          defaultValue="en"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="it">Italian</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="model" className="block text-sm font-medium text-gray-700">AI Model</label>
                        <select
                          id="model"
                          name="model"
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          defaultValue="gpt-4"
                        >
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-3.5">GPT-3.5</option>
                          <option value="claude">Claude</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="brand-keywords" className="block text-sm font-medium text-gray-700">Brand Keywords</label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="brand-keywords"
                          id="brand-keywords"
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="dog walking, pet care, professional, reliable, local"
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">Comma-separated keywords that define your brand voice and values.</p>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="auto-publish"
                        name="auto-publish"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="auto-publish" className="ml-2 block text-sm text-gray-900">
                        Enable auto-publishing for scheduled content
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="content-approval"
                        name="content-approval"
                        type="checkbox"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        defaultChecked
                      />
                      <label htmlFor="content-approval" className="ml-2 block text-sm text-gray-900">
                        Require content approval before publishing
                      </label>
                    </div>
                  </div>
                  
                  <div className="mt-5">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">API Integrations</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Connect to external services for content publishing and distribution.</p>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">Facebook</h4>
                        <p className="text-xs text-gray-500">Connected as WanderPaws</p>
                      </div>
                    </div>
                    <button className="text-sm text-red-600 hover:text-red-500">Disconnect</button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="h-8 w-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.023 10.023 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63a9.936 9.936 0 002.46-2.548l-.047-.02z"/>
                      </svg>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">Twitter</h4>
                        <p className="text-xs text-gray-500">Connected as @WanderPaws</p>
                      </div>
                    </div>
                    <button className="text-sm text-red-600 hover:text-red-500">Disconnect</button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="h-8 w-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                      </svg>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">Pinterest</h4>
                        <p className="text-xs text-gray-500">Not connected</p>
                      </div>
                    </div>
                    <button className="text-sm text-primary-600 hover:text-primary-500">Connect</button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="h-8 w-8 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.897 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.897-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                      </svg>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">Instagram</h4>
                        <p className="text-xs text-gray-500">Connected as @wanderpaws_official</p>
                      </div>
                    </div>
                    <button className="text-sm text-red-600 hover:text-red-500">Disconnect</button>
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