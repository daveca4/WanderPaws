import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is an admin
    const { userId, role } = await getUserFromRequest(request);
    
    logger.info('Admin dashboard request', { userId, role });
    
    if (!userId || role !== 'admin') {
      logger.warn('Unauthorized access attempt to admin dashboard', { userId, role });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.info('Fetching admin dashboard stats');
    
    // Query database for all necessary dashboard stats
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
    
    logger.success('Admin dashboard stats fetched', dashboardStats);
    
    return NextResponse.json(dashboardStats);
  } catch (error) {
    logger.error('Error fetching admin dashboard stats', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch admin dashboard stats' },
      { status: 500 }
    );
  }
} 