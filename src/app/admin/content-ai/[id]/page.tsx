'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { 
  ContentItem, 
  ContentType, 
  ContentStatus, 
  getContentItemById, 
  updateContentItem, 
  deleteContentItem 
} from '@/lib/contentAIService';

export default function ContentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch content by ID from the service
    const fetchContent = async () => {
      try {
        const contentItem = await getContentItemById(params.id);
        
        if (contentItem) {
          setContent(contentItem);
          setEditedContent(contentItem.content);
          setEditedTitle(contentItem.title);
          
          if (contentItem.scheduledFor) {
            // Format date for datetime-local input
            const date = new Date(contentItem.scheduledFor);
            const formattedDate = date.toISOString().slice(0, 16);
            setScheduledDate(formattedDate);
          }
        }
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [params.id]);

  // Get status badge color
  const getStatusBadgeClass = (status: ContentStatus) => {
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
  const getTypeBadgeClass = (type: ContentType) => {
    switch (type) {
      case 'blog':
        return 'bg-purple-100 text-purple-800';
      case 'social':
        return 'bg-pink-100 text-pink-800';
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'announcement':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Toggle edit mode
  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  // Save changes
  const saveChanges = async () => {
    if (!content) return;
    
    setSaving(true);
    
    try {
      const updatedContent = await updateContentItem(content.id, {
        title: editedTitle,
        content: editedContent,
        scheduledFor: content.status === 'scheduled' ? scheduledDate : undefined
      });
      
      if (updatedContent) {
        setContent(updatedContent);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Update status
  const updateStatus = async (newStatus: ContentStatus) => {
    if (!content) return;
    
    setSaving(true);
    
    try {
      const updatedContent = await updateContentItem(content.id, {
        status: newStatus,
        scheduledFor: newStatus === 'scheduled' ? scheduledDate : undefined
      });
      
      if (updatedContent) {
        setContent(updatedContent);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Delete content
  const deleteContentHandler = async () => {
    if (!window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }
    
    setSaving(true);
    
    try {
      const deleted = await deleteContentItem(content!.id);
      
      if (deleted) {
        router.push('/admin/content-ai');
      } else {
        alert('Failed to delete content. Please try again.');
        setSaving(false);
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content. Please try again.');
      setSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </RouteGuard>
    );
  }

  if (!content) {
    return (
      <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Content Not Found</h3>
          <p className="mt-2 text-sm text-gray-500">The content you're looking for could not be found.</p>
          <div className="mt-6">
            <Link
              href="/admin/content-ai"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Return to Content Management
            </Link>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 mr-3">{isEditing ? 'Edit Content' : 'Content Details'}</h1>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(content.status)}`}>
                {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
              </span>
              <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeClass(content.type)}`}>
                {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Make changes to your content' : content.summary}
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
        
        <div className="bg-white shadow sm:rounded-lg">
          <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-lg"
                    />
                  ) : (
                    content.title
                  )}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Created {formatDate(content.createdAt)} • Last updated {formatDate(content.updatedAt)}
                </p>
              </div>
              
              <div className="flex space-x-3">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveChanges}
                      disabled={saving}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={toggleEditing}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={deleteContentHandler}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="px-4 py-5 sm:px-6">
            {isEditing ? (
              <div className="mb-4">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={20}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                
                {content.status === 'scheduled' && (
                  <div className="mt-4">
                    <label htmlFor="scheduled-date" className="block text-sm font-medium text-gray-700">Scheduled Publication Date</label>
                    <input
                      type="datetime-local"
                      id="scheduled-date"
                      name="scheduled-date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <MarkdownRenderer content={content.content} />
              </div>
            )}
            
            {!isEditing && (
              <div className="mt-6">
                <div className="flex flex-wrap gap-2">
                  {content.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {!isEditing && (
            <div className="px-4 py-5 bg-gray-50 sm:px-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Content Actions</h3>
              <div className="flex space-x-3">
                {content.status !== 'published' && (
                  <button
                    type="button"
                    onClick={() => updateStatus('published')}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Publish Now
                  </button>
                )}
                
                {content.status !== 'draft' && (
                  <button
                    type="button"
                    onClick={() => updateStatus('draft')}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Revert to Draft
                  </button>
                )}
                
                {content.status !== 'scheduled' && (
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setScheduledDate(tomorrow.toISOString().slice(0, 16));
                      setIsEditing(true);
                      updateStatus('scheduled');
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Schedule
                  </button>
                )}
                
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Duplicate
                </button>
                
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Export
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Content Analytics</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Views</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">1,245</dd>
                  <div className="mt-4">
                    <div className="relative">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                        <div style={{ width: "70%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"></div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="text-green-500 font-medium">+12%</span> from last week
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Engagement</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">8.4%</dd>
                  <div className="mt-4">
                    <div className="relative">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                        <div style={{ width: "55%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"></div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="text-green-500 font-medium">+3.2%</span> from average
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Conversions</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">3.6%</dd>
                  <div className="mt-4">
                    <div className="relative">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                        <div style={{ width: "40%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"></div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="text-red-500 font-medium">-0.5%</span> from average
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 