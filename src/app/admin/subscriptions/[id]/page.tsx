'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RouteGuard from '@/components/RouteGuard';
// Removed mock data import
import { SubscriptionPlan } from '@/lib/types';

export default function SubscriptionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Find the plan with the matching ID
    const foundPlan = mockSubscriptionPlans.find(p => p.id === params.id);
    
    if (foundPlan) {
      setPlan(foundPlan);
    }
    
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-600 mb-4">Subscription Plan Not Found</h2>
        <p className="text-gray-600 mb-4">
          The subscription plan you requested could not be found.
        </p>
        <Link
          href="/admin/subscriptions"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Back to Subscription Plans
        </Link>
      </div>
    );
  }

  return (
    <RouteGuard requiredPermission={{ action: 'read', resource: 'subscription_plans' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Subscription Plan Details
            </p>
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/admin/subscriptions/${plan.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Edit Plan
            </Link>
            <Link
              href="/admin/subscriptions"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Back to Plans
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Plan Information
            </h2>
          </div>
          <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Plan ID</dt>
                <dd className="mt-1 text-sm text-gray-900">{plan.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{plan.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    plan.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Walk Credits</dt>
                <dd className="mt-1 text-sm text-gray-900">{plan.walkCredits}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Walk Duration</dt>
                <dd className="mt-1 text-sm text-gray-900">{plan.walkDuration} min</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Validity Period</dt>
                <dd className="mt-1 text-sm text-gray-900">{plan.validityPeriod} days</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Price</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900">{formatPrice(plan.price)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Price Per Walk</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatPricePerWalk(plan)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Discount</dt>
                <dd className="mt-1 text-sm">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {plan.discountPercentage !== undefined ? plan.discountPercentage : calculateDiscount(plan)}%
                  </span>
                  {plan.discountPercentage !== undefined && (
                    <p className="mt-1 text-xs text-gray-500">Custom discount applied</p>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Description</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>{plan.description}</p>
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Plan Metadata</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(plan.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(plan.updatedAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
} 