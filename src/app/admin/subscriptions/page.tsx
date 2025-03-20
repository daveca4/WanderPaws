'use client';

import { useState } from 'react';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { mockSubscriptionPlans } from '@/lib/mockSubscriptions';
import { formatPrice, calculateDiscount, formatPricePerWalk } from '@/lib/mockSubscriptions';
import { SubscriptionPlan } from '@/lib/types';

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(mockSubscriptionPlans);
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const displayedPlans = showInactive 
    ? plans 
    : plans.filter(plan => plan.isActive);

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
                        {calculateDiscount(plan)}%
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
                      <Link href={`/admin/subscriptions/${plan.id}`} className="text-primary-600 hover:text-primary-900 mr-4">
                        View
                      </Link>
                      <Link href={`/admin/subscriptions/${plan.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                        Edit
                      </Link>
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