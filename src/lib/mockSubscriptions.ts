import { SubscriptionPlan, UserSubscription, SubscriptionTransaction } from './types';
import { mockOwners } from './mockData';
import { mockUsers } from './mockUsers';
import { generateId } from '@/utils/helpers';

// Calculate the standard 2-month validity period in days
const VALIDITY_PERIOD_DAYS = 60;

// Create mock subscription plans with pricing based on £20 per walk
export const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'plan1',
    name: 'Basic',
    description: 'Perfect for occasional walkers',
    walkCredits: 10,
    walkDuration: 30,
    price: 9900, // £99.00
    validityPeriod: 30, // 30 days
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'plan2',
    name: 'Standard',
    description: 'Great value for regular walkers',
    walkCredits: 20,
    walkDuration: 45,
    price: 17900, // £179.00
    validityPeriod: 60, // 60 days
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'plan3',
    name: 'Premium',
    description: 'Our best value package',
    walkCredits: 40,
    walkDuration: 60,
    price: 29900, // £299.00
    validityPeriod: 90, // 90 days
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'plan4',
    name: 'Single Walk', 
    description: '1 walk of 60 minutes, valid for 2 months',
    walkCredits: 1,
    walkDuration: 60,
    price: 2000, // £20.00 (standard rate, no discount)
    validityPeriod: VALIDITY_PERIOD_DAYS,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: 'plan5',
    name: 'Premium Plus',
    description: '12 walks of 60 minutes each, valid for 2 months',
    walkCredits: 12,
    walkDuration: 60,
    price: 20400, // £204.00 (£17.00 per walk, 15% discount)
    validityPeriod: VALIDITY_PERIOD_DAYS,
    isActive: false, // Discontinued plan
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-02-01T00:00:00Z',
  },
];

// Helper function to get random future date within validity period
const getRandomFutureDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * days));
  return date.toISOString();
};

// Helper function to get expiry date from start date
const getExpiryDate = (startDate: string, validityPeriod: number): string => {
  const date = new Date(startDate);
  date.setDate(date.getDate() + validityPeriod);
  return date.toISOString();
};

// Create mock user subscriptions
export const mockUserSubscriptions: UserSubscription[] = [
  {
    id: 'sub1',
    userId: 'user1',
    ownerId: 'o1',
    planId: 'plan2',
    startDate: '2023-04-01T00:00:00Z',
    endDate: '2023-05-31T23:59:59Z',
    creditsRemaining: 15,
    status: 'active',
    purchaseAmount: 17900,
    purchaseDate: '2023-04-01T00:00:00Z'
  },
  {
    id: 'sub2',
    userId: 'user2',
    ownerId: 'o2',
    planId: 'plan1',
    startDate: '2023-03-15T00:00:00Z',
    endDate: '2023-04-14T23:59:59Z',
    creditsRemaining: 2,
    status: 'expired',
    purchaseAmount: 9900,
    purchaseDate: '2023-03-15T00:00:00Z'
  },
  {
    id: 'sub3',
    userId: 'user3',
    ownerId: 'o3',
    planId: 'plan3',
    startDate: '2023-04-10T00:00:00Z',
    endDate: '2023-07-09T23:59:59Z',
    creditsRemaining: 32,
    status: 'active',
    purchaseAmount: 29900,
    purchaseDate: '2023-04-10T00:00:00Z'
  },
  // John Smith's previous subscription
  {
    id: 'sub4',
    userId: 'user2', // John Smith
    ownerId: 'o1',
    planId: 'plan1', // Basic
    startDate: '2023-04-01T00:00:00Z',
    endDate: '2023-05-31T00:00:00Z',
    creditsRemaining: 0,
    status: 'expired',
    purchaseAmount: 9900,
    purchaseDate: '2023-04-01T00:00:00Z',
  },
];

