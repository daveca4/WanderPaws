'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  mockUserSubscriptions,
  mockSubscriptionPlans,
  formatPrice
} from '@/lib/mockSubscriptions';
import { mockUsers } from '@/lib/mockUsers';
import { mockOwners } from '@/lib/mockData';
import { UserSubscription } from '@/lib/types';
import RouteGuard from '@/components/RouteGuard';

// Extended UserSubscription interface for the details
interface ExtendedUserSubscription extends UserSubscription {
  totalCredits?: number;
  creditsUsed?: number;
  amountPaid?: number;
  paymentMethod?: string;
  expiryDate?: string;
  notes?: string;
}

export default function UserSubscriptionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id;
  
  const [userSubscription, setUserSubscription] = useState<ExtendedUserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the user subscription by ID
    const subscription = mockUserSubscriptions.find(sub => sub.id === id);
    if (subscription) {
      setUserSubscription(subscription as ExtendedUserSubscription);
    }
    setLoading(false);
  }, [id]);

  // Helper function to find the subscription plan
  const getSubscriptionPlan = (planId: string) => {
    return mockSubscriptionPlans.find(plan => plan.id === planId) || null;
  };

  // Helper function to find the owner
  const getOwner = (ownerId: string) => {
    // Get the owner profile information
    const ownerProfile = mockOwners.find(owner => owner.id === ownerId);
    
    // Combine profile info with user info or return one of them if the other doesn't exist
    if (ownerProfile) {
      const ownerUser = mockUsers.find(user => user.profileId === ownerProfile.id);
      if (ownerUser) {
        return {
          ...ownerUser,
          ...ownerProfile
        };
      }
      return {
        id: ownerProfile.id,
        name: ownerProfile.name,
        email: ownerProfile.email
      };
    }
    
    return null;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const calculateDaysRemaining = (expiryDate?: string): number => {
    if (!expiryDate) return 0;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getStatusBadgeClasses = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!userSubscription) {
    return (
      <div className="py-8 px-4 max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription Not Found</h2>
          <p className="text-gray-600 mb-6">The subscription you are looking for does not exist or has been removed.</p>
          <Link
            href="/admin/subscriptions/users"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Return to User Subscriptions
          </Link>
        </div>
      </div>
    );
  }

  const plan = getSubscriptionPlan(userSubscription.planId);
  const owner = getOwner(userSubscription.ownerId);
  const daysRemaining = calculateDaysRemaining(userSubscription.expiryDate);

  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'user_subscriptions' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Subscription Details</h1>
            <p className="mt-1 text-sm text-gray-500">
              View details for subscription #{userSubscription.id}
            </p>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/admin/subscriptions/users/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Edit Subscription
            </Link>
            <Link
              href="/admin/subscriptions/users"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Subscriptions
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Subscription Information
            </h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Subscription ID</h3>
                <p className="mt-1 text-base font-medium text-gray-900">{userSubscription.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(userSubscription.status)}`}>
                    {userSubscription.status.charAt(0).toUpperCase() + userSubscription.status.slice(1)}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Owner</h3>
                <p className="mt-1 text-base font-medium text-gray-900">
                  {owner ? (
                    <Link href={`/admin/users/${owner.id}`} className="text-primary-600 hover:underline">
                      {owner.name} ({owner.email})
                    </Link>
                  ) : 'Unknown Owner'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Plan</h3>
                <p className="mt-1 text-base font-medium text-gray-900">
                  {plan ? (
                    <Link href={`/admin/subscriptions/${plan.id}`} className="text-primary-600 hover:underline">
                      {plan.name}
                    </Link>
                  ) : 'Unknown Plan'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Purchase Date</h3>
                <p className="mt-1 text-base font-medium text-gray-900">{formatDate(userSubscription.purchaseDate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Expiry Date</h3>
                <p className="mt-1 text-base font-medium text-gray-900">
                  {formatDate(userSubscription.expiryDate)}
                  {userSubscription.status === 'active' && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Credits Used</h3>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary-600 h-2.5 rounded-full" 
                    style={{ 
                      width: `${((userSubscription?.creditsUsed ?? 0) / (userSubscription?.totalCredits ?? 1)) * 100}%`
                    }}
                  ></div>
                </div>
                <p className="mt-1 text-sm text-gray-700">
                  {userSubscription?.creditsUsed ?? 0} of {userSubscription?.totalCredits ?? 0} credits used
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Credits Remaining</h3>
                <p className="mt-1 text-base font-medium text-gray-900">
                  {(userSubscription.totalCredits || 0) - (userSubscription.creditsUsed || 0)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Amount Paid</h3>
                <p className="mt-1 text-base font-medium text-gray-900">{formatPrice(userSubscription.amountPaid || 0)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
                <p className="mt-1 text-base font-medium text-gray-900">
                  {userSubscription.paymentMethod === 'credit_card' ? 'Credit Card' : 
                   userSubscription.paymentMethod === 'paypal' ? 'PayPal' : 
                   userSubscription.paymentMethod}
                </p>
              </div>
              {userSubscription.notes && (
                <div className="sm:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  <p className="mt-1 text-base text-gray-900">{userSubscription.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Subscription Actions
            </h2>
          </div>
          <div className="px-4 py-5 sm:p-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-2">Add Credits</h3>
              <p className="text-sm text-gray-500 mb-4">Add additional walk credits to this subscription.</p>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                onClick={() => alert('This would open a form to add credits')}
              >
                Add Credits
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-2">Extend Subscription</h3>
              <p className="text-sm text-gray-500 mb-4">Extend the subscription expiry date.</p>
              <button
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                onClick={() => alert('This would open a form to extend the subscription')}
              >
                Extend
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-md font-medium text-gray-900 mb-2">
                {userSubscription.status === 'active' ? 'Cancel Subscription' : 'Reactivate Subscription'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {userSubscription.status === 'active' 
                  ? 'Cancel this subscription. The user will still have access until the expiry date.'
                  : 'Reactivate this subscription if it was cancelled or expired.'}
              </p>
              <button
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  userSubscription.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
                onClick={() => alert(`This would ${userSubscription.status === 'active' ? 'cancel' : 'reactivate'} the subscription`)}
              >
                {userSubscription.status === 'active' ? 'Cancel' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Booking History
            </h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <p className="text-gray-500 text-center py-6">
              No bookings have been made with this subscription yet.
              {/* In a real app, this would display a table of bookings made using this subscription */}
            </p>
            <div className="text-center">
              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => alert('This would show a full booking history')}
              >
                View Full Booking History
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Transaction History
            </h2>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <p className="text-gray-500 text-center py-6">
              {/* In a real app, this would display a table of transactions related to this subscription */}
              The initial purchase transaction for this subscription was made on {formatDate(userSubscription.purchaseDate)}.
            </p>
            <div className="text-center">
              <Link
                href={`/admin/subscriptions/transactions?subscription=${userSubscription.id}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                View All Transactions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 