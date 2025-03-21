'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardWidget } from '../DashboardWidget';
import { S3Asset, getS3Assets } from '@/lib/s3Service';

export const MediaGalleryWidget = () => {
  const [recentMedia, setRecentMedia] = useState<S3Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const loadRecentMedia = async () => {
      try {
        setLoading(true);
        // Fetch recent media - we'll use the most recent 6
        const assets = await getS3Assets();
        // Sort by upload date, newest first
        const sorted = [...assets].sort((a, b) => 
          new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime()
        );
        
        setRecentMedia(sorted.slice(0, 6));
        setTotalCount(assets.length);
      } catch (error) {
        console.error('Error loading recent media:', error);
        setRecentMedia([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecentMedia();
  }, []);

  return (
    <DashboardWidget title="Media Gallery">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {totalCount} total files
          </div>
          <Link
            href="/admin/media"
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : recentMedia.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No media uploads yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {recentMedia.map((media) => (
              <div 
                key={media.id} 
                className="relative overflow-hidden rounded border border-gray-200 group"
                style={{ paddingBottom: '100%' }}
              >
                {media.contentType.startsWith('image/') ? (
                  <img
                    src={media.url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Link 
                    href="/admin/media" 
                    className="text-white text-xs font-medium"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-center">
          <Link
            href="/admin/media"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Manage Media
          </Link>
        </div>
      </div>
    </DashboardWidget>
  );
}; 