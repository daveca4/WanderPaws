import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('API: Fetching raw subscription for user ID:', params.id);
    
    // First try looking up the subscription directly
    const directSubscription = await prisma.userSubscription.findFirst({
      where: {
        userId: params.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (directSubscription) {
      console.log('Found direct subscription for user:', directSubscription);
      return NextResponse.json(directSubscription);
    }
    
    // If not found, look for owner profile ID
    const ownerProfile = await prisma.owner.findUnique({
      where: {
        userId: params.id
      },
      select: { id: true }
    });
    
    if (ownerProfile) {
      const userProfileId = ownerProfile.id;
      console.log('Found owner profile ID:', userProfileId);
      
      // Try to find a subscription with the owner ID
      const subscriptionByOwner = await prisma.userSubscription.findFirst({
        where: {
          userId: userProfileId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (subscriptionByOwner) {
        console.log('Found subscription by owner ID:', subscriptionByOwner);
        return NextResponse.json(subscriptionByOwner);
      }
    }
    
    // Direct database query for any subscription records
    console.log('Attempting direct database query for user ID:', params.id);
    const dbQuery = await prisma.$queryRaw`
      SELECT * FROM "UserSubscription"
      WHERE "userId" = ${params.id}
      ORDER BY "createdAt" DESC
      LIMIT 1;
    `;
    
    if (Array.isArray(dbQuery) && dbQuery.length > 0) {
      console.log('Found subscription via raw query:', dbQuery[0]);
      return NextResponse.json(dbQuery[0]);
    }
    
    // Try different table name case
    const dbQueryAlt = await prisma.$queryRaw`
      SELECT * FROM "public"."UserSubscription" 
      WHERE "userId" = ${params.id}
      ORDER BY "createdAt" DESC
      LIMIT 1;
    `;
    
    if (Array.isArray(dbQueryAlt) && dbQueryAlt.length > 0) {
      console.log('Found subscription via alt raw query:', dbQueryAlt[0]);
      return NextResponse.json(dbQueryAlt[0]);
    }
    
    // Last attempt - query through all tables
    console.log('Checking for subscription record in other tables...');
    // Try with your exact table name from screenshot
    const directQuery = await prisma.$queryRaw`
      SELECT * FROM "Subscription"
      WHERE "userId" = ${params.id}
      ORDER BY "id" DESC
      LIMIT 1;
    `;
    
    if (Array.isArray(directQuery) && directQuery.length > 0) {
      console.log('Found subscription in different table:', directQuery[0]);
      return NextResponse.json(directQuery[0]);
    }
    
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error fetching raw user subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 