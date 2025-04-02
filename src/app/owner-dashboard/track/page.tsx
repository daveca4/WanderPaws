'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLiveWalk } from '@/lib/hooks/useLocationHooks';
import { WalkFeedback } from '@/components/WalkFeedback';
import { WalkMap } from '@/components/WalkMap';
import { Walk } from '@/lib/types';

// Simple placeholder components until we build real ones
function WalkStatusBar({ walk }: { walk: Walk }) {
  const getStatusColor = () => {
    switch (walk.status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow mb-6 flex items-center justify-between">
      <div>
        <h2 className="font-medium">Current Status</h2>
        <div className="flex items-center mt-1">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
            {walk.status === 'completed' ? 'Completed' : 
             walk.status === 'cancelled' ? 'Cancelled' : 
             walk.status === 'scheduled' ? 'Scheduled' : 'In Progress'}
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-sm text-gray-500">Walk ID</p>
        <p className="text-sm font-mono">{walk.id.substring(0, 8)}</p>
      </div>
    </div>
  );
}

function WalkDetailsSidebar({ walk }: { walk: Walk }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-medium text-lg">Walk Details</h3>
      </div>
      
      <div className="p-4 space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Dog</h4>
          <p className="mt-1">{walk.dog?.name || walk.dogName || 'Not specified'}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Walker</h4>
          <p className="mt-1">{walk.walker?.name || walk.walkerName || 'Not assigned'}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Date</h4>
          <p className="mt-1">{walk.date ? formatDate(walk.date) : 'Not scheduled'}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Time</h4>
          <p className="mt-1">{walk.timeSlot || 'Not specified'}</p>
        </div>
        
        {walk.status === 'completed' && walk.metrics && (
          <>
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-500">Distance</h4>
              <p className="mt-1">{walk.metrics.distance || 0} miles</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Duration</h4>
              <p className="mt-1">{Math.round((walk.metrics.duration || 0) / 60)} minutes</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TrackWalkPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const walkId = searchParams.get('walkId');
  
  // State
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Get walk data with React Query
  const {
    data: walk,
    isLoading: walkLoading,
    error: walkError,
    refetch
  } = useLiveWalk(walkId || '');
  
  // Redirect if no walkId provided
  useEffect(() => {
    if (!loading && !walkId) {
      router.push('/owner-dashboard/walks');
    }
  }, [walkId, loading, router]);
  
  // Redirect if not an owner of this walk
  useEffect(() => {
    if (!loading && user && walk && walk.ownerId !== user.profileId) {
      router.push('/unauthorized');
    }
  }, [user, loading, walk, router]);
  
  // Show feedback form when walk completes
  useEffect(() => {
    if (walk && walk.status === 'completed' && !walk.feedback) {
      setShowFeedback(true);
    }
  }, [walk]);
  
  // Handle feedback submission
  const handleFeedbackSubmit = () => {
    setShowFeedback(false);
    refetch(); // Refresh data after feedback is submitted
  };
  
  // Loading state
  if (loading || walkLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Error state
  if (walkError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {typeof walkError === 'object' && walkError !== null && 'message' in walkError
                ? (walkError as { message: string }).message
                : 'Error loading walk data. Please try again.'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // No walk found
  if (!walk) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              No walk found with ID: {walkId}. Please check the walk ID and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Track Walk</h1>
      </div>
      
      <WalkStatusBar walk={walk} />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map - takes 3/4 of the space on large screens */}
        <div className="lg:col-span-3">
          <WalkMap walk={walk} />
        </div>
        
        {/* Sidebar - takes 1/4 of the space on large screens */}
        <div className="lg:col-span-1">
          <WalkDetailsSidebar walk={walk} />
        </div>
      </div>
      
      {/* Feedback dialog */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Walk Feedback</h2>
            <WalkFeedback 
              walkId={walk.id} 
              onSuccess={handleFeedbackSubmit} 
              onCancel={() => setShowFeedback(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
} 