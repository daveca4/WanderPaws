import { SubscriptionPlan, UserSubscription } from './types';
import * as subscriptionService from './subscriptionService';

// Re-export empty arrays for backward compatibility
export const mockSubscriptionPlans: SubscriptionPlan[] = [];
export const mockUserSubscriptions: UserSubscription[] = [];

// Re-export all functions from the subscription service
export const {
  getSubscriptionPlans,
  getActiveSubscriptionPlans,
  getSubscriptionPlanById,
  getUserSubscriptions,
  getUserSubscriptionById,
  getUserActiveSubscription,
  getUserSubscriptionHistory,
  createUserSubscription,
  updateUserSubscription,
  cancelUserSubscription,
  formatPrice,
  calculatePricePerWalk,
  calculateDiscount,
  formatPricePerWalk
} = subscriptionService; 