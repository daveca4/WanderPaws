'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { mockWalks, mockDogs } from '@/lib/mockData';
import { Walk, Dog } from '@/lib/types';

// Function to format date in a readable format
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Function to format time
const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return new Date(0, 0, 0, hours, minutes).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Function to get dog details by ID
const getDogById = (dogId: string): Dog | undefined => {
  return mockDogs.find(dog => dog.id === dogId);
};

export default function WalkerWalksPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if there's a tab parameter in the URL
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<'completed' | 'scheduled' | 'needs-feedback' | 'group-walks'>(
    tabParam === 'needs-feedback' ? 'needs-feedback' : 
    tabParam === 'completed' ? 'completed' :
    tabParam === 'scheduled' ? 'scheduled' : 'group-walks'
  );
  const [walkerWalks, setWalkerWalks] = useState<Walk[]>([]);
  const [groupedWalks, setGroupedWalks] = useState<Record<string, Walk[]>>({});

  // Redirect if not a walker or admin
  useEffect(() => {
    if (!loading && user && user.role !== 'walker' && user.role !== 'admin') {
      router.push('/unauthorized');
    }
  }, [user, loading, router]);

  // Load walker's walks
  useEffect(() => {
    if (user?.profileId) {
      const walks = mockWalks.filter(walk => walk.walkerId === user.profileId);
      setWalkerWalks(walks);
      
      // Group walks by date and time slot
      const walkGroups: Record<string, Walk[]> = {};
      
      walks.filter(walk => walk.status === 'scheduled').forEach(walk => {
        const groupKey = `${walk.date}_${walk.startTime}_${walk.timeSlot}`;
        if (!walkGroups[groupKey]) {
          walkGroups[groupKey] = [];
        }
        walkGroups[groupKey].push(walk);
      });
      
      // Filter to only include groups with multiple dogs
      const multiDogGroups: Record<string, Walk[]> = {};
      Object.entries(walkGroups).forEach(([key, walks]) => {
        if (walks.length > 1) {
          multiDogGroups[key] = walks;
        }
      });
      
      setGroupedWalks(multiDogGroups);
    }
  }, [user]);
  
  // Update activeTab when URL parameter changes
  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'needs-feedback') {
        setActiveTab('needs-feedback');
      } else if (tabParam === 'group-walks') {
        setActiveTab('group-walks');
      } else if (tabParam === 'scheduled') {
        setActiveTab('scheduled');
      } else if (tabParam === 'completed') {
        setActiveTab('completed');
      }
    }
  }, [tabParam]);

  // Filter walks based on active tab
  const filteredWalks = walkerWalks.filter(walk => {
    if (activeTab === 'needs-feedback') {
      return walk.status === 'completed' && !walk.feedback;
    } else if (activeTab === 'completed') {
      return walk.status === 'completed';
    } else if (activeTab === 'scheduled') {
      return walk.status === 'scheduled';
    } else {
      return false; // Group walks are handled separately
    }
  });

  // Sort walks by date (most recent first for completed, soonest first for scheduled)
  const sortedWalks = [...filteredWalks].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`).getTime();
    const dateB = new Date(`${b.date}T${b.startTime}`).getTime();
    
    return activeTab === 'completed' || activeTab === 'needs-feedback' ? dateB - dateA : dateA - dateB;
  });

  // Count walks needing feedback
  const needsFeedbackCount = walkerWalks.filter(walk => 
    walk.status === 'completed' && !walk.feedback
  ).length;
  
  // Count group walks
  const groupWalksCount = Object.keys(groupedWalks).length;

  // Render a group walk card
  const renderGroupWalkCard = (groupKey: string, walks: Walk[]) => {
    const [date, startTime, timeSlot] = groupKey.split('_');
    const firstWalk = walks[0];
    
    return (
      <div key={groupKey} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Group Walk: {formatDate(date)}</h3>
            <p className="text-gray-500">{formatTime(startTime)} • {walks.length} dogs</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {timeSlot} walk
          </span>
        </div>
        
        <div className="flex flex-wrap -mx-1 mb-3">
          {walks.map(walk => {
            const dog = getDogById(walk.dogId);
            if (!dog) return null;
            
            return (
              <div key={walk.id} className="px-1 mb-1">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 relative">
                  <Image
                    src={dog.imageUrl || 'https://via.placeholder.com/32'}
                    alt={dog.name}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {walks.length} dogs, {firstWalk.duration} min
          </span>
          <div className="space-x-2">
            <Link 
              href="/walker-dashboard/walks/group"
              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              View Details
            </Link>
            <Link 
              href={`/walker-dashboard/walks/group?date=${date}&time=${startTime}&slot=${timeSlot}`}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
            >
              Manage Group
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Feedback walkthrough component
  const FeedbackWalkthrough = () => {
    const [isOpen, setIsOpen] = useState(true);
    
    if (!isOpen || activeTab !== 'needs-feedback') return null;
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between">
          <h3 className="text-lg font-medium text-blue-800">How to Provide Feedback</h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-blue-500 hover:text-blue-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <ol className="mt-3 space-y-2 text-sm text-blue-700 list-decimal list-inside">
          <li>After completing a walk, you should provide feedback for the dog</li>
          <li>Click the <span className="font-medium">Add Feedback</span> button next to any walk without feedback</li>
          <li>Rate the walk experience and provide specific details about the dog's behavior</li>
          <li>Add notes about the walk that might be helpful for the dog owner</li>
          <li>Submit the feedback to complete the process</li>
        </ol>
        
        <p className="mt-3 text-sm text-blue-700">
          <strong>Note:</strong> Providing detailed feedback helps owners and improves our service quality.
        </p>
      </div>
    );
  };

  // If loading or not walker/admin, show loading state
  if (loading || !user || (user.role !== 'walker' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Walks</h1>
      
      <FeedbackWalkthrough />
      
      {needsFeedbackCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-amber-800">
              <strong>Action Required:</strong> You have {needsFeedbackCount} {needsFeedbackCount === 1 ? 'walk' : 'walks'} that need feedback.
            </span>
          </div>
          <button 
            onClick={() => setActiveTab('needs-feedback')}
            className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-md text-sm font-medium"
          >
            Show Now
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('group-walks')}
              className={`px-6 py-3 text-sm font-medium flex items-center ${
                activeTab === 'group-walks'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Group Walks
              {groupWalksCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                  {groupWalksCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'completed'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Completed Walks
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'scheduled'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Scheduled Walks
            </button>
            {needsFeedbackCount > 0 && (
              <button
                onClick={() => setActiveTab('needs-feedback')}
                className={`px-6 py-3 text-sm font-medium flex items-center ${
                  activeTab === 'needs-feedback'
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Needs Feedback
                <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                  {needsFeedbackCount}
                </span>
              </button>
            )}
          </nav>
        </div>
        
        <div className="p-6">
          {activeTab === 'group-walks' ? (
            // Group walks tab content
            Object.keys(groupedWalks).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No group walks scheduled</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(groupedWalks).map(([groupKey, walks]) => 
                  renderGroupWalkCard(groupKey, walks)
                )}
              </div>
            )
          ) : (
            // Other tabs content
            sortedWalks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {activeTab === 'needs-feedback' 
                    ? 'No walks need feedback' 
                    : `No ${activeTab} walks found`}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedWalks.map(walk => {
                  const dog = getDogById(walk.dogId);
                  
                  if (!dog) return null;
                  
                  return (
                    <div key={walk.id} className={`flex flex-col sm:flex-row sm:items-center p-4 rounded-lg border ${
                      activeTab === 'needs-feedback' ? 'border-amber-200 bg-amber-50' : 'border-gray-100 hover:bg-gray-50'
                    }`}>
                      <div className="flex items-center">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
                          <Image
                            src={dog.imageUrl || 'https://via.placeholder.com/56'}
                            alt={dog.name}
                            width={56}
                            height={56}
                            className="object-cover"
                          />
                        </div>
                        
                        <div className="ml-4">
                          <p className="font-medium text-gray-900">{dog.name}</p>
                          <p className="text-sm text-gray-500">{dog.breed} • {dog.size}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(walk.date)} at {formatTime(walk.startTime)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 sm:mt-0 sm:ml-auto flex flex-wrap gap-2">
                        <Link 
                          href={`/walker-dashboard/walks/${walk.id}`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500"
                        >
                          View Details
                        </Link>
                        
                        {walk.status === 'completed' && !walk.feedback && (
                          <Link 
                            href={`/walker-dashboard/walks/${walk.id}/feedback`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Add Feedback
                          </Link>
                        )}
                        
                        {walk.status === 'completed' && walk.feedback && (
                          <span className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md text-green-700 bg-green-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Feedback Provided
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
} 