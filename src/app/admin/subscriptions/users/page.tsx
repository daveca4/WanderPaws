'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/RouteGuard';
import { UserSubscription, SubscriptionTransaction } from '@/lib/types';
import { generateId } from '@/utils/helpers';
import { formatPrice } from '@/lib/subscriptionService';

// Update the UserSubscription type to match the database schema
declare module '@/lib/types' {
  interface UserSubscription {
    walkCredits?: number;
    walkDuration?: number;
    status: 'active' | 'expired' | 'cancelled';
  }
}

export default function UserSubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'expired'
  const [owners, setOwners] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  
  // Modal states
  const [isAddCreditsModalOpen, setIsAddCreditsModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const [selectedSubscriptionForActions, setSelectedSubscriptionForActions] = useState<string>('');
  
  // Form states
  const [creditsToAdd, setCreditsToAdd] = useState(5);
  const [daysToExtend, setDaysToExtend] = useState(30);
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [lastActionTimestamp, setLastActionTimestamp] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user subscriptions
        const subsResponse = await fetch('/api/subscriptions/users');
        if (!subsResponse.ok) {
          throw new Error('Failed to fetch user subscriptions');
        }
        const subsData = await subsResponse.json();
        
        // Fetch owners
        const ownersResponse = await fetch('/api/data/owners');
        if (!ownersResponse.ok) {
          throw new Error('Failed to fetch owners');
        }
        const ownersData = await ownersResponse.json();
        
        // Fetch subscription plans
        const plansResponse = await fetch('/api/subscriptions/plans');
        if (!plansResponse.ok) {
          throw new Error('Failed to fetch subscription plans');
        }
        const plansData = await plansResponse.json();
        
        setSubscriptions(subsData.subscriptions || []);
        setOwners(ownersData || []);
        setPlans(plansData.plans || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [lastActionTimestamp]);

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const getOwnerName = (ownerId: string): string => {
    const owner = owners.find(o => o.id === ownerId);
    return owner ? owner.name : 'Unknown Owner';
  };

  const getPlanName = (planId: string): string => {
    const plan = plans.find(p => p.id === planId);
    return plan ? plan.name : 'Unknown Plan';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  // Open Add Credits modal
  const openAddCreditsModal = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setCreditsToAdd(5);
    setIsAddCreditsModalOpen(true);
  };

  // Open Extend Subscription modal
  const openExtendModal = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setDaysToExtend(30);
    setIsExtendModalOpen(true);
  };

  // Open Cancel Subscription modal
  const openCancelModal = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setCancelReason('');
    setIsProcessingRefund(false);
    setIsCancelModalOpen(true);
  };

  // Close all modals
  const closeModals = () => {
    setIsAddCreditsModalOpen(false);
    setIsExtendModalOpen(false);
    setIsCancelModalOpen(false);
    setSelectedSubscription(null);
    setSelectedSubscriptionForActions('');
  };

  // Add credits to a subscription
  const handleAddCredits = async () => {
    if (!selectedSubscription) return;
    
    try {
      const response = await fetch(`/api/subscriptions/users/${selectedSubscription.id}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creditsToAdd,
          notes: `Added ${creditsToAdd} credits by admin`
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add credits');
      }
      
      // Close modals first
      closeModals();
      
      // Set success message
      setActionSuccess(`Successfully added ${creditsToAdd} credits to subscription`);
      
      // Refresh data
      setLastActionTimestamp(Date.now());
      
      // Hide success message after a few seconds
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      console.error('Error adding credits:', err);
      setActionSuccess(null);
      setError(err instanceof Error ? err.message : 'Failed to add credits');
    }
  };

  // Extend a subscription
  const handleExtendSubscription = async () => {
    if (!selectedSubscription) return;
    
    try {
      const response = await fetch(`/api/subscriptions/users/${selectedSubscription.id}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          daysToExtend,
          notes: `Extended subscription by ${daysToExtend} days by admin`
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to extend subscription');
      }
      
      // Close modals first
      closeModals();
      
      // Set success message
      setActionSuccess(`Successfully extended subscription by ${daysToExtend} days`);
      
      // Refresh data
      setLastActionTimestamp(Date.now());
      
      // Hide success message after a few seconds
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      console.error('Error extending subscription:', err);
      setActionSuccess(null);
      setError(err instanceof Error ? err.message : 'Failed to extend subscription');
    }
  };

  // Cancel a subscription
  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;
    
    try {
      const response = await fetch(`/api/subscriptions/users/${selectedSubscription.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancelReason,
          processRefund: isProcessingRefund
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      // Close modals first
      closeModals();
      
      // Set success message
      setActionSuccess(`Successfully cancelled subscription${isProcessingRefund ? ' with refund' : ''}`);
      
      // Refresh data
      setLastActionTimestamp(Date.now());
      
      // Show all subscriptions if we were filtering
      if (filter !== 'all') {
        setFilter('all');
      }
      
      // Hide success message after a few seconds
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setActionSuccess(null);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    }
  };

  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'user_subscriptions' }}>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Subscriptions</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage subscription records for all users
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/admin/subscriptions"
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 mr-2"
            >
              Manage Plans
            </Link>
            <Link
              href="/admin/subscriptions/transactions"
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              View Transactions
            </Link>
          </div>
        </div>

        {actionSuccess && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{actionSuccess}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setActionSuccess(null)}
                    className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 101.06 1.06L10 11.06l2.72 2.72a.75.75 0 101.06-1.06L11.06 10l2.72-2.72a.75.75 0 00-1.06-1.06L10 8.94 7.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 bg-white p-4 rounded-lg shadow mb-4">
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700">Filter:</label>
            <select
              id="filter"
              name="filter"
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Subscriptions</option>
              <option value="active">Active Only</option>
              <option value="expired">Expired Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {filteredSubscriptions.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <p className="text-gray-500">No subscriptions found with the current filter.</p>
              </div>
            ) : (
              <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Owner</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Plan</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Credits</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Period</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredSubscriptions.map((subscription) => (
                      <tr key={subscription.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="font-medium text-gray-900">
                            {getOwnerName(subscription.userId)}
                          </div>
                          <div className="text-gray-500">ID: {subscription.id.slice(0, 8)}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="text-gray-900">{getPlanName(subscription.planId)}</div>
                          <div>{formatPrice(subscription.purchaseAmount)}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                            subscription.status === 'expired' ? 'bg-red-100 text-red-800' :
                            subscription.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="text-gray-900">{subscription.creditsRemaining} of {subscription.walkCredits || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{subscription.walkDuration || 'N/A'} min walks</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div>{formatDate(subscription.startDate)}</div>
                          <div>to {formatDate(subscription.endDate)}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                router.push(`/admin/subscriptions/users/${subscription.id}`);
                              }}
                              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none"
                            >
                              View
                            </button>
                            
                            <select
                              value={selectedSubscriptionForActions === subscription.id ? "" : ""}
                              onChange={(e) => {
                                setSelectedSubscriptionForActions(subscription.id);
                                
                                if (e.target.value === "add-credits") {
                                  openAddCreditsModal(subscription);
                                } else if (e.target.value === "extend") {
                                  openExtendModal(subscription);
                                } else if (e.target.value === "cancel") {
                                  openCancelModal(subscription);
                                }
                              }}
                              className="block w-full pl-3 pr-10 py-1.5 text-xs border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                            >
                              <option value="">Actions</option>
                              <option value="add-credits">Add Credits</option>
                              <option value="extend">Extend</option>
                              {subscription.status !== 'cancelled' && (
                                <option value="cancel">Cancel</option>
                              )}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Credits Modal */}
      {isAddCreditsModalOpen && selectedSubscription && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900">Add Credits to Subscription</h3>
            <div className="mt-4">
              <label htmlFor="creditsToAdd" className="block text-sm font-medium text-gray-700">
                Credits to Add
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="creditsToAdd"
                  id="creditsToAdd"
                  min="1"
                  max="100"
                  value={creditsToAdd}
                  onChange={(e) => setCreditsToAdd(Number(e.target.value))}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                This will add <span className="font-medium">{creditsToAdd}</span> credits to the subscription for <span className="font-medium">{getOwnerName(selectedSubscription.userId)}</span>.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                onClick={handleAddCredits}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm"
              >
                Add Credits
              </button>
              <button
                type="button"
                onClick={closeModals}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Subscription Modal */}
      {isExtendModalOpen && selectedSubscription && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900">Extend Subscription</h3>
            <div className="mt-4">
              <label htmlFor="daysToExtend" className="block text-sm font-medium text-gray-700">
                Days to Extend
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="daysToExtend"
                  id="daysToExtend"
                  min="1"
                  max="365"
                  value={daysToExtend}
                  onChange={(e) => setDaysToExtend(Number(e.target.value))}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                Current end date: <span className="font-medium">{formatDate(selectedSubscription.endDate)}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                New end date: <span className="font-medium">
                  {formatDate(new Date(new Date(selectedSubscription.endDate).getTime() + (daysToExtend * 24 * 60 * 60 * 1000)).toISOString())}
                </span>
              </p>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                onClick={handleExtendSubscription}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm"
              >
                Extend Subscription
              </button>
              <button
                type="button"
                onClick={closeModals}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {isCancelModalOpen && selectedSubscription && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900">Cancel Subscription</h3>
            <div className="mt-4">
              <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700">
                Reason for Cancellation
              </label>
              <div className="mt-1">
                <textarea
                  id="cancelReason"
                  name="cancelReason"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Optional: Enter reason for cancellation"
                />
              </div>
            </div>
            <div className="mt-4">
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="processRefund"
                    name="processRefund"
                    type="checkbox"
                    checked={isProcessingRefund}
                    onChange={(e) => setIsProcessingRefund(e.target.checked)}
                    className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="processRefund" className="font-medium text-gray-700">Process Refund</label>
                  <p className="text-gray-500">This will refund 50% of the subscription cost.</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-red-500 font-medium">
                Warning: This action cannot be undone.
              </p>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                onClick={handleCancelSubscription}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
              >
                Cancel Subscription
              </button>
              <button
                type="button"
                onClick={closeModals}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </RouteGuard>
  );
} 