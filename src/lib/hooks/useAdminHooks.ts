import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import apiClient from '../api/client';
import { queryKeys } from '../queryClient';
import { User, Walker, Owner, Dog, Walk, Assessment, UserSubscription } from '../types';
import { processApiResponseData, logApiResponse } from '../utils/dataUtils';

// Admin dashboard overview stats
export function useAdminDashboardStats() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: async () => {
      // Only admins should be able to access this data
      if (!user) {
        console.error('AdminDashboardStats - User not found');
        throw new Error('User not authenticated');
      }
      
      if (user.role !== 'admin') {
        console.error('AdminDashboardStats - Unauthorized: Only admins can access dashboard stats', { 
          userId: user.id, 
          role: user.role,
          isAdmin: user.role === 'admin'
        });
        throw new Error('Unauthorized');
      }
      
      console.log('AdminDashboardStats - Fetching stats as admin:', {
        userId: user.id,
        role: user.role,
        profileId: user.profileId
      });
      
      // Prepare headers
      const headers: Record<string, string> = {};
      if (user.id) headers['user-id'] = user.id;
      if (user.role) headers['user-role'] = user.role;
      if (user.profileId) headers['user-profile-id'] = user.profileId;
      
      console.log('AdminDashboardStats - Request headers:', headers);
      
      try {
        const response = await apiClient.get('/admin/dashboard', { headers });
        
        console.log('AdminDashboardStats - API response:', {
          ok: response.ok,
          status: response.status,
          error: response.error,
          dataKeys: response.data ? Object.keys(response.data) : []
        });
        
        if (!response.ok) {
          throw new Error(response.error || 'Failed to fetch dashboard stats');
        }
        
        return response.data;
      } catch (error) {
        console.error('AdminDashboardStats - Fetch error:', error);
        throw error;
      }
    },
    enabled: user?.role === 'admin',
    staleTime: 10 * 1000, // 10 seconds
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnMount: true
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
      
      const response = await apiClient.get<{
        users: User[];
        total: number;
        page: number;
        limit: number;
      }>(`/admin/users?${queryParams.toString()}`);
      
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
        console.error('Unauthorized: Only admins can access all walkers', { user });
        return { walkers: [], total: 0, page, limit };
      }
      
      console.log('🚶‍♂️ Fetching all walkers for admin, page:', page, 'limit:', limit);
      
      try {
        // Try the data API endpoint first
        try {
          console.log('🔍 Trying data API endpoint...');
          const response = await apiClient.get(`/api/data/walkers?page=${page}&limit=${limit}`);
          console.log('✅ Response from data API:', response);
          
          if (response.ok) {
            // Handle different response structures
            let walkers = [];
            let total = 0;
            
            if (Array.isArray(response.data)) {
              walkers = response.data;
              total = response.data.length;
            } else if (response.data && typeof response.data === 'object') {
              if (response.data.walkers && Array.isArray(response.data.walkers)) {
                walkers = response.data.walkers;
                total = response.data.total || walkers.length;
              } else if (response.data.data && Array.isArray(response.data.data)) {
                walkers = response.data.data;
                total = response.data.total || walkers.length;
              } else {
                walkers = response.data;
                total = walkers.length;
              }
            }
            
            console.log('✅ Found walkers via data API:', walkers.length);
            return { walkers, total, page, limit };
          }
        } catch (dataApiError) {
          console.warn('❌ Error fetching from data API:', dataApiError);
        }
        
        // Fall back to the admin API endpoint
        console.log('🔍 Trying admin API endpoint...');
        const adminResponse = await apiClient.get(`/admin/walkers?page=${page}&limit=${limit}`);
        console.log('✅ Response from admin API:', adminResponse);
        
        if (!adminResponse.ok) {
          throw new Error(adminResponse.error || 'Failed to fetch walkers');
        }
        
        // Handle different response structures
        let walkers = [];
        let total = 0;
        
        if (Array.isArray(adminResponse.data)) {
          walkers = adminResponse.data;
          total = adminResponse.data.length;
        } else if (adminResponse.data && typeof adminResponse.data === 'object') {
          if (adminResponse.data.walkers && Array.isArray(adminResponse.data.walkers)) {
            walkers = adminResponse.data.walkers;
            total = adminResponse.data.total || walkers.length;
          } else if (adminResponse.data.data && Array.isArray(adminResponse.data.data)) {
            walkers = adminResponse.data.data;
            total = adminResponse.data.total || walkers.length;
          } else {
            walkers = adminResponse.data;
            total = walkers.length;
          }
        }
        
        console.log('✅ Found walkers via admin API:', walkers.length, 'total:', total);
        return { walkers, total, page, limit };
      } catch (error) {
        console.error('❌ Error fetching all walkers:', error);
        // Return empty array instead of throwing to avoid breaking the UI
        return { walkers: [], total: 0, page, limit };
      }
    },
    enabled: user?.role === 'admin',
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
    retry: 2,
  });
}

