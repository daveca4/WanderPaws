import { NextRequest, NextResponse } from 'next/server';
import * as dbOps from '@/lib/dbOperations';
import { parseJsonFields } from '@/lib/dbOperations';

// Interface for AI insights
interface AIInsight {
  id: string;
  type: 'walker_recommendation' | 'route_optimization' | 'customer_behavior' | 'scheduling';
  title: string;
  description: string;
  confidenceScore: number;
  impact: 'high' | 'medium' | 'low';
  status: 'new' | 'acknowledged' | 'implemented' | 'dismissed';
  createdAt: string;
  category: 'revenue' | 'customer_satisfaction' | 'operational_efficiency';
  relatedEntities?: {
    type: string;
    id: string;
    name: string;
  }[];
  recommendations?: string[];
}

// Sample AI insights data
const aiInsights: AIInsight[] = [
  {
    id: 'insight1',
    type: 'walker_recommendation',
    title: 'Assign Walker Sophia to Large Dog Clients',
    description: 'Based on satisfaction ratings and specialization, Walker Sophia has shown exceptional ability with large dog breeds. Assigning her to more large dog clients could boost satisfaction rates by 15%.',
    confidenceScore: 0.92,
    impact: 'high',
    status: 'new',
    createdAt: '2023-07-15T09:30:00Z',
    category: 'customer_satisfaction',
    relatedEntities: [
      { type: 'walker', id: 'w3', name: 'Sophia Chen' },
      { type: 'dog_category', id: 'large', name: 'Large Dogs' }
    ],
    recommendations: [
      'Increase Sophia\'s assignments for large dog breeds',
      'Consider creating a specialized large breed service with Sophia as lead walker',
      'Analyze her techniques for training other walkers'
    ]
  },
  {
    id: 'insight2',
    type: 'route_optimization',
    title: 'Morning Route Optimization in Downtown Area',
    description: 'Current morning routes in downtown have significant overlap. Optimizing these routes could reduce travel time by 22% and allow serving 3 more clients in the same time window.',
    confidenceScore: 0.86,
    impact: 'medium',
    status: 'acknowledged',
    createdAt: '2023-07-10T14:15:00Z',
    category: 'operational_efficiency',
    relatedEntities: [
      { type: 'area', id: 'downtown', name: 'Downtown' },
      { type: 'time_slot', id: 'morning', name: 'Morning (8-11am)' }
    ],
    recommendations: [
      'Reorganize downtown morning walks by proximity',
      'Group clients in same buildings or blocks',
      'Reduce walker crossover in adjacent areas'
    ]
  },
  {
    id: 'insight3',
    type: 'customer_behavior',
    title: 'Weekend Service Expansion Opportunity',
    description: 'Analysis shows 68% of churned customers mentioned lack of weekend availability. Adding more weekend slots could recover these customers and attract new ones.',
    confidenceScore: 0.78,
    impact: 'high',
    status: 'new',
    createdAt: '2023-07-18T11:20:00Z',
    category: 'revenue',
    recommendations: [
      'Increase walker availability on weekends',
      'Consider premium pricing for weekend services',
      'Target marketing to working professionals who need weekend care'
    ]
  },
  {
    id: 'insight4',
    type: 'scheduling',
    title: 'Optimize Midday Walker Shifts',
    description: 'Midday walks (11am-2pm) are frequently understaffed on Tuesdays and Thursdays, leading to declined bookings. Adjusting shift schedules could improve capacity by 30%.',
    confidenceScore: 0.94,
    impact: 'medium',
    status: 'implemented',
    createdAt: '2023-07-05T16:45:00Z',
    category: 'operational_efficiency',
    relatedEntities: [
      { type: 'time_slot', id: 'midday', name: 'Midday (11am-2pm)' },
      { type: 'days', id: 'tues_thurs', name: 'Tuesdays & Thursdays' }
    ],
    recommendations: [
      'Adjust walker schedules for better Tuesday/Thursday coverage',
      'Offer incentives for midday availability',
      'Consider staggered lunch breaks to maintain coverage'
    ]
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const insightId = searchParams.get('id');
  const category = searchParams.get('category');
  const status = searchParams.get('status');
  
  try {
    let filteredInsights = [...aiInsights];
    
    // Filter by ID if provided
    if (insightId) {
      const insight = filteredInsights.find(i => i.id === insightId);
      if (!insight) {
        return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
      }
      return NextResponse.json(insight);
    }
    
    // Apply category filter if provided
    if (category) {
      filteredInsights = filteredInsights.filter(i => i.category === category);
    }
    
    // Apply status filter if provided
    if (status) {
      filteredInsights = filteredInsights.filter(i => i.status === status);
    }
    
    // Return filtered insights
    return NextResponse.json(filteredInsights);
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    return NextResponse.json({ error: 'Failed to fetch insights data' }, { status: 500 });
  }
}

// Handle updating insight status
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, status } = data;
    
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // In a real app, this would update the database
    // For now, we'll just return success
    return NextResponse.json({ success: true, id, status });
  } catch (error) {
    console.error('Error updating insight:', error);
    return NextResponse.json({ error: 'Failed to update insight' }, { status: 500 });
  }
} 