import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is an admin
    const { userId, role } = await getUserFromRequest(request);
    
    logger.info('Admin reports request', { userId, role });
    
    if (!userId || role !== 'admin') {
      logger.warn('Unauthorized access attempt to admin reports', { userId, role });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    logger.info('Fetching admin reports data');
    
    // Get revenue data (from completed walks)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Get revenue data by month
    const walks = await prisma.walk.findMany({
      where: {
        status: 'completed',
        startTime: { gte: sixMonthsAgo }
      },
      select: {
        id: true,
        startTime: true,
        price: true
      }
    });
    
    // Get subscription data
    const subscriptions = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: {
            userSubscriptions: {
              where: {
                status: 'active'
              }
            }
          }
        }
      }
    });
    
    // Process walk data for charts
    const walksByMonth: Record<string, any> = {};
    const walksByDay: Record<string, Record<string, number>> = {};
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    walks.forEach(walk => {
      const date = new Date(walk.startTime);
      const monthIndex = date.getMonth();
      const monthName = months[monthIndex];
      const dayIndex = date.getDay();
      const dayName = days[dayIndex];
      
      // Process for monthly walk counts
      if (!walksByMonth[monthName]) {
        walksByMonth[monthName] = {
          month: monthName,
          count: 0,
          amount: 0,
          byDay: {
            monday: 0,
            tuesday: 0,
            wednesday: 0,
            thursday: 0,
            friday: 0,
            saturday: 0,
            sunday: 0
          }
        };
      }
      
      walksByMonth[monthName].count += 1;
      walksByMonth[monthName].amount += walk.price || 0;
      walksByMonth[monthName].byDay[dayName] += 1;
      
      // Process for daily distribution
      if (!walksByDay[dayName]) {
        walksByDay[dayName] = { day: dayName, count: 0 };
      }
      walksByDay[dayName].count += 1;
    });
    
    const walkData = Object.values(walksByMonth);
    const revenueData = Object.values(walksByMonth).map(month => ({
      month: month.month,
      amount: month.amount
    }));
    
    const subscriptionData = subscriptions.map(plan => ({
      name: plan.name,
      count: plan._count.userSubscriptions
    }));
    
    logger.success('Admin reports data fetched');
    
    return NextResponse.json({
      revenue: revenueData,
      walks: walkData,
      subscriptions: subscriptionData
    });
    
  } catch (error) {
    logger.error('Error in reports API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
} 