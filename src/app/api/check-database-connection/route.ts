import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Execute a simple query to check connection
    const dogsCount = await prisma.dog.count();
    const ownersCount = await prisma.owner.count();
    const walkersCount = await prisma.walker.count();
    const walksCount = await prisma.walk.count();
    
    // Determine if the database is empty - no dogs, owners, walkers or walks
    const isEmpty = dogsCount === 0 && ownersCount === 0 && walkersCount === 0 && walksCount === 0;
    
    return NextResponse.json({
      connected: true,
      isEmpty,
      counts: {
        dogs: dogsCount,
        owners: ownersCount,
        walkers: walkersCount,
        walks: walksCount
      }
    });
  } catch (error) {
    console.error('Database connection check failed:', error);
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 