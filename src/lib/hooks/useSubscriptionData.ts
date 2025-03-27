import { useQuery, useMutation, useQueryClient } from 'react-query';
import type { SubscriptionPlan, UserSubscription } from '../types';

// Base API URL
const API_URL = '/api/data';

// Query keys for consistent cache management
export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  plans: () => [...subscriptionKeys.all, 'plans'] as const,
  userSubscriptions: () => [...subscriptionKeys.all, 'user'] as const,
  userSubscription: (userId: string) => [...subscriptionKeys.userSubscriptions(), userId] as const,
};

// Fetch all subscription plans
async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await fetch(`${API_URL}/subscription-plans`);
  if (!response.ok) {
    throw new Error('Failed to fetch subscription plans');
  }
  return response.json();
}

// Fetch user subscriptions
async function fetchUserSubscriptions(userId: string): Promise<UserSubscription[]> {
  const response = await fetch(`${API_URL}/users/${userId}/subscriptions`);
  if (!response.ok) {
    throw new Error('Failed to fetch user subscriptions');
  }
  return response.json();
}

// React Query hook for subscription plans
export function useSubscriptionPlans() {
  return useQuery(
    subscriptionKeys.plans(),
    () => fetchSubscriptionPlans(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      // On failure, return empty array to prevent UI breakage
      onError: (error) => {
        console.error('Error fetching subscription plans:', error);
        return [];
      }
    }
  );
}

// React Query hook for user's subscriptions
export function useUserSubscriptions(userId: string | undefined) {
  return useQuery(
    subscriptionKeys.userSubscription(userId || 'unknown'),
    () => userId ? fetchUserSubscriptions(userId) : Promise.resolve([]),
    {
      enabled: !!userId,
      staleTime: 2 * 60 * 1000, // 2 minutes
      // On failure, return empty array to prevent UI breakage
      onError: (error) => {
        console.error('Error fetching user subscriptions:', error);
        return [];
      }
    }
  );
}

// Find active subscription from a list
export function findActiveSubscription(subscriptions: UserSubscription[] = []): UserSubscription | undefined {
  const now = new Date();
  return subscriptions.find(sub => 
    sub.status === 'active' && new Date(sub.endDate) > now
  );
} 