'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
// Removed mock data import
// Removed mock data import
import { SubscriptionPlan } from '@/lib/types';
import { formatPrice, calculateDiscount, formatPricePerWalk } from '@/lib/subscriptionService';

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [showInactive, setShowInactive] = useState<boolean>(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription plans
  useEffect(() => {
    async function fetchPlans() {
      try {
        setLoading(true);
        const response = await fetch('/api/subscriptions/plans');
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription plans');
        }
        
        const data = await response.json();
        setPlans(data.plans || []);
      } catch (err) {
        console.error('Error fetching subscription plans:', err);
        setError('Failed to load subscription plans. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlans();
  }, []);

  const displayedPlans = showInactive 
    ? plans 
    : plans.filter(plan => plan.isActive);

  const handleDelete = (planId: string) => {
    setPlanToDelete(planId);
  };

  const confirmDelete = async () => {
    if (planToDelete) {
      try {
        const response = await fetch(`/api/subscriptions/plans/${planToDelete}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete subscription plan');
        }
        
        // Filter out the deleted plan from state
        const updatedPlans = plans.filter(plan => plan.id !== planToDelete);
        setPlans(updatedPlans);
        
        // Close the confirmation dialog
        setPlanToDelete(null);
      } catch (err) {
        console.error('Error deleting subscription plan:', err);
        setError('Failed to delete subscription plan. Please try again.');
      }
    }
  };

  const cancelDelete = () => {
    setPlanToDelete(null);
  };

  if (loading) {
    return (
      <RouteGuard requiredPermission={{ action: 'read', resource: 'subscription_plans' }}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </RouteGuard>
    );
  }

  if (error) {
    return (
      <RouteGuard requiredPermission={{ action: 'read', resource: 'subscription_plans' }}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          </div>
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="text-red-500">{error}</div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        </div>
      </RouteGuard>
    );
  }
  
  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'subscription_plans' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <input
                id="show-inactive"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={showInactive}
                onChange={() => setShowInactive(!showInactive)}
              />
              <label htmlFor="show-inactive" className="ml-2 text-sm text-gray-600">
                Show inactive plans
              </label>
            </div>
            <Link
              href="/admin/subscriptions/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Plan
            </Link>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {planToDelete && (
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Subscription Plan</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete this subscription plan? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={confirmDelete}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={cancelDelete}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Walks
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Per Walk
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedPlans.map((plan) => (
                  <tr key={plan.id} className={!plan.isActive ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                      <div className="text-xs text-gray-500">{plan.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.walkCredits}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.walkDuration} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.validityPeriod} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(plan.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPricePerWalk(plan)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {plan.discountPercentage !== undefined ? plan.discountPercentage : calculateDiscount(plan)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        plan.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/subscriptions/${plan.id}`} className="text-primary-600 hover:text-primary-900 mr-3">
                        View
                      </Link>
                      <Link href={`/admin/subscriptions/${plan.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-3">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Subscription Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">User Subscriptions</h3>
              <p className="text-gray-600 mb-4">
                View and manage user subscriptions, including extending subscriptions, adding credits, or cancelling subscriptions.
              </p>
              <Link
                href="/admin/subscriptions/users"
                className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Manage User Subscriptions
              </Link>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Subscription Transactions</h3>
              <p className="text-gray-600 mb-4">
                View transaction history for all subscription purchases, refunds, and credit adjustments.
              </p>
              <Link
                href="/admin/subscriptions/transactions"
                className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View Transactions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 