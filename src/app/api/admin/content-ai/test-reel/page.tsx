'use client';

import { useState, useEffect } from 'react';
import { getAssets, CloudinaryAsset } from '@/lib/cloudinaryService';
import { useAuth } from '@/lib/auth/AuthContext';

export default function TestReelPage() {
  const [mediaItems, setMediaItems] = useState<CloudinaryAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    // Check authentication
    if (!user || user.role !== 'admin') {
      setError('Unauthorized: Admin access required');
      setIsLoading(false);
      return;
    }
    
    const loadAssets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const assets = await getAssets({
          maxResults: 12,
          resourceType: 'image'
        });
        
        if (assets.length === 0) {
          setError('No media assets found. Please upload some images first.');
        }
        
        setMediaItems(assets);
      } catch (err) {
        console.error('Error loading media assets:', err);
        setError('Failed to load media assets. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAssets();
  }, [user]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Media Gallery</h1>
      
      {mediaItems.length === 0 ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <p className="text-yellow-700">No media items found. Please upload some content first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mediaItems.map((item) => (
            <div key={item.id} className="bg-white shadow rounded-lg overflow-hidden">
              <img 
                src={item.url} 
                alt={item.publicId}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <p className="truncate text-sm text-gray-500">{item.publicId}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(item.createdAt).toLocaleDateString()} · {(item.fileSize / 1024).toFixed(1)}KB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 