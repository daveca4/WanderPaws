import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Check authentication and permissions
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });
    
    if (!user || user.role !== 'ADMIN') {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403 }
      );
    }
    
    // Get revenue data (from completed walks)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Get revenue data by month
    const walks = await prisma.walk.findMany({
      where: {
        status: 'COMPLETED',
        startTime: { gte: sixMonthsAgo }
      },
      select: {
        id: true,
        startTime: true,
        timeSlot: {
          select: {
            price: true
          }
        }
      }
    });
    
    // Get subscription data
    const subscriptions = await prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: {
            userSubscriptions: {
              where: {
                status: 'ACTIVE'
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
      walksByMonth[monthName].amount += walk.timeSlot?.price || 0;
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
    
    return NextResponse.json({
      revenue: revenueData,
      walks: walkData,
      subscriptions: subscriptionData
    });
    
  } catch (error) {
    console.error('Error in reports API:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch report data' }),
      { status: 500 }
    );
  }
} 