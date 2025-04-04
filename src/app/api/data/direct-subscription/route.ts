import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('DIRECT QUERY: Attempting to fetch subscription from database directly');
    
    // Extract userId from query parameter
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    
    console.log('Looking for subscriptions for user ID:', userId);
    
    // Try standard model
    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (subscription) {
      console.log('Found subscription via standard model:', subscription);
      return NextResponse.json(subscription);
    }
    
    // Try to find owner profile first
    const owner = await prisma.owner.findUnique({
      where: {
        userId: userId
      }
    });
    
    if (owner) {
      // Try to find subscription with owner ID
      const ownerSubscription = await prisma.userSubscription.findFirst({
        where: {
          userId: owner.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (ownerSubscription) {
        console.log('Found subscription via owner ID:', ownerSubscription);
        return NextResponse.json(ownerSubscription);
      }
    }
    
    // Direct raw query matching your screenshot
    console.log('Attempting raw query as seen in screenshot');
    const rawResults = await prisma.$queryRaw`
      SELECT * FROM "Subscription" 
      WHERE "userId" = ${userId} 
      LIMIT 1;
    `;
    
    if (Array.isArray(rawResults) && rawResults.length > 0) {
      console.log('Found subscription via raw query:', rawResults[0]);
      return NextResponse.json(rawResults[0]);
    }
    
    // Try with the table name UserSubscription
    const altRawResults = await prisma.$queryRaw`
      SELECT * FROM "UserSubscription" 
      WHERE "userId" = ${userId} 
      LIMIT 1;
    `;
    
    if (Array.isArray(altRawResults) && altRawResults.length > 0) {
      console.log('Found subscription in UserSubscription table:', altRawResults[0]);
      return NextResponse.json(altRawResults[0]);
    }
    
    // Query all tables to find any table with subscription data
    console.log('Checking all tables for subscription data...');
    
    // List of possible table names based on the screenshot
    const tableNames = [
      'Subscription', 
      'UserSubscription', 
      'subscription', 
      'user_subscription', 
      'subscriptions'
    ];
    
    for (const tableName of tableNames) {
      try {
        const tableResults = await prisma.$queryRaw`
          SELECT * FROM "${tableName}" 
          WHERE "userId" = ${userId} 
          LIMIT 1;
        `;
        
        if (Array.isArray(tableResults) && tableResults.length > 0) {
          console.log(`Found subscription in table ${tableName}:`, tableResults[0]);
          return NextResponse.json(tableResults[0]);
        }
      } catch (error) {
        console.log(`Table ${tableName} not found or error:`, error);
      }
    }
    
    return NextResponse.json({ 
      error: 'No subscription found', 
      userId,
      tablesChecked: tableNames
    }, { status: 404 });
  } catch (error: any) {
    console.error('Error in direct subscription query:', error);
    return NextResponse.json({ 
      error: error.message, 
      stack: error.stack
    }, { status: 500 });
  }
} 