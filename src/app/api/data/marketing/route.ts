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

// Sample data for now until database schema is updated
const sampleCampaigns: Campaign[] = [
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
  }
];

// GET handler for marketing campaigns
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('id');
  
  try {
    // In a real app, this would fetch from the database using prisma
    // For now, we'll use the sample data
    if (campaignId) {
      // Return a single campaign if ID is provided
      const campaign = sampleCampaigns.find(c => c.id === campaignId);
      
      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      
      return NextResponse.json(campaign);
    }
    
    // Return all campaigns
    return NextResponse.json(sampleCampaigns);
  } catch (error) {
    console.error('Error fetching marketing campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch marketing data' }, { status: 500 });
  }
}

// POST handler for creating a new campaign
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.type || !data.status || !data.audience) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, status, and audience are required' },
        { status: 400 }
      );
    }
    
    // In a real app, this would save to a database using prisma
    const newCampaign = {
      ...data,
      id: `camp${sampleCampaigns.length + 1}`,
      createdAt: new Date().toISOString(),
      sent: data.sent || 0,
      opened: data.opened || 0,
      clicked: data.clicked || 0,
      converted: data.converted || 0,
      conversionRate: data.conversionRate || 0,
      revenue: data.revenue || 0
    };
    
    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error('Error creating marketing campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
} 