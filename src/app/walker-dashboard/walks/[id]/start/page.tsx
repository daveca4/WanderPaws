'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { mockWalks, mockDogs } from '@/lib/mockData';
import { Walk, Dog } from '@/lib/types';

export default function StartWalkPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const walkId = params.id;
  
  const [walk, setWalk] = useState<Walk | null>(null);
  const [dog, setDog] = useState<Dog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walkStatus, setWalkStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [dogStatus, setDogStatus] = useState<'pending' | 'picked_up' | 'dropped_off' | 'absent'>('pending');
  
  // Redirect if not a walker or admin
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'walker' && user.role !== 'admin') {
        router.push('/unauthorized');
      } else {
        // Find the walk by ID
        const foundWalk = mockWalks.find(w => w.id === walkId);
        
        // Check if the walk exists and belongs to this walker
        if (!foundWalk) {
          setError('Walk not found');
        } else if (foundWalk.walkerId !== user.profileId) {
          setError('You are not authorized to manage this walk');
        } else if (foundWalk.status !== 'scheduled') {
          setError('This walk is not scheduled. Only scheduled walks can be started.');
        } else {
          setWalk(foundWalk);
          
          // Get dog details
          const dogInfo = mockDogs.find(d => d.id === foundWalk.dogId);
          if (dogInfo) {
            setDog(dogInfo);
          } else {
            setError('Dog information not found');
          }
        }
      }
    }
  }, [walkId, user, loading, router]);
  
  // Update walk status
  const updateWalkStatus = (newStatus: 'in_progress' | 'completed') => {
    if (newStatus === 'in_progress' && dogStatus !== 'picked_up' && dogStatus !== 'absent') {
      alert('You must mark the dog as picked up or absent before starting the walk');
      return;
    }
    
    if (newStatus === 'completed' && dogStatus !== 'dropped_off' && dogStatus !== 'absent') {
      alert('You must mark the dog as dropped off or absent before completing the walk');
      return;
    }
    
    // In a real app, this would make an API call to update the status
    setWalkStatus(newStatus);
    
    // Redirect to media upload page after a delay if completed
    if (newStatus === 'completed') {
      setTimeout(() => {
        router.push(`/walker-dashboard/walks/${walkId}/media`);
      }, 2000);
    }
  };
  
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
        <h1 className="text-2xl font-bold text-gray-900">Start Walk</h1>
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
  
  if (!walk || !dog) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Start Walk</h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Loading walk details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manage Walk</h1>
        <Link
          href={`/walker-dashboard/walks/${walkId}`}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500"
        >
          Back to Walk Details
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 relative flex-shrink-0">
              <Image
                src={dog.imageUrl || 'https://via.placeholder.com/64'}
                alt={dog.name}
                width={64}
                height={64}
                className="object-cover"
              />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">{dog.name}</h2>
              <p className="text-gray-500">{dog.breed} • {dog.size}</p>
              <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {walkStatus === 'pending' ? 'Ready to Start' : 
                 walkStatus === 'in_progress' ? 'In Progress' : 
                 'Completed'}
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Manage Dog Status</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Current Status:</p>
                <div className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-800">
                  {dogStatus === 'pending' ? 'Pending Pickup' : 
                   dogStatus === 'picked_up' ? 'Picked Up' : 
                   dogStatus === 'dropped_off' ? 'Dropped Off' : 
                   'Absent/No Show'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <button 
                  onClick={() => setDogStatus('picked_up')}
                  disabled={walkStatus === 'completed'}
                  className={`py-2 px-4 rounded-md text-center ${
                    dogStatus === 'picked_up' 
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  } ${walkStatus === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Mark as Picked Up
                </button>
                
                <button 
                  onClick={() => setDogStatus('absent')}
                  disabled={walkStatus === 'completed'}
                  className={`py-2 px-4 rounded-md text-center ${
                    dogStatus === 'absent' 
                      ? 'bg-red-100 text-red-800 border-2 border-red-300' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  } ${walkStatus === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Mark as Absent
                </button>
                
                <button 
                  onClick={() => setDogStatus('dropped_off')}
                  disabled={walkStatus === 'completed' || walkStatus === 'pending'}
                  className={`py-2 px-4 rounded-md text-center ${
                    dogStatus === 'dropped_off' 
                      ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  } ${(walkStatus === 'completed' || walkStatus === 'pending') ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Mark as Dropped Off
                </button>
                
                <button 
                  onClick={() => setDogStatus('pending')}
                  disabled={walkStatus === 'completed'}
                  className={`py-2 px-4 rounded-md text-center ${
                    dogStatus === 'pending' 
                      ? 'bg-gray-200 text-gray-800 border-2 border-gray-300' 
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  } ${walkStatus === 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Reset Status
                </button>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Walk Progress</h3>
            
            <div className="space-y-4">
              {walkStatus === 'pending' && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-yellow-800">
                    {dogStatus === 'picked_up' || dogStatus === 'absent' ? 
                      'You can now start the walk!' : 
                      'You must pick up the dog or mark it as absent before starting the walk.'}
                  </p>
                </div>
              )}
              
              {walkStatus === 'in_progress' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800">
                    {dogStatus === 'dropped_off' || dogStatus === 'absent' ? 
                      'You can now complete the walk!' : 
                      'You must drop off the dog or mark it as absent before completing the walk.'}
                  </p>
                </div>
              )}
              
              {walkStatus === 'completed' && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800">
                    This walk has been completed. You'll be redirected to the media upload page.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {walkStatus === 'pending' && (
                  <button 
                    onClick={() => updateWalkStatus('in_progress')}
                    className="py-3 px-4 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Start Walk
                  </button>
                )}
                
                {walkStatus === 'in_progress' && (
                  <button 
                    onClick={() => updateWalkStatus('completed')}
                    className="py-3 px-4 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Complete Walk
                  </button>
                )}
                
                <Link
                  href={`/walker-dashboard/walks/${walkId}`}
                  className="py-3 px-4 rounded-md bg-gray-100 text-gray-700 font-medium text-center hover:bg-gray-200"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 