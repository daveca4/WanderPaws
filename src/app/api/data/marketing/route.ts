import { NextRequest, NextResponse } from 'next/server';
import * as dbOps from '@/lib/dbOperations';
import { parseJsonFields } from '@/lib/dbOperations';

// Campaign interface
interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'in-app' | 'sms';
  status: 'active' | 'completed' | 'draft' | 'scheduled';
  audience: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  conversionRate: number;
  revenue: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  creator: string;
  description: string;
}

// Sample data for campaign list
const mockCampaigns: Campaign[] = [
  { 
    id: 'camp1', 
    name: 'Summer Special Offer', 
    type: 'email',
    status: 'active',
    audience: 'Low Usage Subscribers',
    sent: 156,
    opened: 102,
    clicked: 68,
    converted: 24,
    conversionRate: 15.4,
    revenue: 72000,
    startDate: '2023-06-15',
    endDate: '2023-07-15',
    createdAt: '2023-06-10T12:00:00Z',
    creator: 'Admin User',
    description: 'Special summer promotion with discounts on subscription upgrades.'
  },
  { 
    id: 'camp2', 
    name: 'Renewal Reminder', 
    type: 'email',
    status: 'completed',
    audience: 'Expiring Subscriptions',
    sent: 85,
    opened: 76,
    clicked: 52,
    converted: 38,
    conversionRate: 44.7,
    revenue: 114000,
    startDate: '2023-05-20',
    endDate: '2023-06-05',
    createdAt: '2023-05-15T10:30:00Z',
    creator: 'Admin User',
    description: 'Reminder email for subscriptions expiring within 14 days.'
  },
  { 
    id: 'camp3', 
    name: 'New Premium Plan', 
    type: 'in-app',
    status: 'draft',
    audience: 'All Active Users',
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    conversionRate: 0,
    revenue: 0,
    startDate: '',
    endDate: '',
    createdAt: '2023-07-01T15:45:00Z',
    creator: 'Marketing Manager',
    description: 'Announcement of new premium subscription plan with added benefits.'
  },
  { 
    id: 'camp4', 
    name: 'Win Back Campaign', 
    type: 'sms',
    status: 'scheduled',
    audience: 'Churned Customers',
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    conversionRate: 0,
    revenue: 0,
    startDate: '2023-08-01',
    endDate: '2023-08-15',
    createdAt: '2023-07-20T09:15:00Z',
    creator: 'Admin User',
    description: 'Re-engagement campaign for customers who cancelled subscription in the last 90 days.'
  }
];

// GET handler for marketing campaigns
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('id');
  
  try {
    if (campaignId) {
      // Return a single campaign if ID is provided
      const campaign = mockCampaigns.find(c => c.id === campaignId);
      
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      
      return NextResponse.json(campaign);
    }
    
    // Return all campaigns
    return NextResponse.json(mockCampaigns);
  } catch (error) {
    console.error('Error fetching marketing campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch marketing data' }, { status: 500 });
  }
}

// POST handler for creating a new campaign
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // In a real app, this would save to a database
    // For now, we'll just return the data with a generated ID
    const newCampaign = {
      ...data,
      id: `camp${mockCampaigns.length + 1}`,
      createdAt: new Date().toISOString(),
      conversionRate: 0,
      revenue: 0
    };
    
    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error('Error creating marketing campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
} 