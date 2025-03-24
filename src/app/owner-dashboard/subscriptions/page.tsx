'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
// Removed mock data import
import { SubscriptionPlan, UserSubscription } from '@/lib/types';
import StripeCheckoutButton from '@/components/StripeCheckoutButton';

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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
    
    // Check for success parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const sessionId = urlParams.get('session_id');
    
    if (success === 'true' && sessionId) {
      setSuccessMessage('Payment successful! Your subscription has been activated.');
      loadData(); // Reload data to get the new subscription
    }
  }, [user]);
  
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
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
                      <StripeCheckoutButton 
                        plan={plan} 
                        buttonText="Subscribe Now" 
                        className="w-full"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectPlan(plan.id)}
                        className="w-full flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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

        {/* Floating Button for Selected Plan */}
        {selectedPlanId && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between items-center shadow-lg transform transition-transform duration-300 z-10">
            <div className="text-gray-800 font-semibold">
              Selected: {plans.find(p => p.id === selectedPlanId)?.name}
            </div>
            <StripeCheckoutButton 
              plan={plans.find(p => p.id === selectedPlanId)!} 
              buttonText="Subscribe Now"
            />
          </div>
        )}
      </div>
    </RouteGuard>
  );
} 