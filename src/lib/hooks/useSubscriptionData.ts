import { useState, useEffect } from 'react';
import type { SubscriptionPlan, UserSubscription } from '../types';

// Mock subscription plan data until the real API is implemented
const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan1',
    name: 'Basic',
    description: 'Perfect for occasional walks',
    walkCredits: 4,
    walkDuration: 30,
    price: 3995, // £39.95
    validityPeriod: 30, // 30 days
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plan2',
    name: 'Premium',
    description: 'Most popular for regular walks',
    walkCredits: 12,
    walkDuration: 45,
    price: 9995, // £99.95
    validityPeriod: 60, // 60 days
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    discountPercentage: 15
  },
  {
    id: 'plan3',
    name: 'Ultimate',
    description: 'Best value for daily walks',
    walkCredits: 30,
    walkDuration: 60,
    price: 19995, // £199.95
    validityPeriod: 90, // 90 days
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    discountPercentage: 25
  }
];

// Fetch all subscription plans
async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    // First try to fetch from the API
    const response = await fetch('/api/data/subscription-plans');
    
    if (response.ok) {
      return await response.json();
    } else {
      console.warn('Falling back to mock subscription plans data');
      return MOCK_SUBSCRIPTION_PLANS;
    }
  } catch (error) {
    console.warn('Error fetching plans, using mock data:', error);
    return MOCK_SUBSCRIPTION_PLANS;
  }
}

// Fetch user subscriptions
async function fetchUserSubscriptions(userId: string): Promise<UserSubscription[]> {
  try {
    // Try to fetch from API 
    const response = await fetch(`/api/data/subscriptions?userId=${userId}`);
    
    if (response.ok) {
      return await response.json();
    } else {
      console.warn('No user subscriptions found or API not available');
      return [];
    }
  } catch (error) {
    console.warn('Error fetching user subscriptions:', error);
    return [];
  }
}

// React hook for subscription plans
export function useSubscriptionPlans() {
  const [data, setData] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const plans = await fetchSubscriptionPlans();
        setData(plans);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('Error in useSubscriptionPlans:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  return { data, isLoading, error };
}

// React hook for user's subscriptions
export function useUserSubscriptions(userId: string | undefined) {
  const [data, setData] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function loadData() {
      if (!userId) {
        setData([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const subscriptions = await fetchUserSubscriptions(userId);
        setData(subscriptions);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('Error in useUserSubscriptions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [userId]);
  
  return { data, isLoading, error };
}

// Find active subscription from a list
export function findActiveSubscription(subscriptions: UserSubscription[] = []): UserSubscription | undefined {
  const now = new Date();
  return subscriptions.find(sub => 
    sub.status === 'active' && new Date(sub.endDate) > now
  );
} 