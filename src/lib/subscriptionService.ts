import { SubscriptionPlan, UserSubscription } from './types';

// API endpoints
const API_ENDPOINTS = {
  SUBSCRIPTION_PLANS: '/api/subscriptions/plans',
  USER_SUBSCRIPTIONS: '/api/subscriptions/users',
  ACTIVE_SUBSCRIPTIONS: '/api/subscriptions/active',
};

// Fetch all subscription plans
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const response = await fetch(API_ENDPOINTS.SUBSCRIPTION_PLANS);
    if (!response.ok) throw new Error('Failed to fetch subscription plans');
    
    const data = await response.json();
    return data.plans || [];
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return [];
  }
}

// Fetch active subscription plans
export async function getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const response = await fetch(`${API_ENDPOINTS.SUBSCRIPTION_PLANS}?status=active`);
    if (!response.ok) throw new Error('Failed to fetch active subscription plans');
    
    const data = await response.json();
    return data.plans || [];
  } catch (error) {
    console.error('Error fetching active subscription plans:', error);
    return [];
  }
}

// Fetch subscription plan by ID
export async function getSubscriptionPlanById(planId: string): Promise<SubscriptionPlan | undefined> {
  try {
    const response = await fetch(`${API_ENDPOINTS.SUBSCRIPTION_PLANS}/${planId}`);
    if (!response.ok) throw new Error(`Failed to fetch subscription plan with ID ${planId}`);
    
    const data = await response.json();
    return data.plan;
  } catch (error) {
    console.error(`Error fetching subscription plan ${planId}:`, error);
    return undefined;
  }
}

// Fetch all user subscriptions
export async function getUserSubscriptions(userId?: string): Promise<UserSubscription[]> {
  try {
    const url = userId 
      ? `${API_ENDPOINTS.USER_SUBSCRIPTIONS}?userId=${userId}`
      : API_ENDPOINTS.USER_SUBSCRIPTIONS;
      
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch user subscriptions');
    
    const data = await response.json();
    return data.subscriptions || [];
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return [];
  }
}

// Fetch user subscription by ID
export async function getUserSubscriptionById(subscriptionId: string): Promise<UserSubscription | undefined> {
  try {
    const response = await fetch(`${API_ENDPOINTS.USER_SUBSCRIPTIONS}/${subscriptionId}`);
    if (!response.ok) throw new Error(`Failed to fetch subscription with ID ${subscriptionId}`);
    
    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error(`Error fetching subscription ${subscriptionId}:`, error);
    return undefined;
  }
}

// Fetch active subscription for a user
export async function getUserActiveSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const response = await fetch(`${API_ENDPOINTS.ACTIVE_SUBSCRIPTIONS}/${userId}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch active subscription for user ${userId}`);
    }
    
    const data = await response.json();
    return data.subscription || null;
  } catch (error) {
    console.error(`Error fetching active subscription for user ${userId}:`, error);
    return null;
  }
}

// Fetch subscription history for a user
export async function getUserSubscriptionHistory(userId: string): Promise<UserSubscription[]> {
  try {
    const response = await fetch(`${API_ENDPOINTS.USER_SUBSCRIPTIONS}/history/${userId}`);
    if (!response.ok) throw new Error(`Failed to fetch subscription history for user ${userId}`);
    
    const data = await response.json();
    return data.subscriptions || [];
  } catch (error) {
    console.error(`Error fetching subscription history for user ${userId}:`, error);
    return [];
  }
}

// Create a new user subscription
export async function createUserSubscription(
  planId: string, 
  userId: string, 
  ownerId: string
): Promise<UserSubscription | undefined> {
  try {
    const response = await fetch(API_ENDPOINTS.USER_SUBSCRIPTIONS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId, userId, ownerId }),
    });
    
    if (!response.ok) throw new Error('Failed to create user subscription');
    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error('Error creating user subscription:', error);
    return undefined;
  }
}

// Update a user subscription
export async function updateUserSubscription(
  subscriptionId: string, 
  subscriptionData: Partial<UserSubscription>
): Promise<UserSubscription | undefined> {
  try {
    const response = await fetch(`${API_ENDPOINTS.USER_SUBSCRIPTIONS}/${subscriptionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionData),
    });
    
    if (!response.ok) throw new Error(`Failed to update subscription with ID ${subscriptionId}`);
    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error(`Error updating subscription ${subscriptionId}:`, error);
    return undefined;
  }
}

// Cancel a user subscription
export async function cancelUserSubscription(
  subscriptionId: string
): Promise<UserSubscription | undefined> {
  try {
    const response = await fetch(`${API_ENDPOINTS.USER_SUBSCRIPTIONS}/${subscriptionId}/cancel`, {
      method: 'POST',
    });
    
    if (!response.ok) throw new Error(`Failed to cancel subscription with ID ${subscriptionId}`);
    const data = await response.json();
    return data.subscription;
  } catch (error) {
    console.error(`Error canceling subscription ${subscriptionId}:`, error);
    return undefined;
  }
}

// Utility functions
export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function calculatePricePerWalk(plan: SubscriptionPlan): number {
  return plan.price / plan.walkCredits;
}

export function calculateDiscount(plan: SubscriptionPlan): number {
  // Calculate discount percentage based on discountPercentage property
  return plan.discountPercentage || 0;
}

export function formatPricePerWalk(plan: SubscriptionPlan): string {
  return formatPrice(calculatePricePerWalk(plan));
} 