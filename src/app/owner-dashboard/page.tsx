'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { useOwnerDogs, useOwnerByUserId, useUserSubscriptions } from '@/lib/hooks/useDataHooks';
import { useUpcomingWalks } from '@/lib/hooks/useBookingHooks';
import { format } from 'date-fns';
import { Dog, Owner, UserSubscription, Walk } from '@/lib/types';
import { api } from '@/lib/api/client';

// Temporary dashboard block components
const DogCard = ({ dog }: { dog: Dog }) => (
  <Link href={`/owner-dashboard/dogs/${dog.id}`} className="block">
    <div className="border rounded-lg shadow-sm hover:shadow-md transition duration-200 overflow-hidden">
      <div className="h-32 bg-gray-200 relative">
        {dog.imageUrl ? (
          <img src={dog.imageUrl} alt={dog.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🐕</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{dog.name}</h3>
        <p className="text-sm text-gray-600">{dog.breed || 'Mixed Breed'}</p>
        <p className="text-xs text-gray-500 mt-1">
          {dog.age ? `${dog.age} years` : ''} {dog.size ? `• ${dog.size} size` : ''}
        </p>
      </div>
    </div>
  </Link>
);

const UpcomingWalkCard = ({ walk }: { walk: Walk }) => (
  <div className="p-4 hover:bg-gray-50">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold text-gray-900">
          {walk.dogName || (walk.dog ? walk.dog.name : 'Dog')}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {walk.date && format(new Date(walk.date), 'EEEE, MMMM d, yyyy')}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {walk.timeSlot || 'Scheduled time'} with 
          {' '}{walk.walkerName || (walk.walker ? walk.walker.name : 'your walker')}
        </p>
      </div>
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        {walk.status || 'Scheduled'}
      </span>
    </div>
  </div>
);

const WelcomeCard = ({ name, isLoading }: { name: string, isLoading?: boolean }) => (
  <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
    <h1 className="text-2xl font-bold">
      {isLoading ? (
        <div className="h-8 bg-primary-500 animate-pulse rounded w-48"></div>
      ) : (
        <>Welcome back, {name}!</>
      )}
    </h1>
    <p className="mt-2 opacity-90">Manage your dogs, bookings, and subscriptions from your dashboard.</p>
  </div>
);

const SubscriptionStatusCard = ({ 
  subscription, 
  hasDogs, 
  isLoading 
}: { 
  subscription: UserSubscription | null, 
  hasDogs: boolean,
  isLoading?: boolean
}) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="p-4 sm:p-6 border-b">
      <h2 className="text-xl font-semibold text-gray-900">Subscription Status</h2>
    </div>
    <div className="p-4 sm:p-6">
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 rounded w-1/3 mt-6"></div>
        </div>
      ) : subscription ? (
        <div>
          <div className="flex items-center mb-2">
            <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
            <span className="font-medium text-green-700">Active Subscription</span>
          </div>
          <p className="text-gray-600 mb-4">
            You have {subscription.creditsRemaining || 0} walk credits remaining.
            Expires on {format(new Date(subscription.endDate), 'MMMM d, yyyy')}
          </p>
          <Link
            href="/owner-dashboard/subscriptions"
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            Manage Subscription
          </Link>
        </div>
      ) : (
        <div>
          <div className="flex items-center mb-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="font-medium text-yellow-700">No Active Subscription</span>
          </div>
          <p className="text-gray-600 mb-4">
            Subscribe to a plan to start booking walks for your {hasDogs ? 'dogs' : 'future dogs'}.
          </p>
          <Link
            href="/owner-dashboard/subscriptions"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            View Plans
          </Link>
        </div>
      )}
    </div>
  </div>
);

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Use React Query hooks for data
  const { 
    data: dogs = [], 
    isLoading: isLoadingDogs, 
    error: dogsError,
    refetch: refetchDogs
  } = useOwnerDogs();
  
  const {
    data: ownerProfile,
    isLoading: isLoadingOwner,
    error: ownerError
  } = useOwnerByUserId();
  
  const {
    data: subscriptions = [],
    isLoading: isLoadingSubscriptions,
    error: subscriptionsError
  } = useUserSubscriptions();
  
  const {
    data: upcomingWalks = [],
    isLoading: isLoadingWalks,
    error: walksError
  } = useUpcomingWalks();

  // Local state for managing UI
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
  
  // Debug state
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Process subscriptions to find active one
  useEffect(() => {
    // Check if subscriptions is an array or has a subscriptions property
    const subscriptionList = Array.isArray(subscriptions) 
      ? subscriptions 
      : (subscriptions as any)?.subscriptions || [];
    
    if (subscriptionList.length === 0) {
      setActiveSubscription(null);
      return;
    }
    
    // Find active subscription
    const active = subscriptionList.find((sub: UserSubscription) => 
      sub.status === 'active' && new Date(sub.endDate) > new Date()
    );
    
    setActiveSubscription(active || null);
  }, [subscriptions]);

  // Process dogs data
  const dogsList = Array.isArray(dogs) ? dogs : (dogs as any)?.data || [];

  // Check if owner has no dogs yet
  const hasDogs = dogsList && dogsList.length > 0;
  
  // Check if owner has active subscription
  const hasActiveSubscription = activeSubscription !== null;
  
  // Check if owner has upcoming walks
  const hasUpcomingWalks = upcomingWalks && upcomingWalks.length > 0;

  // Debug info logging
  useEffect(() => {
    console.log('Owner Dashboard - Current user:', user);
    console.log('Owner Dashboard - Owner profile:', ownerProfile);
    console.log('Owner Dashboard - Dogs:', dogs);
    console.log('Owner Dashboard - Subscriptions:', subscriptions);
    console.log('Owner Dashboard - Upcoming walks:', upcomingWalks);
  }, [user, ownerProfile, dogs, subscriptions, upcomingWalks]);

  // Determine loading state
  const isLoading = isLoadingDogs || isLoadingOwner || isLoadingSubscriptions || isLoadingWalks;

  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'owner-dashboard' }}>
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-gray-700">Debug Information</h2>
              <button 
                onClick={() => setShowDebugPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold mb-1">User</h3>
                <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="text-xs font-semibold mb-1">Owner Profile</h3>
                <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(ownerProfile, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="text-xs font-semibold mb-1">Dogs ({dogsList.length})</h3>
                <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(dogsList.map((d: Dog) => ({ id: d.id, name: d.name, ownerId: d.ownerId })), null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="text-xs font-semibold mb-1">Subscriptions ({Array.isArray(subscriptions) ? subscriptions.length : 0})</h3>
                <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(subscriptions, null, 2)}
                </pre>
              </div>
            </div>
            <div className="mt-2 flex space-x-2">
              <button
                onClick={() => refetchDogs()}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
              >
                Refresh Dogs
              </button>
              <button
                onClick={() => router.refresh()}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}
        
        {/* Welcome Section */}
        <WelcomeCard 
          name={(ownerProfile as Owner)?.name || (ownerProfile as Owner)?.email || user?.name || 'Pet Owner'} 
          isLoading={isLoadingOwner}
        />
        
        {/* Main Dashboard Grid */}
        <div className="mt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading your dashboard...</span>
            </div>
          ) : dogsError || ownerError || subscriptionsError || walksError ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {dogsError instanceof Error ? dogsError.message : 
                     ownerError instanceof Error ? ownerError.message : 
                     subscriptionsError instanceof Error ? subscriptionsError.message : 
                     walksError instanceof Error ? walksError.message : 
                     'An error occurred while loading dashboard data'}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
              {/* Left Column - 4/6 width */}
              <div className="lg:col-span-4 space-y-6">
                {/* My Dogs Section */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-4 sm:p-6 flex justify-between items-center border-b">
                    <h2 className="text-xl font-semibold text-gray-900">My Dogs</h2>
                    <Link
                      href="/owner-dashboard/dogs"
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      View All Dogs
                    </Link>
                  </div>
                  
                  <div className="p-4 sm:p-6">
                    {hasDogs ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {dogsList.slice(0, 4).map((dog: Dog) => (
                          <DogCard key={dog.id} dog={dog} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="text-4xl mb-2">🐾</div>
                        <h3 className="text-lg font-medium text-gray-900">No dogs added yet</h3>
                        <p className="mt-1 text-gray-500 max-w-lg mx-auto">
                          Add your furry friends to get started with scheduling walks.
                        </p>
                        <div className="mt-4">
                          <Link
                            href="/owner-dashboard/dogs/add"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                          >
                            Add a Dog
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Upcoming Walks Section */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-4 sm:p-6 flex justify-between items-center border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Upcoming Walks</h2>
                    <Link
                      href="/owner-dashboard/bookings"
                      className="text-primary-600 hover:text-primary-700 text-sm"
                    >
                      View All Bookings
                    </Link>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {hasUpcomingWalks ? (
                      upcomingWalks.slice(0, 3).map((walk) => (
                        <UpcomingWalkCard key={walk.id} walk={walk} />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🗓️</div>
                        <h3 className="text-lg font-medium text-gray-900">No upcoming walks</h3>
                        <p className="mt-1 text-gray-500 max-w-lg mx-auto">
                          Schedule a walk for your dog with our professional walkers.
                        </p>
                        <div className="mt-4">
                          <Link
                            href="/owner-dashboard/create-booking"
                            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                              !hasDogs || !hasActiveSubscription
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'text-white bg-primary-600 hover:bg-primary-700'
                            }`}
                            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                              if (!hasDogs) {
                                e.preventDefault();
                                alert('Please add a dog first before booking a walk.');
                              } else if (!hasActiveSubscription) {
                                e.preventDefault();
                                alert('Please purchase a subscription plan before booking a walk.');
                              }
                            }}
                          >
                            Book a Walk
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Column - 2/6 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Subscription Status */}
                <SubscriptionStatusCard 
                  subscription={activeSubscription} 
                  hasDogs={hasDogs}
                  isLoading={isLoadingSubscriptions}
                />
                
                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="p-4 sm:p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
                  </div>
                  <div className="p-4 sm:p-6 divide-y divide-gray-200">
                    <Link 
                      href="/owner-dashboard/create-booking" 
                      className="block py-3 px-2 text-gray-800 hover:bg-gray-50 rounded flex items-center"
                    >
                      <div className="bg-primary-100 p-2 rounded-full mr-3">
                        <span className="text-primary-600">🐕</span>
                      </div>
                      <div>
                        <div className="font-medium">Book a Walk</div>
                        <div className="text-sm text-gray-500">Schedule a new walk for your dog</div>
                      </div>
                    </Link>
                    
                    <Link 
                      href="/owner-dashboard/dogs/add" 
                      className="block py-3 px-2 text-gray-800 hover:bg-gray-50 rounded flex items-center"
                    >
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <span className="text-green-600">➕</span>
                      </div>
                      <div>
                        <div className="font-medium">Add a Dog</div>
                        <div className="text-sm text-gray-500">Register a new dog to your account</div>
                      </div>
                    </Link>
                    
                    <Link 
                      href="/owner-dashboard/profile" 
                      className="block py-3 px-2 text-gray-800 hover:bg-gray-50 rounded flex items-center"
                    >
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <span className="text-blue-600">👤</span>
                      </div>
                      <div>
                        <div className="font-medium">Edit Profile</div>
                        <div className="text-sm text-gray-500">Update your personal information</div>
                      </div>
                    </Link>
                    
                    <Link 
                      href="/owner-dashboard/help" 
                      className="block py-3 px-2 text-gray-800 hover:bg-gray-50 rounded flex items-center"
                    >
                      <div className="bg-yellow-100 p-2 rounded-full mr-3">
                        <span className="text-yellow-600">❓</span>
                      </div>
                      <div>
                        <div className="font-medium">Get Help</div>
                        <div className="text-sm text-gray-500">Contact support or read FAQs</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Debug button */}
        <button
          onClick={() => setShowDebugPanel(prev => !prev)}
          className="fixed bottom-4 right-4 bg-gray-800 text-white text-xs px-3 py-1 rounded-full opacity-50 hover:opacity-100"
        >
          Debug
        </button>
      </div>
    </RouteGuard>
  );
} 