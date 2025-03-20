'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getPastWalks, getDogById } from '@/utils/helpers';

export default function WalkerReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if not a walker or admin
  useEffect(() => {
    if (!loading && user && user.role !== 'walker' && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, loading, router]);

  // If loading or not walker/admin, show loading state
  if (loading || !user || (user.role !== 'walker' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const walkerId = user.profileId;
  const pastWalks = getPastWalks(undefined, undefined, walkerId);

  // Calculate metrics
  const totalDistance = pastWalks.reduce((sum, walk) => {
    if (walk.metrics?.distanceCovered) {
      return sum + walk.metrics.distanceCovered;
    }
    return sum;
  }, 0);

  const totalTime = pastWalks.reduce((sum, walk) => {
    if (walk.metrics?.totalTime) {
      return sum + walk.metrics.totalTime;
    }
    return sum;
  }, 0);

  const dogsWalked = new Set(pastWalks.map(walk => walk.dogId)).size;

  const avgRating = pastWalks.reduce((sum, walk, _, array) => {
    if (walk.feedback?.rating) {
      return sum + walk.feedback.rating / array.length;
    }
    return sum;
  }, 0);

  // Count walks by dog
  const walksByDog = pastWalks.reduce((acc, walk) => {
    if (!acc[walk.dogId]) {
      acc[walk.dogId] = 0;
    }
    acc[walk.dogId]++;
    return acc;
  }, {} as Record<string, number>);

  // Sort by most walked
  const sortedDogs = Object.entries(walksByDog)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Distance</p>
          <p className="text-2xl font-bold text-gray-900">{totalDistance.toFixed(1)} km</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Time</p>
          <p className="text-2xl font-bold text-gray-900">{Math.floor(totalTime / 60)} hrs {totalTime % 60} min</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Dogs Walked</p>
          <p className="text-2xl font-bold text-gray-900">{dogsWalked}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Average Rating</p>
          <p className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}/5</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Walked Dogs</h2>
          
          {sortedDogs.length === 0 ? (
            <p className="text-gray-500">No walks recorded yet</p>
          ) : (
            <div className="space-y-4">
              {sortedDogs.map(([dogId, count]) => {
                const dog = getDogById(dogId);
                if (!dog) return null;
                
                return (
                  <div key={dogId} className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">{count}</span>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-gray-900">{dog.name}</p>
                      <p className="text-xs text-gray-500">{dog.breed}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stats by Month</h2>
          <div className="flex items-center justify-center h-48">
            <p className="text-gray-500">Monthly stats coming soon</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Performance charts coming soon</p>
        </div>
      </div>
    </div>
  );
} 