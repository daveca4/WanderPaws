'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { 
  mockSubscriptionPlans, 
  mockUserSubscriptions, 
  createUserSubscription,
  getUserSubscriptions
} from '@/lib/mockSubscriptions';
import { SubscriptionPlan, UserSubscription } from '@/lib/types';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) return;
    
    const loadData = () => {
      // Get all active subscription plans
      setPlans(mockSubscriptionPlans.filter(plan => plan.isActive));
      
      // Get user's subscriptions
      const subscriptions = getUserSubscriptions(user.id);
      setUserSubscriptions(subscriptions);
      
      setLoading(false);
    };
    
    setTimeout(loadData, 500);
  }, [user]);
  
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };
  
  const handleSubscribe = () => {
    if (!user || !selectedPlanId) return;
    
    setSubscribing(true);
    
    // In a real app, this would make an API call to create a subscription
    setTimeout(() => {
      const newSubscription = createUserSubscription(
        selectedPlanId,
        user.id,
        user.profileId || ''
      );
      
      console.log('New subscription created:', newSubscription);
      
      // Redirect to booking page
      router.push('/owner-dashboard/create-booking');
    }, 1500);
  };
  
  // Find active subscription
  const activeSubscription = userSubscriptions.find(sub => {
    const now = new Date();
    return sub.status === 'active' && new Date(sub.endDate) > now;
  });
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Format prices (in pence) to pounds
  const formatPrice = (price: number) => {
    return `£${(price / 100).toFixed(2)}`;
  };
  
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
          
          {activeSubscription && (
            <div className="mt-4 sm:mt-0">
              <Link
                href="/owner-dashboard/create-booking"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Book a Walk
              </Link>
            </div>
          )}
        </div>

        {/* Active Subscription Banner */}
        {activeSubscription && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Active Subscription
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    You have an active {plans.find(p => p.id === activeSubscription.planId)?.name} plan with {activeSubscription.creditsRemaining} walk credits remaining.
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
          {plans.map((plan) => {
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
                      {plan.walkDuration} minute walks
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
                          {plan.walkDuration} minute walks
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
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`
                        w-full flex items-center justify-center px-5 py-3 border border-transparent 
                        text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 
                        ${
                          selectedPlanId === plan.id
                            ? 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                            : 'text-primary-700 bg-primary-100 hover:bg-primary-200 focus:ring-primary-500'
                        }
                      `}
                    >
                      {selectedPlanId === plan.id ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Subscribe Button */}
        {selectedPlanId && (
          <div className="mt-8 flex flex-col items-center">
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={subscribing}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {subscribing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Subscribe Now'
              )}
            </button>
            <p className="mt-3 text-sm text-gray-500">
              You will be charged {formatPrice(plans.find(p => p.id === selectedPlanId)?.price || 0)}.
              No actual payment will be processed in this demo.
            </p>
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 