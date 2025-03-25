import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';

// Cache for all data
const cacheTtl = 60 * 1000; // 60 seconds
let cachedAllData: {
  data: any;
  timestamp: number;
} | null = null;

export async function GET(request: NextRequest) {
  try {
    // Check for cache
    const now = Date.now();
    if (cachedAllData && now - cachedAllData.timestamp < cacheTtl) {
      // Return cached data with cache headers
      const headers = new Headers();
      headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
      headers.set('X-Cache', 'HIT');
      
      return NextResponse.json(cachedAllData.data, { headers });
    }
    
    // Set cache headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=60, s-maxage=60');
    headers.set('X-Cache', 'MISS');
    
    // Use Promise.allSettled for fault tolerance - if one query fails, we still get partial data
    const [dogsResult, ownersResult, walkersResult, walksResult, assessmentsResult] = 
      await Promise.allSettled([
        prisma.dog.findMany({ include: { owner: true } }),
        prisma.owner.findMany(),
        prisma.walker.findMany(),
        prisma.walk.findMany(),
        prisma.assessment.findMany()
      ]);
    
    // Process results with error handling
    const results: Record<string, any> = {};
    
    if (dogsResult.status === 'fulfilled') {
      results.dogs = dogsResult.value.map(dog => parseJsonFields(dog));
    } else {
      console.error('Error fetching dogs:', dogsResult.reason);
      results.dogs = [];
    }
    
    if (ownersResult.status === 'fulfilled') {
      results.owners = ownersResult.value.map(owner => parseJsonFields(owner));
    } else {
      console.error('Error fetching owners:', ownersResult.reason);
      results.owners = [];
    }
    
    if (walkersResult.status === 'fulfilled') {
      results.walkers = walkersResult.value.map(walker => parseJsonFields(walker));
    } else {
      console.error('Error fetching walkers:', walkersResult.reason);
      results.walkers = [];
    }
    
    if (walksResult.status === 'fulfilled') {
      results.walks = walksResult.value.map(walk => parseJsonFields(walk));
    } else {
      console.error('Error fetching walks:', walksResult.reason);
      results.walks = [];
    }
    
    if (assessmentsResult.status === 'fulfilled') {
      results.assessments = assessmentsResult.value.map(assessment => parseJsonFields(assessment));
    } else {
      console.error('Error fetching assessments:', assessmentsResult.reason);
      results.assessments = [];
    }
    
    // Add timestamp for cache age information
    results.timestamp = new Date().toISOString();
    
    // Update cache
    cachedAllData = {
      data: results,
      timestamp: now
    };
    
    // Return all data in a single response
    return NextResponse.json(results, { headers });
  } catch (error) {
    console.error('Error fetching all data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 