'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [activeTab, setActiveTab] = useState<'completed' | 'scheduled'>('completed');
  const [walkerWalks, setWalkerWalks] = useState<Walk[]>([]);

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
    }
  }, [user]);

  // Filter walks based on active tab
  const filteredWalks = walkerWalks.filter(walk => {
    if (activeTab === 'completed') {
      return walk.status === 'completed';
    } else {
      return walk.status === 'scheduled';
    }
  });

  // Sort walks by date (most recent first for completed, soonest first for scheduled)
  const sortedWalks = [...filteredWalks].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.startTime}`).getTime();
    const dateB = new Date(`${b.date}T${b.startTime}`).getTime();
    
    return activeTab === 'completed' ? dateB - dateA : dateA - dateB;
  });

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
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <nav className="flex">
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
          </nav>
        </div>
        
        <div className="p-6">
          {sortedWalks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No {activeTab} walks found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedWalks.map(walk => {
                const dog = getDogById(walk.dogId);
                
                if (!dog) return null;
                
                return (
                  <div key={walk.id} className="flex flex-col sm:flex-row sm:items-center p-4 rounded-lg border border-gray-100 hover:bg-gray-50">
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
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                        >
                          Add Feedback
                        </Link>
                      )}
                      
                      {walk.status === 'completed' && walk.feedback && (
                        <span className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md text-green-700 bg-green-100">
                          Feedback Provided
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 