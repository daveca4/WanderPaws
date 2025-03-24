import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatPrice, getActiveSubscriptionPlans } from '@/lib/subscriptionService'; 
import { formatDate } from '@/utils/helpers';
import { UserSubscription, SubscriptionPlan, Owner } from '@/lib/types';
import { DashboardWidget } from '../DashboardWidget';

export const ActiveSubscriptionsWidget = () => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get owner by ID
  const getOwnerById = (ownerId: string) => {
    return owners.find(owner => owner.id === ownerId) || { name: 'Unknown owner' };
  };

  // Helper function to get plan by ID
  const getPlanById = (planId: string) => {
    return plans.find(plan => plan.id === planId);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch active subscriptions using the API service
        const subsResponse = await fetch('/api/subscriptions/active');
        if (!subsResponse.ok) {
          throw new Error('Failed to fetch active subscriptions');
        }
        const subsData = await subsResponse.json();
        
        // Fetch plans using the subscription service
        const plansData = await getActiveSubscriptionPlans();
        
        // Fetch owners
        const ownersResponse = await fetch('/api/owners');
        if (!ownersResponse.ok) {
          throw new Error('Failed to fetch owners');
        }
        const ownersData = await ownersResponse.json();
        
        setSubscriptions(subsData.subscriptions.slice(0, 5)); // Only show top 5
        setPlans(plansData);
        setOwners(ownersData.owners);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <DashboardWidget title="Active Subscriptions">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-20 bg-gray-200 rounded w-full mb-2"></div>
        </div>
      </DashboardWidget>
    );
  }
  
  if (error) {
    return (
      <DashboardWidget title="Active Subscriptions">
        <div className="text-red-500">Error: {error}</div>
      </DashboardWidget>
    );
  }

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
            const plan = getPlanById(subscription.planId);
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