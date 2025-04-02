import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../AuthContext';
import { api } from '../api/client';
import { queryKeys } from '../queryClient';
import { User, Walker, Owner, Dog, Walk, Assessment, UserSubscription } from '../types';

// Admin dashboard overview stats
export function useAdminDashboardStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: async () => {
      // Only admins should be able to access this data
      if (user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const response = await api.get<{
        totalUsers: number;
        totalWalks: number;
        totalDogs: number;
        pendingAssessments: number;
        recentSignups: number;
        activeWalks: number;
        revenue: { 
          daily: number;
          weekly: number;
          monthly: number;
          total: number;
        }
      }>('/api/admin/dashboard');
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch admin dashboard data');
      }
      
      return response.data;
    },
    enabled: user?.role === 'admin',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch all users for admin
export function useAllUsers(page = 1, limit = 50, filters?: Record<string, any>) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['users', 'all', page, limit, filters],
    queryFn: async () => {
      if (user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const response = await api.get<{
        users: User[];
        total: number;
        page: number;
        limit: number;
      }>(`/api/admin/users?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch users');
      }
      
      return response.data;
    },
    enabled: user?.role === 'admin',
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
  });
}

// Fetch all walkers for admin
export function useAllWalkers(page = 1, limit = 20) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['walkers', 'all', page, limit],
    queryFn: async () => {
      if (user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const response = await api.get<{
        walkers: Walker[];
        total: number;
        page: number;
        limit: number;
      }>(`/api/admin/walkers?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch walkers');
      }
      
      return response.data;
    },
    enabled: user?.role === 'admin',
    placeholderData: (previousData) => previousData
  });
}

// Fetch all owners for admin
export function useAllOwners(page = 1, limit = 20) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['owners', 'all', page, limit],
    queryFn: async () => {
      if (user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const response = await api.get<{
        owners: Owner[];
        total: number;
        page: number;
        limit: number;
      }>(`/api/admin/owners?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch owners');
      }
      
      return response.data;
    },
    enabled: user?.role === 'admin',
    placeholderData: (previousData) => previousData
  });
}

// Fetch all walks with filters
export function useAdminWalks(
  page = 1, 
  limit = 20, 
  filters?: { 
    status?: string; 
    walkerId?: string; 
    dogId?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['admin', 'walks', page, limit, filters],
    queryFn: async () => {
      if (user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            queryParams.append(key, value);
          }
        });
      }
      
      const response = await api.get<{
        walks: Walk[];
        total: number;
        page: number;
        limit: number;
      }>(`/api/admin/walks?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch walks');
      }
      
      return response.data;
    },
    enabled: user?.role === 'admin',
    placeholderData: (previousData) => previousData
  });
}

// Fetch pending assessments for admin review
export function useAdminPendingAssessments() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.assessments.pending(),
    queryFn: async () => {
      if (user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const response = await api.get<Assessment[]>('/api/admin/assessments/pending');
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch pending assessments');
      }
      
      return response.data;
    },
    enabled: user?.role === 'admin',
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  });
}

// Update user role
export function useUpdateUserRole() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'owner' | 'walker' }) => {
      if (user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const response = await api.patch<User>(`/api/admin/users/${userId}/role`, { role });
      
      if (!response.ok) {
        throw new Error(response.error || `Failed to update user role to ${role}`);
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
}

// Admin review assessment
export function useReviewAssessment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      assessmentId, 
      status, 
      feedback 
    }: { 
      assessmentId: string; 
      status: 'approved' | 'denied'; 
      feedback?: string;
    }) => {
      if (user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const response = await api.patch<Assessment>(`/api/admin/assessments/${assessmentId}/review`, {
        status,
        feedback
      });
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to review assessment');
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.pending() });
    }
  });
}

// Admin analytics
export function useAdminAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...queryKeys.admin.analytics(), period],
    queryFn: async () => {
      if (user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const response = await api.get<{
        walksByDate: Record<string, number>;
        revenue: Record<string, number>;
        newUsers: Record<string, number>;
        walkerActivity: Record<string, number>;
        dogsByBreed: Record<string, number>;
        walkCompletion: { completed: number; cancelled: number; pending: number };
      }>(`/api/admin/analytics?period=${period}`);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch analytics data');
      }
      
      return response.data;
    },
    enabled: user?.role === 'admin',
    staleTime: 60 * 60 * 1000 // 1 hour
  });
}

// Fetch subscription analytics
export function useSubscriptionAnalytics() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['admin', 'subscriptions', 'analytics'],
    queryFn: async () => {
      if (user?.role !== 'admin') {
        throw new Error('Unauthorized');
      }
      
      const response = await api.get<{
        totalSubscriptions: number;
        activeSubscriptions: number;
        revenue: {
          total: number;
          monthly: number;
        };
        byPlan: Record<string, number>;
        conversionRate: number;
      }>('/api/admin/subscriptions/analytics');
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch subscription analytics');
      }
      
      return response.data;
    },
    enabled: user?.role === 'admin',
    staleTime: 60 * 60 * 1000 // 1 hour
  });
} 