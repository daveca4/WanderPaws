'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MediaUploader from '@/components/walks/MediaUploader';
import { useAuth } from '@/lib/AuthContext';
import { getBookingById } from '@/lib/mockBookings';
// Removed mock data import

export default function WalkMediaPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [walk, setWalk] = useState<any>(null);
  const [dog, setDog] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  useEffect(() => {
    if (!params.id) return;

    // Load walk details
    try {
      const walkData = getBookingById(params.id);
      if (!walkData) {
        setError('Walk not found');
        return;
      }

      // Only completed walks can have media uploaded
      if (walkData.status !== 'completed') {
        setError('Only completed walks can have media uploaded');
        return;
      }

      setWalk(walkData);

      // Get dog information
      const dogData = mockDogs.find(d => d.id === walkData.dogId);
      if (!dogData) {
        setError('Dog information not found');
        return;
      }
      
      setDog(dogData);
    } catch (err) {
      console.error('Error loading walk details:', err);
      setError('Failed to load walk details');
    }
  }, [params.id]);

  // If loading or not walker/admin, show loading state
  if (loading || !user || (user.role !== 'walker' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If there's an error, show error message
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Walk Media</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => router.push('/walker-dashboard/walks')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Return to Walks
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If walk not loaded yet, show loading
  if (!walk || !dog) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const handleUploadComplete = (assets: any[]) => {
    console.log('Upload complete with assets:', assets);
    if (assets && assets.length > 0) {
      console.log(`Successfully uploaded ${assets.length} media files`);
      setUploadComplete(true);
    } else {
      console.warn('Upload complete called but no assets were returned');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {uploadComplete ? 'Media Uploaded' : 'Upload Walk Media'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            For walk with {dog.name} on {new Date(walk.date).toLocaleDateString()}
          </p>
        </div>
        <Link
          href={`/walker-dashboard/walks/${walk.id}`}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500"
        >
          Back to Walk Details
        </Link>
      </div>

      {uploadComplete ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-12 w-12 mx-auto text-green-500 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <h2 className="text-lg font-medium text-green-800 mb-2">
            Media Upload Complete!
          </h2>
          <p className="text-green-700 mb-6">
            Thank you for sharing photos and videos from your walk with {dog.name}.
            The pet owner will be able to see these in their walk history.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href={`/walker-dashboard/walks/${walk.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Return to Walk Details
            </Link>
            <Link
              href="/walker-dashboard/walks"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              View All Walks
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Share Photos & Videos from Your Walk
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>Upload photos and videos from your walk with {dog.name}. Pet owners love seeing their pets having fun!</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Supported formats: JPEG, PNG, GIF, MP4, HEIC, QuickTime</li>
                    <li>Maximum file size: 100MB per file</li>
                    <li>You can upload up to 10 files</li>
                    <li>Files are stored in the main media gallery</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <MediaUploader 
                walkId={walk.id}
                onUploadComplete={handleUploadComplete}
                key={`uploader-${walk.id}-${uploadComplete}`}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Link
              href={`/walker-dashboard/walks/${walk.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              Skip for Now
            </Link>
          </div>
        </>
      )}
    </div>
  );
} 