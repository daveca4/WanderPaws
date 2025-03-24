import { NextRequest, NextResponse } from 'next/server';
import * as dbOps from '@/lib/dbOperations';
import { parseJsonFields } from '@/lib/dbOperations';

// Sample data structure for revenue reports
interface RevenueReport {
  month: string;
  subscriptions: number;
  oneTimeBookings: number;
  refunds: number;
  total: number;
}

// Sample data structure for subscription activity
interface SubscriptionActivity {
  month: string;
  newSubscriptions: number;
  renewals: number;
  cancellations: number;
  revenue: number;
}

// Sample data structure for subscription plan distribution
interface SubscriptionPlanData {
  name: string;
  value: number;
  subscribers: number;
}

// Sample data until we have a proper database implementation
const revenueTrendsData: RevenueReport[] = [
  { month: 'Jan', subscriptions: 250000, oneTimeBookings: 70000, refunds: 10000, total: 310000 },
  { month: 'Feb', subscriptions: 280000, oneTimeBookings: 85000, refunds: 12000, total: 353000 },
  { month: 'Mar', subscriptions: 300000, oneTimeBookings: 95000, refunds: 8000, total: 387000 },
  { month: 'Apr', subscriptions: 320000, oneTimeBookings: 100000, refunds: 15000, total: 405000 },
  { month: 'May', subscriptions: 350000, oneTimeBookings: 110000, refunds: 11000, total: 449000 },
  { month: 'Jun', subscriptions: 380000, oneTimeBookings: 120000, refunds: 9000, total: 491000 },
  { month: 'Jul', subscriptions: 420000, oneTimeBookings: 130000, refunds: 12000, total: 538000 },
];

const subscriptionActivityData: SubscriptionActivity[] = [
  { month: 'Jan', newSubscriptions: 12, renewals: 5, cancellations: 2, revenue: 196000 },
  { month: 'Feb', newSubscriptions: 15, renewals: 7, cancellations: 3, revenue: 242000 },
  { month: 'Mar', newSubscriptions: 18, renewals: 9, cancellations: 1, revenue: 286000 },
  { month: 'Apr', newSubscriptions: 22, renewals: 10, cancellations: 2, revenue: 342000 },
  { month: 'May', newSubscriptions: 25, renewals: 12, cancellations: 3, revenue: 384000 },
  { month: 'Jun', newSubscriptions: 28, renewals: 14, cancellations: 2, revenue: 425000 },
  { month: 'Jul', newSubscriptions: 32, renewals: 16, cancellations: 4, revenue: 480000 },
];

const subscriptionPlanData: SubscriptionPlanData[] = [
  { name: 'Basic', value: 32, subscribers: 32 },
  { name: 'Standard', value: 48, subscribers: 48 },
  { name: 'Premium', value: 28, subscribers: 28 },
  { name: 'Annual Basic', value: 15, subscribers: 15 },
  { name: 'Annual Premium', value: 10, subscribers: 10 },
];

export async function GET(request: NextRequest) {
  // Get the report type from the query parameters
  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get('type');
  
  try {
    // In a real application, this would fetch from a database
    let reportData;
    
    switch (reportType) {
      case 'revenue':
        reportData = revenueTrendsData;
        break;
      case 'subscription_activity':
        reportData = subscriptionActivityData;
        break;
      case 'subscription_plan':
        reportData = subscriptionPlanData;
        break;
      default:
        // Return all data if no specific type is requested
        reportData = {
          revenue: revenueTrendsData,
          subscriptionActivity: subscriptionActivityData,
          subscriptionPlan: subscriptionPlanData
        };
    }
    
    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error fetching report data:', error);
    return NextResponse.json({ error: 'Failed to fetch report data' }, { status: 500 });
  }
} 