// Fetch all owners for admin
export function useAllOwners(page = 1, limit = 20) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['owners', 'all', page, limit],
    queryFn: async () => {
      if (user?.role !== 'admin') {
        console.error('Unauthorized: Only admins can access all owners', { user });
        return { owners: [], total: 0, page, limit };
      }
      
      console.log('👤 Fetching all owners for admin, page:', page, 'limit:', limit);
      
      try {
        // Try the data API endpoint first
        try {
          console.log('🔍 Trying data API endpoint...');
          const response = await apiClient.get(`/api/data/owners?page=${page}&limit=${limit}`);
          console.log('✅ Response from data API:', response);
          
          if (response.ok) {
            // Handle different response structures
            let owners = [];
            let total = 0;
            
            if (Array.isArray(response.data)) {
              owners = response.data;
              total = response.data.length;
            } else if (response.data && typeof response.data === 'object') {
              if (response.data.owners && Array.isArray(response.data.owners)) {
                owners = response.data.owners;
                total = response.data.total || owners.length;
              } else if (response.data.data && Array.isArray(response.data.data)) {
                owners = response.data.data;
                total = response.data.total || owners.length;
              } else {
                owners = response.data;
                total = owners.length;
              }
            }
            
            console.log('✅ Found owners via data API:', owners.length);
            return { owners, total, page, limit };
          }
        } catch (dataApiError) {
          console.warn('❌ Error fetching from data API:', dataApiError);
        }
        
        // Fall back to the admin API endpoint
        console.log('🔍 Trying admin API endpoint...');
        const adminResponse = await apiClient.get(`/admin/owners?page=${page}&limit=${limit}`);
        console.log('✅ Response from admin API:', adminResponse);
        
        if (!adminResponse.ok) {
          throw new Error(adminResponse.error || 'Failed to fetch owners');
        }
        
        // Handle different response structures
        let owners = [];
        let total = 0;
        
        if (Array.isArray(adminResponse.data)) {
          owners = adminResponse.data;
          total = adminResponse.data.length;
        } else if (adminResponse.data && typeof adminResponse.data === 'object') {
          if (adminResponse.data.owners && Array.isArray(adminResponse.data.owners)) {
            owners = adminResponse.data.owners;
            total = adminResponse.data.total || owners.length;
          } else if (adminResponse.data.data && Array.isArray(adminResponse.data.data)) {
            owners = adminResponse.data.data;
            total = adminResponse.data.total || owners.length;
          } else {
            owners = adminResponse.data;
            total = owners.length;
          }
        }
        
        console.log('✅ Found owners via admin API:', owners.length, 'total:', total);
        return { owners, total, page, limit };
      } catch (error) {
        console.error('❌ Error fetching all owners:', error);
        // Return empty array instead of throwing to avoid breaking the UI
        return { owners: [], total: 0, page, limit };
      }
    },
    enabled: user?.role === 'admin',
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
    retry: 2,
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
      
      const response = await apiClient.get<{
        walks: Walk[];
        total: number;
        page: number;
        limit: number;
      }>(`/admin/walks?${queryParams.toString()}`);
      
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
    queryKey: queryKeys.admin.pendingAssessments(),
    queryFn: async () => {
      if (user?.role !== 'admin') {
        console.error('Unauthorized: Only admins can access pending assessments', { user });
        throw new Error('Unauthorized: Only admins can access pending assessments');
      }
      
      console.log('🔍 Fetching pending assessments for admin review', { userId: user?.id, role: user?.role });
      
      // Create headers with authentication information
      const headers: Record<string, string> = {};
      if (user?.id) headers['user-id'] = user.id;
      if (user?.role) headers['user-role'] = user.role;
      if (user?.profileId) headers['user-profile-id'] = user.profileId;
      
      try {
        console.log('🔍 Trying data API endpoint for assessments...');
        const response = await apiClient.get('/api/data/assessments?status=ready_for_review', { headers });
        
        if (response.ok) {
          const assessments = processApiResponseData<Assessment>(response.data, 'assessments');
          console.log('✅ Found pending assessments via data API:', assessments.length);
          return assessments;
        }
        
        console.log('🔍 Trying with pending status...');
        const pendingResponse = await apiClient.get('/api/data/assessments?status=pending', { headers });
        
        if (pendingResponse.ok) {
          const assessments = processApiResponseData<Assessment>(pendingResponse.data, 'assessments');
          console.log('✅ Found pending assessments via pending status:', assessments.length);
          return assessments;
        }
        
        console.log('🔍 Trying admin API endpoint...');
        const adminResponse = await apiClient.get('/admin/assessments/pending', { headers });
        
        if (!adminResponse.ok) {
          throw new Error(adminResponse.error || 'Failed to fetch pending assessments');
        }
        
        const assessments = processApiResponseData<Assessment>(adminResponse.data, 'assessments');
        console.log('✅ Found pending assessments via admin API:', assessments.length);
        return assessments;
      } catch (error) {
        console.error('❌ Error fetching admin pending assessments:', error);
        throw error;
      }
    },
    enabled: user?.role === 'admin',
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
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
      
      const response = await apiClient.patch<User>(`/admin/users/${userId}/role`, { role });
      
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
      
      const response = await apiClient.patch<Assessment>(`/admin/assessments/${assessmentId}/review`, {
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
      
      const response = await apiClient.get<{
        walksByDate: Record<string, number>;
        revenue: Record<string, number>;
        newUsers: Record<string, number>;
        walkerActivity: Record<string, number>;
        dogsByBreed: Record<string, number>;
        walkCompletion: { completed: number; cancelled: number; pending: number };
      }>(`/admin/analytics?period=${period}`);
      
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
      
      const response = await apiClient.get<{
        totalSubscriptions: number;
        activeSubscriptions: number;
        revenue: {
          total: number;
          monthly: number;
        };
        byPlan: Record<string, number>;
        conversionRate: number;
      }>('/admin/subscriptions/analytics');
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch subscription analytics');
      }
      
      return response.data;
    },
    enabled: user?.role === 'admin',
    staleTime: 60 * 60 * 1000 // 1 hour
  });
}

