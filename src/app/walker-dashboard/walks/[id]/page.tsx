'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import { mockWalks, mockDogs } from '@/lib/mockData';
import { Walk, Dog } from '@/lib/types';

// Format date for display
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Format time
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

export default function WalkDetailPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const walkId = params.id;
  
  const [walk, setWalk] = useState<Walk | null>(null);
  const [dog, setDog] = useState<Dog | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
          setError('You are not authorized to view this walk');
        } else {
          setWalk(foundWalk);
          const dogInfo = getDogById(foundWalk.dogId);
          if (dogInfo) {
            setDog(dogInfo);
          }
        }
      }
    }
  }, [walkId, user, loading, router]);
  
  // If loading or not walker/admin, show loading state
  if (loading || !user || (user.role !== 'walker' && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // If there's an error finding the walk or it's not valid
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Walk Details</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Walk Details</h1>
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
        <h1 className="text-2xl font-bold text-gray-900">Walk Details</h1>
        <button
          onClick={() => router.push('/walker-dashboard/walks')}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500"
        >
          Back to Walks
        </button>
      </div>
      
      {walk.status === 'completed' && !walk.feedback && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-lg font-medium text-amber-800">Feedback Required</h2>
              <p className="text-amber-700 mt-1">
                Please provide feedback for this walk with {dog.name}. Your insights help the owner track their dog's progress.
              </p>
            </div>
            <Link
              href={`/walker-dashboard/walks/${walk.id}/feedback`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Provide Feedback Now
            </Link>
          </div>
        </div>
      )}
      
      {/* Add media upload reminder */}
      {walk.status === 'completed' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-lg font-medium text-blue-800">Share Walk Media</h2>
              <p className="text-blue-700 mt-1">
                Upload photos and videos from your walk with {dog.name}. Pet owners love seeing their pets having fun!
              </p>
            </div>
            <Link
              href={`/walker-dashboard/walks/${walk.id}/media`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload Media
            </Link>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
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
                  {walk.status.charAt(0).toUpperCase() + walk.status.slice(1)}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                <p className="mt-1 text-gray-900">{formatDate(walk.date)}</p>
                <p className="text-gray-900">{formatTime(walk.startTime)} ({walk.duration} minutes)</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1 text-gray-900">{walk.route?.name || 'Standard route'}</p>
              </div>
            </div>
            
            {walk.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500">Walk Notes</h3>
                <p className="mt-1 text-gray-900 whitespace-pre-line">{walk.notes}</p>
              </div>
            )}
            
            {/* Special needs or preferences section */}
            {(dog.specialNeeds.length > 0 || dog.walkingPreferences) && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Dog Information</h3>
                
                {dog.specialNeeds.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Special Needs</h4>
                    <ul className="mt-1 list-disc pl-5 text-gray-900">
                      {dog.specialNeeds.map((need, i) => (
                        <li key={i}>{need}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {dog.walkingPreferences && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Walking Preferences</h4>
                    <dl className="mt-1 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Preferred Times</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {dog.walkingPreferences.preferredTimes.join(', ')}
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Duration</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {dog.walkingPreferences.duration} minutes
                        </dd>
                      </div>
                      {dog.walkingPreferences.preferredRoutes && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Preferred Routes</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {dog.walkingPreferences.preferredRoutes.join(', ')}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Feedback section - if completed */}
          {walk.status === 'completed' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback</h3>
              
              {!walk.feedback ? (
                <div>
                  <p className="text-gray-500 mb-4">No feedback has been provided for this walk yet.</p>
                  <Link 
                    href={`/walker-dashboard/walks/${walk.id}/feedback`}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Add Feedback
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <div className="flex items-center">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg 
                            key={star}
                            className={`h-5 w-5 ${walk.feedback && star <= walk.feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-gray-700">{walk.feedback.rating}/5</span>
                      </div>
                      <span className="ml-auto text-sm text-gray-500">
                        Provided on {new Date(walk.feedback.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {walk.feedback.comment && (
                      <div className="mt-2 text-gray-700 whitespace-pre-line">
                        {walk.feedback.comment}
                      </div>
                    )}
                  </div>
                  
                  {walk.metrics && (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Walk Metrics</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-medium">{walk.metrics.totalTime} minutes</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Distance</p>
                          <p className="font-medium">{walk.metrics.distanceCovered.toFixed(1)} km</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Poops</p>
                          <p className="font-medium">{walk.metrics.poopCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Pees</p>
                          <p className="font-medium">{walk.metrics.peeCount}</p>
                        </div>
                      </div>
                      
                      {walk.metrics.behaviorsObserved && walk.metrics.behaviorsObserved.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500">Behaviors Observed</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {walk.metrics.behaviorsObserved.map((behavior, index) => (
                              <span 
                                key={index} 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {behavior}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            
            <div className="space-y-3">
              {walk.status === 'scheduled' && (
                <>
                  <Link 
                    href={`/walker-dashboard/walks/${walk.id}/start`}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Start Walk
                  </Link>
                  
                  <button className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                    Cancel Walk
                  </button>
                </>
              )}
              
              {walk.status === 'completed' && !walk.feedback && (
                <Link 
                  href={`/walker-dashboard/walks/${walk.id}/feedback`}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  Add Feedback
                </Link>
              )}
              
              {walk.status === 'completed' && (
                <Link 
                  href={`/walker-dashboard/walks/${walk.id}/media`}
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Media
                </Link>
              )}
              
              <Link 
                href={`/dogs/${dog.id}`}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                View Dog Profile
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dog Temperament</h3>
            
            <div className="space-y-2">
              {dog.temperament.map((trait, index) => (
                <div key={index} className="flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {trait}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 