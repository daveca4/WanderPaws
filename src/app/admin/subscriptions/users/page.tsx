'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/RouteGuard';
// Removed mock data import
import { SubscriptionPlan, UserSubscription, SubscriptionTransaction } from '@/lib/types';
// Removed mock data import
import { generateId } from '@/utils/helpers';

export default function UserSubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'expired'
  
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

  useEffect(() => {
    // Load data
    setSubscriptions(mockUserSubscriptions);
    setLoading(false);
  }, []);

  // Refresh data whenever an action is performed
  useEffect(() => {
    if (lastActionTimestamp > 0) {
      // Reload data from mock source
      setSubscriptions([...mockUserSubscriptions]);
    }
  }, [lastActionTimestamp]);

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const getOwnerName = (ownerId: string): string => {
    const owner = mockOwners.find(o => o.id === ownerId);
    return owner ? owner.name : 'Unknown Owner';
  };

  const getPlanName = (planId: string): string => {
    const plan = getSubscriptionPlanById(planId);
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
  const handleAddCredits = () => {
    if (!selectedSubscription) return;

    // Create updated subscription object
    const updatedSubscription = {
      ...selectedSubscription,
      creditsRemaining: selectedSubscription.creditsRemaining + creditsToAdd
    };

    // Update subscription in state
    const updatedSubscriptions = subscriptions.map(sub => 
      sub.id === selectedSubscription.id ? updatedSubscription : sub
    );
    
    // Create a transaction record
    const newTransaction: SubscriptionTransaction = {
      id: generateId('trans'),
      userSubscriptionId: selectedSubscription.id,
      amount: 0, // Free credits (could be changed to calculate cost)
      type: 'credit_adjustment',
      status: 'successful',
      date: new Date().toISOString(),
      notes: `Added ${creditsToAdd} credits by admin`
    };
    
    // Add transaction to mock data
    mockSubscriptionTransactions.push(newTransaction);
    
    // Update subscription in mock data
    const subIndex = mockUserSubscriptions.findIndex(sub => sub.id === selectedSubscription.id);
    if (subIndex !== -1) {
      mockUserSubscriptions[subIndex] = updatedSubscription;
    }
    
    // Close modals first
    closeModals();
    
    // Set success message
    setActionSuccess(`Successfully added ${creditsToAdd} credits to subscription ${selectedSubscription.id}`);
    
    // Update state
    setSubscriptions(updatedSubscriptions);
    setLastActionTimestamp(Date.now());
    
    // Hide success message after a few seconds
    setTimeout(() => setActionSuccess(null), 5000);
  };

  // Extend a subscription
  const handleExtendSubscription = () => {
    if (!selectedSubscription) return;

    // Create a new end date
    const currentEndDate = new Date(selectedSubscription.endDate);
    currentEndDate.setDate(currentEndDate.getDate() + daysToExtend);
    
    // Update subscription status if it was expired
    const status = selectedSubscription.status === 'expired' && selectedSubscription.creditsRemaining > 0 
      ? 'active' as const
      : selectedSubscription.status;

    // Create updated subscription object
    const updatedSubscription = {
      ...selectedSubscription,
      endDate: currentEndDate.toISOString(),
      status
    };

    // Update subscription in state
    const updatedSubscriptions = subscriptions.map(sub => 
      sub.id === selectedSubscription.id ? updatedSubscription : sub
    );
    
    // Create a transaction record
    const newTransaction: SubscriptionTransaction = {
      id: generateId('trans'),
      userSubscriptionId: selectedSubscription.id,
      amount: 0, // Free extension (could be changed to calculate cost)
      type: 'credit_adjustment',
      status: 'successful',
      date: new Date().toISOString(),
      notes: `Extended subscription by ${daysToExtend} days by admin`
    };
    
    // Add transaction to mock data
    mockSubscriptionTransactions.push(newTransaction);
    
    // Update subscription in mock data
    const subIndex = mockUserSubscriptions.findIndex(sub => sub.id === selectedSubscription.id);
    if (subIndex !== -1) {
      mockUserSubscriptions[subIndex] = updatedSubscription;
    }
    
    // Close modals first
    closeModals();
    
    // Update state with message based on status change
    if (selectedSubscription.status !== status && filter !== 'all') {
      // Reset filter to show all if we changed the subscription status
      setFilter('all');
      setActionSuccess(`Successfully extended subscription and changed status from ${selectedSubscription.status} to ${status}. Showing all subscriptions.`);
    } else {
      setActionSuccess(`Successfully extended subscription ${selectedSubscription.id} by ${daysToExtend} days`);
    }
    
    // Update state
    setSubscriptions(updatedSubscriptions);
    setLastActionTimestamp(Date.now());
    
    // Hide success message after a few seconds
    setTimeout(() => setActionSuccess(null), 5000);
  };

  // Cancel a subscription
  const handleCancelSubscription = () => {
    if (!selectedSubscription) return;

    // Create updated subscription object
    const updatedSubscription = {
      ...selectedSubscription,
      status: 'cancelled' as const
    };

    // Update subscription in state
    const updatedSubscriptions = subscriptions.map(sub => 
      sub.id === selectedSubscription.id ? updatedSubscription : sub
    );
    
    // Create a transaction record for refund if selected
    if (isProcessingRefund) {
      const refundAmount = Math.round(selectedSubscription.purchaseAmount * 0.5); // 50% refund
      
      const newTransaction: SubscriptionTransaction = {
        id: generateId('trans'),
        userSubscriptionId: selectedSubscription.id,
        amount: -refundAmount, // negative amount for refund
        type: 'refund',
        status: 'successful',
        date: new Date().toISOString(),
        notes: `Refund processed due to cancellation: ${cancelReason}`
      };
      
      // Add transaction to mock data
      mockSubscriptionTransactions.push(newTransaction);
    }
    
    // Update subscription in mock data
    const subIndex = mockUserSubscriptions.findIndex(sub => sub.id === selectedSubscription.id);
    if (subIndex !== -1) {
      mockUserSubscriptions[subIndex] = updatedSubscription;
    }
    
    // Close modals first
    closeModals();
    
    // Update state with message based on filter
    if (filter !== 'all') {
      // Reset filter to show all when we cancel a subscription
      setFilter('all');
      setActionSuccess(`Successfully cancelled subscription ${selectedSubscription.id}. Showing all subscriptions.`);
    } else {
      setActionSuccess(`Successfully cancelled subscription ${selectedSubscription.id}`);
    }
    
    // Update state
    setSubscriptions(updatedSubscriptions);
    setLastActionTimestamp(Date.now());
    
    // Hide success message after a few seconds
    setTimeout(() => setActionSuccess(null), 5000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'user_subscriptions' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Subscriptions</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage user subscriptions and credits
            </p>
          </div>
          <div className="flex space-x-2">
            <Link
              href="/admin/subscriptions"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Back to Plans
            </Link>
          </div>
        </div>

        {actionSuccess && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {actionSuccess}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    onClick={() => setActionSuccess(null)}
                    className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none"
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

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Active Subscriptions
            </h2>
            <div className="flex items-center space-x-2">
              <label htmlFor="filter" className="text-sm font-medium text-gray-700">
                Filter:
              </label>
              <select
                id="filter"
                name="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              >
                <option value="all">All Subscriptions</option>
                <option value="active">Active Only</option>
                <option value="expired">Expired Only</option>
                <option value="cancelled">Cancelled Only</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
                      No subscriptions found.
                    </td>
                  </tr>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sub.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getOwnerName(sub.ownerId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getPlanName(sub.planId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(sub.purchaseDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(sub.endDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {sub.creditsRemaining}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          sub.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : sub.status === 'expired'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPrice(sub.purchaseAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link 
                            href={`/admin/subscriptions/users/${sub.id}`} 
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedSubscriptionForActions(sub.id);
                              // Scroll to the subscription selector
                              document.getElementById('subscriptionSelector')?.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'center' 
                              });
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Modify
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Credits Modal */}
        {isAddCreditsModalOpen && selectedSubscription && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Add Credits to Subscription
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Add additional walk credits to this subscription. The subscription ID is {selectedSubscription.id} for {getOwnerName(selectedSubscription.ownerId)}.
                      </p>
                      <div className="mt-4">
                        <label htmlFor="credits" className="block text-sm font-medium text-gray-700 text-left">
                          Credits to Add
                        </label>
                        <input
                          type="number"
                          name="credits"
                          id="credits"
                          min="1"
                          value={creditsToAdd}
                          onChange={(e) => setCreditsToAdd(parseInt(e.target.value) || 1)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                        <p className="mt-2 text-sm text-gray-500 text-left">
                          Current credits remaining: {selectedSubscription.creditsRemaining}
                        </p>
                      </div>
                    </div>
                  </div>
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
          </div>
        )}

        {/* Extend Subscription Modal */}
        {isExtendModalOpen && selectedSubscription && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Extend Subscription
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Extend the validity period of this subscription. The subscription will be valid until {formatDate(selectedSubscription.endDate)}.
                      </p>
                      <div className="mt-4">
                        <label htmlFor="days" className="block text-sm font-medium text-gray-700 text-left">
                          Days to Extend
                        </label>
                        <select
                          id="days"
                          name="days"
                          value={daysToExtend}
                          onChange={(e) => setDaysToExtend(parseInt(e.target.value))}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                          <option value="7">7 days</option>
                          <option value="14">14 days</option>
                          <option value="30">30 days</option>
                          <option value="60">60 days</option>
                          <option value="90">90 days</option>
                        </select>
                      </div>
                    </div>
                  </div>
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
          </div>
        )}

        {/* Cancel Subscription Modal */}
        {isCancelModalOpen && selectedSubscription && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Cancel Subscription
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to cancel this subscription? This action cannot be undone.
                      </p>
                      <div className="mt-4">
                        <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 text-left">
                          Reason for Cancellation
                        </label>
                        <textarea
                          id="cancelReason"
                          name="cancelReason"
                          rows={3}
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="Enter reason for cancellation"
                        />
                      </div>
                      <div className="mt-4 flex items-start">
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
                          <label htmlFor="processRefund" className="font-medium text-gray-700">
                            Process partial refund
                          </label>
                          <p className="text-gray-500">
                            Process a 50% refund of the original purchase amount
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Subscription Actions
            </h2>
          </div>
          
          <div className="px-4 pt-5">
            <div className="mb-5 max-w-lg">
              <label htmlFor="subscriptionSelector" className="block text-sm font-medium text-gray-700 mb-2">
                Select Subscription to Modify
              </label>
              <select
                id="subscriptionSelector"
                name="subscriptionSelector"
                value={selectedSubscriptionForActions}
                onChange={(e) => setSelectedSubscriptionForActions(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="">-- Select a subscription --</option>
                {filteredSubscriptions.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.id} - {getOwnerName(sub.ownerId)} - {getPlanName(sub.planId)} ({sub.status})
                  </option>
                ))}
              </select>
            </div>
            
            {selectedSubscriptionForActions ? (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-5">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 md:flex md:justify-between">
                    <p className="text-sm text-blue-700">
                      {(() => {
                        const sub = subscriptions.find(s => s.id === selectedSubscriptionForActions);
                        if (!sub) return 'Subscription not found';
                        return `Selected: ${sub.id} - ${getOwnerName(sub.ownerId)} - ${getPlanName(sub.planId)} - Credits: ${sub.creditsRemaining} - Expires: ${formatDate(sub.endDate)}`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-5">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Please select a subscription to perform actions on
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="px-4 py-5 sm:px-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-2">Add Credits</h3>
              <p className="text-sm text-gray-500 mb-4">Add walk credits to an existing subscription.</p>
              <button
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  const sub = subscriptions.find(s => s.id === selectedSubscriptionForActions);
                  if (sub) {
                    openAddCreditsModal(sub);
                  }
                }}
                disabled={!selectedSubscriptionForActions}
              >
                Add Credits
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-2">Extend Subscription</h3>
              <p className="text-sm text-gray-500 mb-4">Extend the validity period of an existing subscription.</p>
              <button
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  const sub = subscriptions.find(s => s.id === selectedSubscriptionForActions);
                  if (sub) {
                    openExtendModal(sub);
                  }
                }}
                disabled={!selectedSubscriptionForActions}
              >
                Extend Subscription
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-2">Cancel Subscription</h3>
              <p className="text-sm text-gray-500 mb-4">Cancel an active subscription and process a refund if needed.</p>
              <button
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  const sub = subscriptions.find(s => s.id === selectedSubscriptionForActions);
                  if (sub && sub.status === 'active') {
                    openCancelModal(sub);
                  } else if (sub) {
                    alert('Only active subscriptions can be cancelled');
                  }
                }}
                disabled={selectedSubscriptionForActions === '' || (selectedSubscriptionForActions !== '' && subscriptions.find(s => s.id === selectedSubscriptionForActions)?.status !== 'active')}
              >
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 