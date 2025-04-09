/**
 * Standardized hooks for admin dashboard data fetching using the consistent data fetching pattern
 */

import { useFetchData, useDataMutation } from './useDataFetching';
import { queryKeys } from '../queryClient';
import { User, Walker, Owner, Dog, Walk, Assessment, UserSubscription } from '../types';

/**
 * Admin dashboard statistics type definition
 */
export interface AdminDashboardStats {
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
  };
}

/**
 * Hook to fetch admin dashboard statistics
 */
export function useAdminDashboardStats() {
  return useFetchData<AdminDashboardStats>(
    '/admin/dashboard',
    queryKeys.admin.dashboard(),
    {
      requireRole: 'admin',
      staleTime: 10 * 1000, // 10 seconds
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: 2
    }
  );
}

/**
 * Response type for users listing
 */
export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Hook to fetch all users for admin
 */
export function useAdminUsers(page = 1, limit = 50, filters?: Record<string, any>) {
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
  
  // Combine filters with page and limit for the query key
  const queryFilter = { page, limit, ...filters };
  
  return useFetchData<UserListResponse>(
    `/admin/users?${queryParams.toString()}`,
    queryKeys.admin.users(queryFilter),
    {
      requireRole: 'admin',
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );
}

/**
 * Response type for walkers listing
 */
export interface WalkerListResponse {
  walkers: Walker[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Hook to fetch all walkers for admin
 */
export function useAdminWalkers(page = 1, limit = 20) {
  return useFetchData<WalkerListResponse>(
    `/admin/walkers?page=${page}&limit=${limit}`,
    queryKeys.admin.walkers({ page, limit }),
    {
      requireRole: 'admin',
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2
    }
  );
}

/**
 * Response type for owners listing
 */
export interface OwnerListResponse {
  owners: Owner[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Hook to fetch all owners for admin
 */
export function useAdminOwners(page = 1, limit = 20) {
  return useFetchData<OwnerListResponse>(
    `/admin/owners?page=${page}&limit=${limit}`,
    queryKeys.admin.owners({ page, limit }),
    {
      requireRole: 'admin',
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2
    }
  );
}

/**
 * Hook to fetch pending assessments for admin
 */
export function useAdminPendingAssessments() {
  return useFetchData<Assessment[]>(
    '/data/assessments?status=pending',
    queryKeys.admin.pendingAssessments(),
    {
      requireRole: 'admin',
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      select: (data: unknown): Assessment[] => {
        if (Array.isArray(data)) {
          return data as Assessment[];
        }
        if (data && typeof data === 'object' && 'assessments' in data && Array.isArray(data.assessments)) {
          return data.assessments as Assessment[];
        }
        console.warn('Unexpected data structure received for pending assessments:', data);
        return [];
      }
    }
  );
}

/**
 * Hook to fetch all walks for admin
 */
export function useAdminWalks(page = 1, limit = 20, status?: string) {
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  if (status) queryParams.append('status', status);
  
  // Create filters object for query key
  const filters = { page, limit };
  if (status) (filters as any).status = status;
  
  return useFetchData<{
    walks: Walk[];
    total: number;
    page: number;
    limit: number;
  }>(
    `/admin/walks?${queryParams.toString()}`,
    queryKeys.admin.walks(filters),
    {
      requireRole: 'admin',
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2
    }
  );
}

/**
 * Hook to update a user's role
 */
export function useUpdateUserRole() {
  return useDataMutation<User, { userId: string; newRole: string }>(
    '/admin/users/:userId/role',
    'put',
    {
      onSuccessQueryKey: queryKeys.admin.users()
    }
  );
}

/**
 * Hook to review an assessment
 */
export function useReviewAssessment() {
  return useDataMutation<
    Assessment,
    { assessmentId: string; status: 'approved' | 'rejected'; notes?: string; walkerId?: string }
  >(
    '/admin/assessments/:assessmentId/review',
    'post',
    {
      onSuccessQueryKey: queryKeys.admin.pendingAssessments()
    }
  );
}

/**
 * Hook to fetch all dogs for admin
 */
export function useAdminDogs(page = 1, limit = 20, filters?: { 
  breedFilter?: string;
  sizeFilter?: string;
  statusFilter?: string;
  ownerId?: string;
}) {
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
  
  return useFetchData<{
    dogs: Dog[];
    total: number;
    page: number;
    limit: number;
  }>(
    `/admin/dogs?${queryParams.toString()}`,
    queryKeys.admin.dogs({ page, limit, ...filters }),
    {
      requireRole: 'admin',
      staleTime: 10 * 1000, // 10 seconds
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: 2
    }
  );
}

/**
 * Response type for assessments listing
 */
export interface AssessmentListResponse {
  assessments: Assessment[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Hook to fetch assessments for admin (with filters)
 */
export function useAdminAssessments(page = 1, limit = 15, filters?: { 
  status?: string | string[];
  search?: string;
  dogId?: string;
  ownerId?: string;
  walkerId?: string;
}) {
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          // Handle array values (e.g., multiple statuses)
          value.forEach(item => queryParams.append(key, item));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
  }
  
  return useFetchData<AssessmentListResponse>(
    // Assuming the API endpoint is /admin/assessments or similar
    `/admin/assessments?${queryParams.toString()}`,
    queryKeys.admin.assessments({ page, limit, ...filters }), // Need to add queryKeys.admin.assessments
    {
      requireRole: 'admin',
      staleTime: 30 * 1000, // 30 seconds
      retry: 2
      // Add select function if API might return nested data
    }
  );
} 