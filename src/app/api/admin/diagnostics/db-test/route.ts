import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth/getUserFromRequest';
import { logger } from '@/lib/utils/logger';

/**
 * API endpoint to test database connection
 */
export async function GET(request: NextRequest) {
  try {
    logger.info('DB Diagnostics: Request received');
    
    // Verify user is authenticated and is an admin
    const { userId, role } = await getUserFromRequest(request);
    
    logger.info('DB Diagnostics: Authentication result', { 
      userId, 
      role,
      isAdmin: role === 'admin'
    });
    
    if (!userId || role !== 'admin') {
      logger.warn('DB Diagnostics: Unauthorized access attempt', { userId, role });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Test database connection
    logger.info('DB Diagnostics: Testing database connection');
    
    const startTime = performance.now();
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      dbConnectionSuccessful: false,
      tables: {},
      queryTimes: {},
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
      }
    };
    
    // Basic connection test
    try {
      await prisma.$queryRaw`SELECT 1 as connection_test`;
      diagnostics.dbConnectionSuccessful = true;
      diagnostics.connectionTestTime = `${(performance.now() - startTime).toFixed(2)}ms`;
      logger.info('DB Diagnostics: Connection test successful');
    } catch (error) {
      logger.error('DB Diagnostics: Connection test failed', { error });
      diagnostics.connectionError = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(diagnostics, { status: 500 });
    }
    
    // Get basic counts from primary tables
    try {
      const tableTests = [
        { name: 'users', fn: async () => await prisma.user.count() },
        { name: 'dogs', fn: async () => await prisma.dog.count() },
        { name: 'walks', fn: async () => await prisma.walk.count() },
        { name: 'assessments', fn: async () => await prisma.assessment.count() },
        { name: 'owners', fn: async () => await prisma.owner.count() },
        { name: 'walkers', fn: async () => await prisma.walker.count() }
      ];
      
      // Run tests sequentially to avoid overwhelming the database
      for (const test of tableTests) {
        const testStartTime = performance.now();
        try {
          const count = await test.fn();
          diagnostics.tables[test.name] = { count };
          diagnostics.queryTimes[test.name] = `${(performance.now() - testStartTime).toFixed(2)}ms`;
        } catch (error) {
          diagnostics.tables[test.name] = { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
          diagnostics.queryTimes[test.name] = `${(performance.now() - testStartTime).toFixed(2)}ms (error)`;
        }
      }
      
      logger.info('DB Diagnostics: Table tests completed', { 
        tables: Object.keys(diagnostics.tables) 
      });
    } catch (error) {
      logger.error('DB Diagnostics: Failed to run table tests', { error });
      diagnostics.tablesError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Get database version
    try {
      const versionQuery = await prisma.$queryRaw`SELECT version() as version`;
      diagnostics.dbVersion = Array.isArray(versionQuery) && versionQuery.length > 0 
        ? (versionQuery[0] as any).version 
        : 'Unknown';
    } catch (error) {
      diagnostics.dbVersionError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Complete diagnostics
    diagnostics.totalTestTime = `${(performance.now() - startTime).toFixed(2)}ms`;
    logger.success('DB Diagnostics: Tests completed successfully');
    
    return NextResponse.json(diagnostics);
  } catch (error) {
    logger.error('DB Diagnostics: General error', { 
      error,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json({ 
      error: 'Database diagnostics failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 