// Create mock transactions
export const mockSubscriptionTransactions: SubscriptionTransaction[] = [
  // John Smith's current subscription purchase
  {
    id: 'trans1',
    userSubscriptionId: 'sub1',
    amount: 17900,
    type: 'purchase',
    status: 'successful',
    date: '2023-04-01T00:00:00Z',
    paymentMethod: 'credit_card',
  },
  // Sarah Johnson's current subscription purchase
  {
    id: 'trans2',
    userSubscriptionId: 'sub2',
    amount: 9900,
    type: 'purchase',
    status: 'successful',
    date: '2023-03-15T00:00:00Z',
    paymentMethod: 'credit_card',
  },
  // Michael Brown's expired subscription purchase
  {
    id: 'trans3',
    userSubscriptionId: 'sub3',
    amount: 29900,
    type: 'purchase',
    status: 'successful',
    date: '2023-04-10T00:00:00Z',
    paymentMethod: 'paypal',
  },
  // John Smith's previous subscription purchase
  {
    id: 'trans4',
    userSubscriptionId: 'sub4',
    amount: 9900,
    type: 'purchase',
    status: 'successful',
    date: '2023-04-01T00:00:00Z',
    paymentMethod: 'credit_card',
  },
];

// Subscription utilities

// Get a user's active subscription
export function getUserActiveSubscription(userId: string): UserSubscription | null {
  const today = new Date();
  return mockUserSubscriptions.find(
    sub => 
      sub.userId === userId && 
      sub.status === 'active' && 
      new Date(sub.endDate) > today &&
      sub.creditsRemaining > 0
  ) || null;
}

// Get a user's subscription history
export function getUserSubscriptionHistory(userId: string): UserSubscription[] {
  return mockUserSubscriptions.filter(sub => sub.userId === userId);
}

// Calculate price per walk for a plan
export function calculatePricePerWalk(plan: SubscriptionPlan): number {
  return plan.price / plan.walkCredits;
}

// Format price from pence to pounds with £ symbol
export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

// Calculate discount percentage compared to standard rate (£20 per walk)
export function calculateDiscount(plan: SubscriptionPlan): number {
  const standardRate = 2000; // £20 in pence
  const pricePerWalk = plan.price / plan.walkCredits;
  return Math.round((1 - pricePerWalk / standardRate) * 100);
}

// Format price per walk with £ symbol
export function formatPricePerWalk(plan: SubscriptionPlan): string {
  return formatPrice(calculatePricePerWalk(plan));
}

// Get subscription plan by ID
export function getSubscriptionPlanById(planId: string): SubscriptionPlan | undefined {
  return mockSubscriptionPlans.find(plan => plan.id === planId);
}

// Get all active subscription plans
export function getActiveSubscriptionPlans(): SubscriptionPlan[] {
  return mockSubscriptionPlans.filter(plan => plan.isActive);
}

// Get user subscriptions by user ID
export function getUserSubscriptions(userId: string): UserSubscription[] {
  return mockUserSubscriptions.filter(sub => sub.userId === userId);
}

// Create a new user subscription (simulating API call)
export function createUserSubscription(planId: string, userId: string, ownerId: string): UserSubscription {
  const plan = getSubscriptionPlanById(planId);
  if (!plan) {
    throw new Error('Subscription plan not found');
  }
  
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + plan.validityPeriod);
  
  const newSubscription: UserSubscription = {
    id: generateId('sub'),
    userId,
    ownerId,
    planId,
    startDate: today.toISOString(),
    endDate: endDate.toISOString(),
    creditsRemaining: plan.walkCredits,
    status: 'active',
    purchaseAmount: plan.price,
    purchaseDate: today.toISOString()
  };
  
  // In a real app, this would save to a database
  // For demo, simulate adding to the mock data
  mockUserSubscriptions.push(newSubscription);
  
  return newSubscription;
}

// Update a user subscription (simulating API call)
export function updateUserSubscription(subscriptionId: string, updates: Partial<UserSubscription>): UserSubscription | null {
  const subscriptionIndex = mockUserSubscriptions.findIndex(sub => sub.id === subscriptionId);
  if (subscriptionIndex === -1) {
    return null;
  }
  
  // In a real app, this would update the database
  // For demo, just return the updated subscription
  return {
    ...mockUserSubscriptions[subscriptionIndex],
    ...updates
  };
}

// Use a walk credit from a subscription
export function useWalkCredit(subscriptionId: string): boolean {
  const subscription = mockUserSubscriptions.find(sub => sub.id === subscriptionId);
  if (!subscription || subscription.creditsRemaining <= 0) {
    return false;
  }
  
  // In a real app, this would update the database
  // For demo, simulate updating the credits
  subscription.creditsRemaining -= 1;
  
  return true;
} 