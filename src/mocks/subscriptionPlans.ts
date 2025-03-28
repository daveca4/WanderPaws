import { SubscriptionPlan } from '@/lib/types';

export const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'plan-1',
    name: 'Basic',
    description: 'Essential dog walking service with 4 walks per month',
    walkCredits: 4,
    walkDuration: 30,
    price: 2999, // £29.99
    validityPeriod: 30,
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'plan-2',
    name: 'Premium',
    description: 'Regular dog walking service with 12 walks per month',
    walkCredits: 12,
    walkDuration: 45,
    price: 7999, // £79.99
    validityPeriod: 30,
    isActive: true,
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z'
  },
  {
    id: 'plan-3',
    name: 'Ultimate',
    description: 'Daily dog walking service with 30 walks per month',
    walkCredits: 30,
    walkDuration: 60,
    price: 14999, // £149.99
    validityPeriod: 30,
    isActive: true,
    createdAt: '2023-01-03T00:00:00Z',
    updatedAt: '2023-01-03T00:00:00Z',
    discountPercentage: 10
  },
  {
    id: 'plan-4',
    name: 'Weekend Special',
    description: 'Weekend-only walks, 8 walks per month (weekends only)',
    walkCredits: 8,
    walkDuration: 45,
    price: 5999, // £59.99
    validityPeriod: 30,
    isActive: false,
    createdAt: '2023-02-01T00:00:00Z',
    updatedAt: '2023-02-01T00:00:00Z'
  }
]; 