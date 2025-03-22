'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';

export default function TestReelPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [reelUrl, setReelUrl] = useState('');
  const [error, setError] = useState('');

  // Load media items
  useEffect(() => {
    const loadMediaItems = async () => {
      try {
        setLoading(true);
        
        // For testing, we'll use mock data if API isn't available
        const mockData = [
          {
            id: 'img1',
            publicId: 'from-s3/s3-20230615-dog1_yevizr',
            url: 'https://res.cloudinary.com/dggxbflnu/image/upload/v1623456789/from-s3/s3-20230615-dog1_yevizr.jpg',
            type: 'image'
          },
          {
            id: 'img2',
            publicId: 'from-s3/s3-20230615-dog2_pxcmof',
            url: 'https://res.cloudinary.com/dggxbflnu/image/upload/v1623456789/from-s3/s3-20230615-dog2_pxcmof.jpg',
            type: 'image'
          },
          {
            id: 'img3',
            publicId: 'from-s3/s3-20230615-dog3_lwnyrz',
            url: 'https://res.cloudinary.com/dggxbflnu/image/upload/v1623456789/from-s3/s3-20230615-dog3_lwnyrz.jpg',
            type: 'image'
          }
        ];
        
        try {
          // Try to fetch real data
          const response = await fetch('/api/s3/assets');
          if (response.ok) {
            const data = await response.json();
            setMediaItems(data.map((item: any) => ({
              id: item.id,
              publicId: item.key,
              url: item.url,
              type: item.contentType?.startsWith('image/') ? 'image' : 'video'
            })));
          } else {
            setMediaItems(mockData);
          }
        } catch (err) {
          console.log('Using mock data due to fetch error');
          setMediaItems(mockData);
        }
      } catch (err) {
        console.error('Error loading media:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMediaItems();
  }, []);

  // Toggle selection of a media item
  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Create a reel from selected media
  const createReel = async () => {
    if (selectedIds.length === 0) {
      setError('Please select at least one media item');
      return;
    }

    setCreating(true);
    setError('');

    try {
      // Prepare selected media items
      const items = selectedIds.map(id => {
        const item = mediaItems.find(m => m.id === id);
        return {
          publicId: item.publicId,
          isS3Asset: true // Mark as S3 asset to ensure proper handling
        };
      });

      // Make a direct request to the create-reel endpoint
      const response = await fetch('/api/cloudinary/create-reel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mediaItems: items,
          title: 'Test Reel',
          aspectRatio: '9:16',
          tags: ['test', 'direct-api']
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('Reel created:', result);
        setReelUrl(result.secure_url);
      } else {
        console.error('Failed to create reel:', result);
        setError(`Error: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error creating reel:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Test Reel Creation</h1>
          <Link
            href="/admin/content-ai"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to Content Management
          </Link>
        </div>

        <div className="space-y-6">
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <p className="text-sm text-yellow-800">
              This is a simplified test page for creating reels directly from the API.
              Select some media items and click "Create Test Reel".
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">Important: Cloudinary Setup Required</h3>
            <p className="text-sm text-blue-700 mb-2">
              Before creating reels, ensure your Cloudinary account is properly configured:
            </p>
            <ol className="list-decimal text-sm text-blue-700 pl-5 space-y-1">
              <li>Verify your Cloudinary API credentials in the app's environment variables</li>
              <li>Create an upload preset in your Cloudinary dashboard (Settings → Upload)</li>
              <li>Test basic uploads using the <Link href="/admin/content-ai/test-upload" className="text-blue-600 hover:underline">test upload page</Link> first</li>
            </ol>
            <div className="mt-3">
              <a 
                href="https://cloudinary.com/documentation/video_manipulation_and_delivery"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Learn more about Cloudinary video processing
              </a>
            </div>
          </div>

          {/* Media selection grid */}
          <div>
            <h2 className="text-lg font-medium mb-4">Select Media ({selectedIds.length} selected)</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {mediaItems.map(item => (
                  <div 
                    key={item.id}
                    className={`border rounded-lg overflow-hidden cursor-pointer ${
                      selectedIds.includes(item.id) ? 'ring-2 ring-primary-500' : ''
                    }`}
                    onClick={() => toggleSelection(item.id)}
                  >
                    <div className="aspect-w-1 aspect-h-1 bg-gray-100">
                      {item.type === 'image' ? (
                        <img src={item.url} alt="" className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <svg className="h-10 w-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-2 text-sm truncate">
                      {item.publicId.split('/').pop()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={createReel}
              disabled={selectedIds.length === 0 || creating}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating Reel...' : 'Create Test Reel'}
            </button>
          </div>

          {reelUrl && (
            <div className="mt-8 border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-medium mb-4">Reel Created Successfully</h2>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">URL:</p>
                <input
                  type="text"
                  value={reelUrl}
                  readOnly
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
              </div>
              <div className="aspect-w-9 aspect-h-16 bg-black rounded overflow-hidden">
                <video
                  src={reelUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
} 