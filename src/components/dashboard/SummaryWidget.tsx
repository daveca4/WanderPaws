import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useAdminDashboardStats } from '@/lib/hooks/useStandardizedAdminHooks';
import { logger } from '@/lib/utils/logger';

export function SummaryWidget() {
  const { user } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Debug user auth state
  useEffect(() => {
    logger.info('SummaryWidget - Current User:', {
      userId: user?.id, 
      role: user?.role,
      profileId: user?.profileId
    });
  }, [user]);
  
  const { 
    data: stats, 
    isLoading, 
    error, 
    isError, 
    refetch,
    failureCount,
    isFetching 
  } = useAdminDashboardStats();

  // Debug data state
  useEffect(() => {
    logger.info('SummaryWidget - Stats data updated:', {
      hasData: !!stats,
      failureCount: failureCount,
      isLoading,
      isFetching,
      hasError: !!error
    });
    
    if (stats) {
      logger.info('SummaryWidget - Stats content:', {
        totalUsers: stats.totalUsers,
        pendingAssessments: stats.pendingAssessments,
        revenue: stats.revenue
      });
    }
  }, [stats, isLoading, isFetching, failureCount, error]);

  // Fetch data when user is available
  useEffect(() => {
    if (user && user.role === 'admin') {
      logger.info('SummaryWidget - Triggering refetch with user:', user.id);
      refetch();
    }
  }, [user, refetch]);

  const handleRetry = () => {
    logger.info('SummaryWidget - Manual retry triggered');
    setRetryCount(prev => prev + 1);
    refetch();
  };
  
  // Test direct API access
  const testDirectApi = async () => {
    try {
      logger.info('SummaryWidget - Testing direct API call');
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (user?.id) headers['user-id'] = user.id;
      if (user?.role) headers['user-role'] = user.role;
      if (user?.profileId) headers['user-profile-id'] = user.profileId;
      
      logger.info('SummaryWidget - Direct API headers:', headers);
      
      const response = await fetch('/api/admin/dashboard', { 
        method: 'GET',
        headers
      });
      
      logger.info('SummaryWidget - Direct API status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        logger.info('SummaryWidget - Direct API data:', data);
        setDebugInfo(data);
        
        // Trigger a refetch with the React Query hook
        refetch();
      } else {
        const errorText = await response.text();
        logger.error('SummaryWidget - Direct API error:', { 
          status: response.status, 
          statusText: response.statusText,
          body: errorText
        });
        setDebugInfo({ error: `${response.status}: ${response.statusText}`, body: errorText });
      }
    } catch (err) {
      logger.error('SummaryWidget - Direct API exception:', err);
      setDebugInfo({ 
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
    }
  };

  if (isLoading) {
    logger.info('SummaryWidget - Rendering loading state');
    return (
      <div className="h-full w-full p-4 flex items-center justify-center flex-col">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600 mb-3"></div>
        <p className="text-sm text-gray-500">Loading dashboard data...</p>
      </div>
    );
  }

  if (isError || !stats) {
    logger.info('SummaryWidget - Rendering error state:', { error, stats });
    return (
      <div className="h-full w-full p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Summary</h2>
        <div className="bg-red-50 p-4 rounded-lg mb-4">
          <p className="text-red-700">Unable to load dashboard data</p>
          <p className="text-sm text-red-600 mt-1">
            {error instanceof Error ? error.message : 'Database error occurred'}
          </p>
          <div className="flex space-x-2 mt-3">
            <button 
              onClick={handleRetry}
              className="px-4 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Retry
            </button>
            <button
              onClick={testDirectApi}
              className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Test API
            </button>
          </div>
        </div>
        
        {/* Debug info panel */}
        {debugInfo && (
          <div className="mt-4 p-3 border border-blue-200 bg-blue-50 rounded text-xs">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Debug Information</h3>
              <button
                onClick={() => setDebugInfo(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <pre className="mt-2 overflow-auto max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-100 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-blue-700">-</p>
            <p className="text-sm text-blue-600">Total Users</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-green-700">-</p>
            <p className="text-sm text-green-600">Active Walks</p>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg text-center">
            <p className="text-3xl font-bold text-purple-700">-</p>
            <p className="text-sm text-purple-600">Daily Revenue</p>
          </div>
        </div>
      </div>
    );
  }

  logger.info('SummaryWidget - Rendering with data:', {
    totalUsers: stats?.totalUsers,
    activeWalks: stats?.activeWalks,
    dailyRevenue: stats?.revenue?.daily
  });

  return (
    <div className="h-full w-full p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard Summary</h2>
        <div className="flex space-x-2">
          <button 
            onClick={handleRetry}
            className="px-3 py-1 bg-gray-100 text-xs rounded hover:bg-gray-200"
          >
            Refresh
          </button>
          <button
            onClick={testDirectApi}
            className="px-3 py-1 bg-blue-100 text-xs rounded hover:bg-blue-200"
          >
            Debug
          </button>
        </div>
      </div>
      
      {/* Debug info panel */}
      {debugInfo && (
        <div className="mb-4 p-3 border border-blue-200 bg-blue-50 rounded text-xs">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Debug Information</h3>
            <button
              onClick={() => setDebugInfo(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <pre className="mt-2 overflow-auto max-h-40">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-100 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold text-blue-700">{stats?.totalUsers || 0}</p>
          <p className="text-sm text-blue-600">Total Users</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold text-green-700">{stats?.activeWalks || 0}</p>
          <p className="text-sm text-green-600">Active Walks</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg text-center">
          <p className="text-3xl font-bold text-purple-700">
            £{(stats?.revenue?.daily || 0).toFixed(2)}
          </p>
          <p className="text-sm text-purple-600">Daily Revenue</p>
        </div>
      </div>
    </div>
  );
} 