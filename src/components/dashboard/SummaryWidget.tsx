import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthContext';

export function SummaryWidget() {
  const { user } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  
  // Debug user auth state
  useEffect(() => {
    console.log('SummaryWidget - Current User:', {
      userId: user?.id, 
      role: user?.role,
      profileId: user?.profileId
    });
  }, [user]);
  
  const { data: stats, isLoading, error, isError, refetch } = useQuery({
    queryKey: ['adminDashboardStats', retryCount],
    queryFn: async () => {
      try {
        if (!user || user.role !== 'admin') {
          throw new Error('Only admin users can access dashboard stats');
        }
        
        // Ensure proper headers for admin authentication
        const headers: Record<string, string> = {};
        
        if (user.id) headers['user-id'] = user.id;
        if (user.role) headers['user-role'] = user.role;
        if (user.profileId) headers['user-profile-id'] = user.profileId;
        
        console.log('SummaryWidget - Sending request with headers:', headers);
        
        const response = await apiClient.get('/admin/dashboard', { headers });
        console.log('SummaryWidget - Dashboard API response:', response);
        
        if (response.status === 401) {
          throw new Error('Unauthorized: Only admins can access dashboard stats');
        }
        
        if (!response.ok) {
          throw new Error(response.error || 'Failed to fetch dashboard data');
        }
        
        console.log('SummaryWidget - Parsed data:', response.data);
        return response.data;
      } catch (err) {
        console.error('SummaryWidget - Error fetching dashboard stats:', err);
        throw err;
      }
    },
    enabled: !!user && user.role === 'admin',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Debug data state
  useEffect(() => {
    console.log('SummaryWidget - Stats data updated:', stats);
  }, [stats]);

  // Fetch data when user is available
  useEffect(() => {
    if (user && user.role === 'admin') {
      console.log('SummaryWidget - Triggering refetch with user:', user.id);
      refetch();
    }
  }, [user, refetch]);

  const handleRetry = () => {
    console.log('SummaryWidget - Manual retry triggered');
    setRetryCount(prev => prev + 1);
  };

  if (isLoading) {
    console.log('SummaryWidget - Loading state');
    return (
      <div className="h-full w-full p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isError || !stats) {
    console.log('SummaryWidget - Error state:', { error, stats });
    return (
      <div className="h-full w-full p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Summary</h2>
        <div className="bg-red-50 p-4 rounded-lg mb-4">
          <p className="text-red-700">Unable to load dashboard data</p>
          <p className="text-sm text-red-600 mt-1">
            {error instanceof Error ? error.message : 'Database error occurred'}
          </p>
          <button 
            onClick={handleRetry}
            className="mt-3 px-4 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
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

  console.log('SummaryWidget - Rendering with data:', {
    totalUsers: stats?.totalUsers,
    activeWalks: stats?.activeWalks,
    dailyRevenue: stats?.revenue?.daily
  });

  return (
    <div className="h-full w-full p-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Summary</h2>
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