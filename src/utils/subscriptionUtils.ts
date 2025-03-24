import { SubscriptionPlan, UserSubscription } from '@/lib/types';

// Format price from pence to pounds with £ symbol
export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

// Calculate price per walk for a plan
export function calculatePricePerWalk(plan: SubscriptionPlan): number {
  return plan.price / plan.walkCredits;
}

// Format price per walk with £ symbol
export function formatPricePerWalk(plan: SubscriptionPlan): string {
  return formatPrice(calculatePricePerWalk(plan));
}

// Calculate discount percentage compared to standard rate
export function calculateDiscount(plan: SubscriptionPlan, standardRate: number = 2000): number {
  const pricePerWalk = plan.price / plan.walkCredits;
  return Math.round((1 - pricePerWalk / standardRate) * 100);
}

// Check if a subscription is active
export function isSubscriptionActive(subscription: UserSubscription): boolean {
  const today = new Date();
  const endDate = new Date(subscription.endDate);
  return subscription.status === 'active' && endDate > today && subscription.creditsRemaining > 0;
}

// Fetch subscription plans from API
export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const response = await fetch('/api/subscriptions');
    if (!response.ok) {
      throw new Error('Failed to fetch subscription plans');
    }
    const data = await response.json();
    return data.plans;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }
}

// Fetch user subscriptions from API
export async function fetchUserSubscriptions(userId: string): Promise<UserSubscription[]> {
  try {
    const response = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user subscriptions');
    }
    
    const data = await response.json();
    return data.subscriptions;
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return [];
  }
}

// Get active subscription for a user
export async function getUserActiveSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const subscriptions = await fetchUserSubscriptions(userId);
    return subscriptions.find(isSubscriptionActive) || null;
  } catch (error) {
    console.error('Error getting active subscription:', error);
    return null;
  }
} 