import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE() {
  try {
    // Find all holiday requests with dates in 2025 (mock data)
    const mockRequests = await prisma.holidayRequest.findMany({
      where: {
        date: {
          contains: '2025',
        }
      }
    });
    
    console.log('Found mock requests:', mockRequests);
    
    if (mockRequests.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No mock holiday requests found to delete',
      });
    }
    
    // Delete each mock request
    let deletedCount = 0;
    const failures = [];
    
    for (const request of mockRequests) {
      try {
        await prisma.holidayRequest.delete({
          where: { id: request.id }
        });
        deletedCount++;
      } catch (deleteError) {
        console.error(`Error deleting request ${request.id}:`, deleteError);
        failures.push({
          id: request.id,
          error: deleteError instanceof Error ? deleteError.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${deletedCount} mock holiday requests`,
      total: mockRequests.length,
      deleted: deletedCount,
      failures: failures.length > 0 ? failures : undefined
    });
  } catch (error) {
    console.error('Error deleting mock holiday requests:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 