import { NextRequest, NextResponse } from 'next/server';

// Mock subscription plan data
const MOCK_SUBSCRIPTION_PLANS = [
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

// This is a placeholder endpoint until the subscription plans feature is fully implemented
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/data/subscription-plans - placeholder endpoint');
    
    // Return mock subscription plans
    return NextResponse.json(MOCK_SUBSCRIPTION_PLANS);
  } catch (error) {
    console.error('Error in subscription plans API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
} 