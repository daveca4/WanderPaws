import Link from 'next/link';
import { useEffect, useState } from 'react';
import { mockUserSubscriptions, getSubscriptionPlanById, formatPrice } from '@/lib/mockSubscriptions';
import { mockOwners } from '@/lib/mockData';
import { formatDate } from '@/utils/helpers';
import { UserSubscription } from '@/lib/types';
import { DashboardWidget } from '../DashboardWidget';

// Helper function to get owner by ID
const getOwnerById = (ownerId: string) => {
  return mockOwners.find(owner => owner.id === ownerId) || { name: 'Unknown owner' };
};

export const ActiveSubscriptionsWidget = () => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);

  useEffect(() => {
    setSubscriptions(
      mockUserSubscriptions
        .filter(sub => sub.status === 'active')
        .slice(0, 5) // Only show top 5
    );
  }, []);

  return (
    <DashboardWidget title="Active Subscriptions">
      <div className="flex justify-between items-center mb-4">
        <div></div>
        <Link href="/admin/subscriptions" className="text-sm text-primary-600 hover:text-primary-800">
          View All →
        </Link>
      </div>
      
      {subscriptions.length === 0 ? (
        <p className="text-gray-500">No active subscriptions</p>
      ) : (
        <div className="divide-y divide-gray-200">
          {subscriptions.map((subscription) => {
            const owner = getOwnerById(subscription.ownerId);
            const plan = getSubscriptionPlanById(subscription.planId);
            return (
              <div key={subscription.id} className="py-3">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{owner.name}</p>
                    <p className="text-sm text-gray-500">{plan?.name || 'Unknown'} Plan • {subscription.creditsRemaining} credits left</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      Expires: {formatDate(subscription.endDate)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">
                    {formatPrice(subscription.purchaseAmount)}
                  </span> • Purchased {formatDate(subscription.purchaseDate)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardWidget>
  );
}; 