import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    logger.info('ADMIN DASHBOARD API: Request received', { 
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers)
    });
    
    // Verify user is authenticated and is an admin
    const { userId, role } = await getUserFromRequest(request);
    
    logger.info('ADMIN DASHBOARD API: User authentication result', { 
      userId, 
      role,
      isAuthenticated: !!userId,
      isAdmin: role === 'admin'
    });
    
    if (!userId || role !== 'admin') {
      logger.warn('ADMIN DASHBOARD API: Unauthorized access attempt', { userId, role });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.info('ADMIN DASHBOARD API: Starting database queries');
    
    // Query database for all necessary dashboard stats
    try {
      const [
        usersCount,
        walksCount,
        dogsCount,
        pendingAssessmentsCount,
        recentSignupsCount,
        activeWalksCount,
        subscriptions
      ] = await Promise.all([
        // Total users
        prisma.user.count(),
        
        // Total walks
        prisma.walk.count(),
        
        // Total dogs
        prisma.dog.count(),
        
        // Pending assessments
        prisma.assessment.count({
          where: {
            OR: [
              { status: 'pending' },
              { status: 'ready_for_review' }
            ]
          }
        }),
        
        // Recent signups (last 7 days)
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        
        // Active walks (scheduled or in progress)
        prisma.walk.count({
          where: {
            OR: [
              { status: 'scheduled' },
              { status: 'in_progress' }
            ]
          }
        }),
        
        // Subscription revenue
        prisma.userSubscription.findMany({
          select: {
            purchaseAmount: true,
            createdAt: true
          }
        })
      ]);
      
      logger.info('ADMIN DASHBOARD API: Database queries complete', {
        usersCount,
        walksCount,
        dogsCount,
        pendingAssessmentsCount,
        recentSignupsCount,
        activeWalksCount,
        subscriptionsCount: subscriptions.length
      });
      
      // Calculate revenue stats
      const now = new Date();
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const revenue = {
        daily: 0,
        weekly: 0,
        monthly: 0,
        total: 0
      };
      
      // Calculate revenue
      subscriptions.forEach(subscription => {
        const amount = subscription.purchaseAmount / 100; // Convert from cents to dollars
        const createdAt = new Date(subscription.createdAt);
        
        // Add to total revenue
        revenue.total += amount;
        
        // Add to monthly revenue if subscription was created this month
        if (createdAt >= monthStart) {
          revenue.monthly += amount;
        }
        
        // Add to weekly revenue if subscription was created this week
        if (createdAt >= weekStart) {
          revenue.weekly += amount;
        }
        
        // Add to daily revenue if subscription was created today
        if (createdAt >= dayStart) {
          revenue.daily += amount;
        }
      });
      
      // Build response object
      const dashboardStats = {
        totalUsers: usersCount,
        totalWalks: walksCount,
        totalDogs: dogsCount,
        pendingAssessments: pendingAssessmentsCount,
        recentSignups: recentSignupsCount,
        activeWalks: activeWalksCount,
        revenue
      };
      
      logger.success('ADMIN DASHBOARD API: Stats successfully calculated', dashboardStats);
      
      return NextResponse.json(dashboardStats);
    } catch (dbError) {
      logger.error('ADMIN DASHBOARD API: Database query error', { 
        error: dbError,
        errorMessage: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
      throw dbError;
    }
  } catch (error) {
    logger.error('ADMIN DASHBOARD API: General error', { 
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch admin dashboard stats' },
      { status: 500 }
    );
  }
} 