// Fetch all dogs for admin
export function useAdminDogs(page = 1, limit = 20, filters?: { 
  status?: string; 
  ownerId?: string;
  breedFilter?: string;
  sizeFilter?: string;
  ageFilter?: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: queryKeys.admin.dogs({ page, limit, ...filters }),
    queryFn: async () => {
      if (!user) {
        console.error('AdminDogs - User not found');
        return { dogs: [], total: 0, page, limit };
      }
      
      if (user.role !== 'admin') {
        console.error('AdminDogs - Unauthorized: Only admins can access all dogs', { 
          userId: user.id, 
          role: user.role 
        });
        return { dogs: [], total: 0, page, limit };
      }
      
      console.log('AdminDogs - Fetching as admin:', {
        userId: user.id,
        role: user.role,
        page,
        limit,
        filters
      });
      
      try {
        // Prepare query parameters
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
        
        // Prepare headers
        const headers: Record<string, string> = {};
        if (user.id) headers['user-id'] = user.id;
        if (user.role) headers['user-role'] = user.role;
        if (user.profileId) headers['user-profile-id'] = user.profileId;
        
        console.log('AdminDogs - Request headers:', headers);
        
        // Try the direct admin API endpoint
        console.log('AdminDogs - Fetching from admin API endpoint...');
        const adminResponse = await apiClient.get(`/admin/dogs?${queryParams.toString()}`, { headers });
        
        console.log('AdminDogs - API response:', {
          ok: adminResponse.ok,
          status: adminResponse.status,
          error: adminResponse.error,
          dataKeys: adminResponse.data ? Object.keys(adminResponse.data) : []
        });
        
        if (!adminResponse.ok) {
          throw new Error(adminResponse.error || 'Failed to fetch dogs');
        }
        
        const dogsData = adminResponse.data || {};
        const dogs = dogsData.dogs || [];
        const total = dogs.length;
        
        console.log('AdminDogs - Fetched dogs:', {
          count: dogs.length,
          firstDog: dogs.length > 0 ? { 
            id: dogs[0].id,
            name: dogs[0].name
          } : null
        });
        
        return { dogs, total, page, limit };
      } catch (error) {
        console.error('AdminDogs - Error fetching dogs:', error);
        // Return empty array instead of throwing to avoid breaking the UI
        return { dogs: [], total: 0, page, limit };
      }
    },
    enabled: !!user && user.role === 'admin',
    staleTime: 10 * 1000, // 10 seconds
    placeholderData: (previousData) => previousData,
    retry: 2,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
} 