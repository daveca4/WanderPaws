/**
 * Standardized hooks for walker dashboard data fetching using the consistent data fetching pattern
 */

import { useFetchData, useDataMutation } from './useDataFetching';
import { queryKeys } from '../queryClient';
import { Walker, Dog, Walk, Assessment, HolidayRequest } from '../types';
import { useAuth } from '../auth/AuthContext';
import { useQueryClient } from 'react-query';

/**
 * Hook to fetch walker profile
 */
export function useWalkerProfile() {
  const { user } = useAuth();
  
  return useFetchData<Walker>(
    `/data/walkers/${user?.profileId || ''}`,
    queryKeys.walkers.byId(user?.profileId || ''),
    {
      enabled: !!user?.profileId,
      requireRole: 'walker',
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Hook to fetch walker's assigned dogs
 */
export function useWalkerDogs() {
  const { user } = useAuth();
  
  return useFetchData<Dog[]>(
    `/data/walkers/${user?.profileId || ''}/dogs`,
    queryKeys.dogs.byWalker(user?.profileId || ''),
    {
      enabled: !!user?.profileId,
      requireRole: 'walker',
      staleTime: 10 * 1000, // 10 seconds
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: 2
    }
  );
}

/**
 * Hook to fetch walker's upcoming walks
 */
export function useWalkerUpcomingWalks() {
  const { user } = useAuth();
  
  return useFetchData<Walk[]>(
    `/data/walkers/${user?.profileId || ''}/walks/upcoming`,
    queryKeys.walks.upcoming(user?.profileId),
    {
      enabled: !!user?.profileId,
      requireRole: 'walker',
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
      refetchOnWindowFocus: true,
      retry: 2
    }
  );
}

/**
 * Hook to fetch walker's completed walks
 */
export function useWalkerCompletedWalks() {
  const { user } = useAuth();
  
  return useFetchData<Walk[]>(
    `/data/walkers/${user?.profileId || ''}/walks/completed`,
    queryKeys.walks.completed(user?.profileId),
    {
      enabled: !!user?.profileId,
      requireRole: 'walker',
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2
    }
  );
}

/**
 * Hook to fetch walker's pending assessments
 */
export function useWalkerPendingAssessments() {
  const { user } = useAuth();
  
  return useFetchData<Assessment[]>(
    `/data/walkers/${user?.profileId || ''}/assessments/pending`,
    queryKeys.assessments.byWalker(user?.profileId),
    {
      enabled: !!user?.profileId,
      requireRole: 'walker',
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2
    }
  );
}

/**
 * Hook to update walker profile
 */
export function useUpdateWalkerProfile() {
  const { user } = useAuth();
  
  return useDataMutation<Walker, Partial<Walker>>(
    `/data/walkers/${user?.profileId || ''}/update`,
    'put',
    {
      requireRole: 'walker',
      onSuccessQueryKey: queryKeys.walkers.byId(user?.profileId || '')
    }
  );
}

/**
 * Hook to update walk status
 */
export function useUpdateWalkStatus() {
  return useDataMutation<
    Walk, 
    { walkId: string; status: string; notes?: string }
  >(
    '/walks/update-status',
    'post',
    {
      requireRole: 'walker',
      onSuccessQueryKey: queryKeys.walks.all()
    }
  );
}

/**
 * Hook to complete a walk
 */
export function useCompleteWalk() {
  return useDataMutation<
    Walk, 
    { 
      walkId: string; 
      endTime: string; 
      route?: any;
      distance?: number;
      duration?: number;
      notes?: string;
    }
  >(
    '/walks/complete',
    'post',
    {
      requireRole: 'walker',
      onSuccessQueryKey: [
        queryKeys.walks.all(),
        queryKeys.walks.upcoming(''),
        queryKeys.walks.completed('')
      ] 
    }
  );
}

/**
 * Hook to submit assessment
 */
export function useSubmitAssessment() {
  return useDataMutation<
    Assessment, 
    { 
      assessmentId: string; 
      result: string;
      resultNotes: string;
      dogId: string;
      ownerId: string;
    }
  >(
    '/assessments/submit',
    'post',
    {
      requireRole: 'walker',
      onSuccessQueryKey: queryKeys.assessments.all()
    }
  );
}

/**
 * Response type for walker schedule
 */
export interface WalkerScheduleResponse {
  walks: Walk[];
  // Add other potential schedule data like total count if API provides it
}

/**
 * Hook to fetch walker schedule for a given period
 */
export function useWalkerSchedule(walkerId: string, startDate?: string, endDate?: string) {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  // Add walkerId to query params if needed by the API endpoint
  // queryParams.append('walkerId', walkerId); 

  const filters = { walkerId, startDate, endDate };

  return useFetchData<WalkerScheduleResponse>(
    // Assuming API endpoint like /walkers/:walkerId/schedule or /data/walks
    // Adjust endpoint as necessary. Using /data/walks with filters for now.
    `/data/walks?walkerId=${walkerId}&${queryParams.toString()}`,
    queryKeys.walkers.schedule(filters), // Corrected to queryKeys.walkers
    {
      enabled: !!walkerId, // Only fetch if walkerId is available
      requireRole: 'walker', // Or potentially 'admin' if admins can view walker schedules
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Add select function if API returns data differently (e.g., just Walk[])
      select: (data: any): WalkerScheduleResponse => {
        if (Array.isArray(data)) {
          return { walks: data as Walk[] }; // Adapt if API just returns array
        }
        return data as WalkerScheduleResponse; // Assume { walks: [...] }
      }
    }
  );
}

/**
 * Hook to fetch walker holiday requests
 */
export function useWalkerHolidayRequests(walkerId: string) {
  return useFetchData<HolidayRequest[]>(
    `/holiday-requests?walkerId=${walkerId}`, // Assuming API endpoint structure
    queryKeys.walkers.holidayRequests({ walkerId }),
    {
      enabled: !!walkerId,
      requireRole: 'walker',
      staleTime: 5 * 60 * 1000,
      select: (data: unknown): HolidayRequest[] => { // Explicitly returns HolidayRequest[]
         if (Array.isArray(data)) {
           return data as HolidayRequest[];
         }
         // Also handle the case where the API might return { requests: [...] }
         if (data && typeof data === 'object' && 'requests' in data && Array.isArray(data.requests)) {
           return data.requests as HolidayRequest[];
         }
         console.warn('Unexpected data structure for holiday requests', data);
         return []; // Always return an array
      }
    }
  );
}

/**
 * Hook to submit a holiday request
 */
export function useSubmitHolidayRequest() {
  const queryClient = useQueryClient();
  return useDataMutation<HolidayRequest, { date: string; reason: string; walkerId: string }>(
    `/holiday-requests`,
    'post',
    {
      requireRole: 'walker',
      // Use onSuccessCallback for custom invalidation logic
      onSuccessCallback: (data, variables) => {
        queryClient.invalidateQueries({
           queryKey: queryKeys.walkers.holidayRequests({ walkerId: variables.walkerId })
        });
      },
      // No need for onErrorCallback if default handling is sufficient
    }
  );
}

/**
 * Hook to cancel a holiday request
 */
export function useCancelHolidayRequest() {
  const queryClient = useQueryClient();
  return useDataMutation<any, { requestId: string; walkerId: string }>(
    `/holiday-requests/:requestId`,
    'delete',
    {
      requireRole: 'walker',
      // Use onSuccessCallback for custom invalidation logic
       onSuccessCallback: (data, variables) => {
         queryClient.invalidateQueries({
            queryKey: queryKeys.walkers.holidayRequests({ walkerId: variables.walkerId })
         });
      },
       // No need for onErrorCallback if default handling is sufficient
    }
  );
}

// Add other walker-specific hooks below (holiday requests, etc.) 