'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { SubscriptionPlan, UserSubscription } from '@/lib/types';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionIdForCreation, setSessionIdForCreation] = useState<string | null>(null);
  
  // Find active subscription
  const activeSubscription = userSubscriptions.find(sub => 
    sub.status === 'active' && new Date(sub.endDate) > new Date()
  );
  
  // Load data from the actual API endpoints
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Log user info for debugging
        console.log('Current user:', user);
        
        let gotPlans = false;
        
        // Fetch subscription plans from real API endpoint
        try {
          const plansResponse = await fetch('/api/subscriptions/plans');
          if (plansResponse.ok) {
            const plansData = await plansResponse.json();
            console.log('Subscription plans data:', plansData);
            
            // Map API response to our SubscriptionPlan type
            const mappedPlans = plansData.plans.map((plan: any) => ({
              ...plan,
              validityPeriod: parseInt(plan.features?.[0]?.match(/\d+/)?.[0] || '30', 10) // Extract validity period from features
            }));
            
            setSubscriptionPlans(mappedPlans || []);
            gotPlans = true;
          } else {
            console.error('Failed to fetch plans:', await plansResponse.text());
            // Fall back to direct API
            const directPlansResponse = await fetch('/api/data/subscription-plans');
            if (directPlansResponse.ok) {
              const directPlansData = await directPlansResponse.json();
              console.log('Direct subscription plans data:', directPlansData);
              setSubscriptionPlans(directPlansData || []);
              gotPlans = true;
            }
          }
        } catch (plansErr) {
          console.error('Error fetching subscription plans:', plansErr);
        }
        
        if (!gotPlans) {
          throw new Error('Could not fetch subscription plans from any source');
        }
        
        // Fetch user subscriptions if user is logged in - try with both user.id and profileId
        let gotSubscriptions = false;
        
        if (user?.id) {
          console.log('Fetching subscriptions for user ID:', user.id);
          
          try {
            // Try user.id first (most likely to work)
            const subsResponse = await fetch(`/api/subscriptions/users?userId=${user.id}`);
            if (subsResponse.ok) {
              const subsData = await subsResponse.json();
              console.log('Subscription data via user.id:', subsData);
              if (subsData.subscriptions && Array.isArray(subsData.subscriptions)) {
                setUserSubscriptions(subsData.subscriptions || []);
                gotSubscriptions = true;
              }
            } 
          } catch (err) {
            console.error('Error fetching user subscriptions with user.id:', err);
          }
          
          // Try with profileId if user.id didn't work
          if (!gotSubscriptions && user?.profileId) {
            try {
              console.log('Trying with profileId instead:', user.profileId);
              const profileResponse = await fetch(`/api/subscriptions/users?userId=${user.profileId}`);
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                console.log('Subscription data via profileId:', profileData);
                if (profileData.subscriptions && Array.isArray(profileData.subscriptions)) {
                  setUserSubscriptions(profileData.subscriptions || []);
                  gotSubscriptions = true;
                }
              }
            } catch (err) {
              console.error('Error fetching user subscriptions with profileId:', err);
            }
          }
          
          // As a last resort, try the direct API
          if (!gotSubscriptions) {
            try {
              console.log('Trying direct API as last resort');
              const directResponse = await fetch(`/api/data/users/${user.id}/subscriptions`);
              if (directResponse.ok) {
                const directData = await directResponse.json();
                console.log('Direct API subscription data:', directData);
                if (Array.isArray(directData) && directData.length > 0) {
                  setUserSubscriptions(directData);
                  gotSubscriptions = true;
                }
              }
            } catch (error) {
              console.warn('Failed to fetch from direct API:', error);
            }
          }
          
          // Try a direct mock subscription as a last resort
          if (!gotSubscriptions) {
            try {
              console.log('Trying direct mock API');
              const mockResponse = await fetch(`/api/data/subscriptions?userId=${user.id}`);
              if (mockResponse.ok) {
                const mockData = await mockResponse.json();
                console.log('Mock API subscription data:', mockData);
                if (Array.isArray(mockData) && mockData.length > 0) {
                  setUserSubscriptions(mockData);
                  gotSubscriptions = true;
                }
              }
            } catch (error) {
              console.warn('Failed to fetch from mock API:', error);
            }
          }
          
          if (!gotSubscriptions) {
            console.warn('Could not fetch user subscriptions from any source, but plans were loaded successfully');
            // Don't throw an error here, we still want to show the plans even if no subscriptions
          }
        }
      } catch (err) {
        console.error('Error loading subscription data:', err);
        setError('Failed to load subscription data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [user?.id, user?.profileId]);
  
  // Separate function to reload subscription data
  const reloadSubscriptionData = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Refreshing subscription data for user:', user.id);
      
      // First try fetching with profileId
      let subsResponse = await fetch(`/api/subscriptions/users?userId=${user.id}`);
      if (!subsResponse.ok) {
        throw new Error('Failed to fetch user subscriptions');
      }
      
      const subsData = await subsResponse.json();
      console.log('Subscription data received:', subsData);
      
      // Update state with fresh data
      if (subsData.subscriptions && Array.isArray(subsData.subscriptions)) {
        setUserSubscriptions(subsData.subscriptions);
        
        // Log if we found an active subscription
        const active = subsData.subscriptions.find((sub: UserSubscription) => 
          sub.status === 'active' && new Date(sub.endDate) > new Date()
        );
        
        if (active) {
          console.log('Found active subscription:', active);
        } else {
          console.log('No active subscription found in data');
          
          // As a backup, try fetching with the user's ID directly from the API
          console.log('Trying direct API fetch...');
          const directResponse = await fetch(`/api/data/users/${user.id}/subscriptions`);
          
          if (directResponse.ok) {
            const directData = await directResponse.json();
            console.log('Direct API subscription data:', directData);
            
            if (Array.isArray(directData) && directData.length > 0) {
              setUserSubscriptions(directData);
            }
          }
        }
      } else {
        console.warn('Unexpected subscription data format:', subsData);
      }
    } catch (err) {
      console.error('Error loading subscription data:', err);
      setError('Failed to load subscription data. Please try again later.');
    }
  };
  
  // Force refresh all data
  const forceRefreshAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch subscription plans
      const plansResponse = await fetch('/api/subscriptions/plans', { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!plansResponse.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      
      const plansData = await plansResponse.json();
      
      // Map API response to our SubscriptionPlan type
      const mappedPlans = plansData.plans.map((plan: any) => ({
        ...plan,
        validityPeriod: parseInt(plan.features?.[0]?.match(/\d+/)?.[0] || '30', 10)
      }));
      
      setSubscriptionPlans(mappedPlans || []);
      
      // Now also reload subscription data with cache busting
      if (user?.id) {
        await reloadSubscriptionData();
      }
      
    } catch (err) {
      console.error('Error during force refresh:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to manually create a subscription from a session
  const createSubscriptionFromSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      console.log('🔄 Manually creating subscription from session:', sessionId);
      
      const response = await fetch('/api/stripe/manual-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Manual subscription creation result:', result);
        setSuccessMessage('Subscription manually created successfully!');
        
        // Refresh subscription data
        forceRefreshAllData();
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Failed to manually create subscription:', error);
        setError('Failed to create subscription. Please contact support.');
        return false;
      }
    } catch (error) {
      console.error('❌ Error manually creating subscription:', error);
      setError('Error creating subscription. Please try again or contact support.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fetch Stripe session details
  const fetchSessionDetails = async (sessionId: string) => {
    try {
      console.log('Fetching session details for:', sessionId);
      const response = await fetch(`/api/stripe/session?session_id=${sessionId}`);
      if (response.ok) {
        const sessionData = await response.json();
        console.log('✅ Stripe session details:', sessionData);
        
        // Check if a subscription was created for this session
        if (sessionData.userSubscriptions && sessionData.userSubscriptions.length > 0) {
          console.log('✅ Found subscriptions linked to this session:', sessionData.userSubscriptions);
          return sessionData;
        } else {
          console.warn('⚠️ No subscriptions found for this session. The webhook might not have processed correctly.');
          
          // Store session ID for potential manual creation
          setSessionIdForCreation(sessionId);
          
          // If user is logged in, manually check for subscriptions
          if (user?.id) {
            console.log('Checking for any subscriptions for user:', user.id);
            const userSubsResponse = await fetch(`/api/subscriptions/users?userId=${user.id}`);
            if (userSubsResponse.ok) {
              const userData = await userSubsResponse.json();
              console.log('User subscription data:', userData);
            }
          }
          
          return sessionData;
        }
      } else {
        console.error('❌ Failed to fetch session details:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching session details:', error);
      return null;
    }
  };
  
  // Add auto-dismiss for success message
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  useEffect(() => {
    // Check for success parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    
    if (success === 'true' && sessionId) {
      console.log('Payment success detected with session ID:', sessionId);
      setSuccessMessage('Payment successful! Your subscription has been activated.');
      
      // Fetch session details to verify completion
      fetchSessionDetails(sessionId).then(sessionData => {
        console.log('Stripe session verification complete');
        
        // After fetching session data, reload subscription data
        forceRefreshAllData();
      });
    }
    
    // Initial load of subscriptions data
    forceRefreshAllData();
  }, []);
  
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };
  
  const handleSubscribe = async (planId: string) => {
    if (!user) {
      alert('You must be logged in to subscribe');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Find the plan details
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Plan not found');
      }
      
      // Make API call to create Stripe checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          userId: user.id,
          userEmail: user.email
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError('Failed to process payment. Please try again.');
      setIsProcessing(false);
    }
  };
  
  // Get active plans
  const activePlans = subscriptionPlans.filter(plan => plan.isActive);
  
  // Format prices (in pence) to pounds
  const formatPrice = (price: number) => {
    return `£${(price / 100).toFixed(2)}`;
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner />
        <p className="mt-4 text-sm text-gray-500">Loading subscription data...</p>
      </div>
    );
  }
  
  // Only display error if subscription plans couldn't be loaded
  // This way, the user can still see plans even if their subscriptions couldn't be loaded
  if (error && subscriptionPlans.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-3 flex space-x-4">
                <button 
                  onClick={forceRefreshAllData} 
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  <svg className="mr-2 -ml-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry Now
                </button>
                <button 
                  onClick={() => window.location.reload()} 
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'subscription_plans' }}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
            <p className="mt-1 text-sm text-gray-500">
              Choose a plan that suits your dog walking needs
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <button
              onClick={forceRefreshAllData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              title="Force refresh all subscription data"
            >
              <svg className="mr-2 -ml-0.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
            
            {activeSubscription && (
              <Link
                href="/owner-dashboard/create-booking"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Book a Walk
              </Link>
            )}
          </div>
        </div>

        {/* Display a warning if we have plans but no user subscriptions */}
        {error && subscriptionPlans.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">Could not load your current subscription information. You can still browse available plans.</p>
                <div className="mt-2">
                  <button 
                    onClick={forceRefreshAllData}
                    className="inline-flex items-center px-2 py-1.5 border border-yellow-300 rounded-md text-xs font-medium text-yellow-800 bg-yellow-50 hover:bg-yellow-100"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setSuccessMessage(null)}
                    className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual webhook processing banner */}
        {sessionIdForCreation && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-yellow-700">
                  Your payment was successful, but we haven't detected your subscription being created automatically.
                </p>
                <div className="mt-2">
                  <button
                    onClick={() => createSubscriptionFromSession(sessionIdForCreation)}
                    disabled={isLoading}
                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
                      isLoading ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {isLoading ? 'Processing...' : 'Create Subscription Manually'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Subscription Banner */}
        {activeSubscription && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-grow">
                <div className="flex justify-between items-start">
                  <h3 className="text-sm font-medium text-green-800">
                    Active Subscription
                  </h3>
                  <button 
                    onClick={reloadSubscriptionData}
                    className="bg-green-100 p-1 rounded-full text-green-600 hover:bg-green-200"
                    title="Refresh subscription data"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    You have an active {subscriptionPlans.find(p => p.id === activeSubscription.planId)?.name} plan with {activeSubscription.creditsRemaining} walk credits remaining.
                    Valid until {new Date(activeSubscription.endDate).toLocaleDateString()}.
                  </p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <Link
                      href="/owner-dashboard/create-booking"
                      className="px-2 py-1.5 rounded-md text-sm font-medium text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Book a walk
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activePlans.map((plan) => {
            const isPopular = plan.id === 'plan2'; // Mark the middle plan as popular
            
            return (
              <div 
                key={plan.id} 
                className={`
                  relative bg-white shadow-md rounded-lg overflow-hidden
                  ${selectedPlanId === plan.id ? 'ring-2 ring-primary-500' : ''}
                  ${isPopular ? 'border-2 border-primary-500 transform md:scale-105' : 'border border-gray-200'}
                `}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 pt-2 pr-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-primary-100 text-primary-800">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="px-6 py-8">
                  <h3 className="text-2xl font-bold text-gray-900 text-center">{plan.name}</h3>
                  <div className="mt-4 flex justify-center">
                    <span className="px-3 py-1 text-sm text-gray-500 rounded-full bg-gray-100">
                      {plan.walkDuration} min
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-gray-500 text-center h-12">
                    {plan.description}
                  </p>
                  
                  <div className="mt-6 text-center">
                    <p className="text-4xl font-extrabold text-gray-900">{formatPrice(plan.price)}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      for {plan.walkCredits} walks
                    </p>
                    <p className="text-xs text-gray-400">
                      Valid for {plan.validityPeriod} days
                    </p>
                  </div>
                  
                  <div className="mt-6">
                    <ul className="space-y-4">
                      <li className="flex">
                        <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-gray-700">
                          {plan.walkCredits} walk credits
                        </span>
                      </li>
                      <li className="flex">
                        <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-gray-700">
                          {plan.walkDuration} min
                        </span>
                      </li>
                      <li className="flex">
                        <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-gray-700">
                          Valid for {plan.validityPeriod} days
                        </span>
                      </li>
                      <li className="flex">
                        <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-gray-700">
                          GPS tracking
                        </span>
                      </li>
                      <li className="flex">
                        <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-gray-700">
                          Photo updates
                        </span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="mt-8">
                    {selectedPlanId === plan.id ? (
                      <button
                        type="button"
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={isProcessing}
                        className={`w-full flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                          isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                      >
                        {isProcessing ? 'Processing...' : 'Subscribe Now'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(plan.id)}
                        disabled={isProcessing}
                        className={`w-full flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                          isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                        }`}
                      >
                        Select Plan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </RouteGuard>
  );
} 