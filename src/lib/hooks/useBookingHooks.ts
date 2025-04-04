import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import apiClient from '../api/client';
import { queryKeys } from '../queryClient';
import { Walk } from '../types';

// Define interfaces for API responses
interface WalkResponse {
  id: string;
  dogId: string;
  walkerId: string;
  status: string;
  startTime: string;
  endTime: string;
  notes?: string;
  feedback?: {
    rating: number;
    comment?: string;
  };
}

// Interface for availability data
export interface DayAvailability {
  morning?: {
    available: boolean;
    start?: string;
    end?: string;
  };
  afternoon?: {
    available: boolean;
    start?: string;
    end?: string;
  };
  evening?: {
    available: boolean;
    start?: string;
    end?: string;
  };
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

// Hook to get availability for a specific dog on a specific date
export function useDogAvailability(dogId: string, date: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.walks.availability(dogId, date),
    queryFn: async () => {
      if (!dogId || !date) return null;
      
      const response = await apiClient.get<{
        availability: DayAvailability;
        walkerName?: string;
      }>(`/walks/availability?dogId=${dogId}&date=${date}`);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch availability');
      }
      
      return response.data;
    },
    enabled: !!dogId && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get availability range for a dog over multiple dates
export function useDogAvailabilityRange(dogId: string, range: DateRange) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['walks', 'availability', 'range', dogId, range.startDate, range.endDate],
    queryFn: async () => {
      if (!dogId || !range.startDate || !range.endDate) return null;
      
      const response = await apiClient.get<{
        availability: Record<string, DayAvailability>;
        walkerName?: string;
      }>(`/walks/availability/range?dogId=${dogId}&startDate=${range.startDate}&endDate=${range.endDate}`);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch availability range');
      }
      
      return response.data;
    },
    enabled: !!dogId && !!range.startDate && !!range.endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Interface for creating a booking
export interface CreateBookingInput {
  dogId: string;
  date: string;
  timeSlot: string;
  notes?: string;
  isRecurring?: boolean;
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  endDate?: string;
}

// Hook for creating a booking
export function useCreateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bookingData: CreateBookingInput) => {
      const response = await apiClient.post<Walk>('/walks', bookingData);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to create booking');
      }
      
      return response.data;
    },
    onSuccess: (data: Walk) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.byDog(data.dogId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.all() });
      
      // If we have walkerId, invalidate that too
      if (data.walkerId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.walks.byWalker(data.walkerId) });
      }
      
      // Invalidate all upcoming walks queries
      queryClient.invalidateQueries({ queryKey: ['walks', 'upcoming'] });
    }
  });
}

// Hook for getting upcoming walks (for showing in dashboard)
export function useUpcomingWalks() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.walks.upcoming(),
    queryFn: async () => {
      if (!user) return [];
      
      const response = await apiClient.get<{ walks: Walk[] }>('/walks/upcoming');
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch upcoming walks');
      }
      
      return response.data.walks || [];
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook for getting walks for a specific dog
export function useDogWalks(dogId: string, status?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['walks', 'dog', dogId, status],
    queryFn: async () => {
      if (!dogId) return [];
      
      let url = `/dogs/${dogId}/walks`;
      if (status) {
        url += `?status=${status}`;
      }
      
      const response = await apiClient.get<WalkResponse[]>(url);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch dog walks');
      }
      
      return response.data;
    },
    enabled: !!dogId && !!user,
  });
}

// Hook for cancelling a walk
export function useCancelWalk() {
  const queryClient = useQueryClient();
  
  type CancelWalkContext = {
    previousWalks: Walk[];
  };
  
  return useMutation({
    mutationFn: async ({ walkId, reason }: { walkId: string; reason?: string }) => {
      const response = await apiClient.patch<Walk>(`/walks/${walkId}/cancel`, { reason });
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to cancel walk');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.upcoming() });
      
      if (data.dogId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.walks.byDog(data.dogId) });
      }
      
      if (data.walkerId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.walks.byWalker(data.walkerId) });
      }
    },
    onMutate: async ({ walkId }) => {
      // Cancel any outgoing refetch queries
      await queryClient.cancelQueries({ queryKey: queryKeys.walks.upcoming() });
      
      // Snapshot the previous value
      const previousWalks = queryClient.getQueryData<Walk[]>(queryKeys.walks.upcoming());
      
      // Update the data optimistically
      if (previousWalks) {
        queryClient.setQueryData<Walk[]>(
          queryKeys.walks.upcoming(),
          previousWalks.map(walk => 
            walk.id === walkId 
              ? { ...walk, status: 'cancelled' } 
              : walk
          )
        );
      }
      
      // Return a context object with the previous state
      return { previousWalks: previousWalks || [] };
    },
    onError: (err, variables, context) => {
      if (context?.previousWalks) {
        queryClient.setQueryData(queryKeys.walks.upcoming(), context.previousWalks);
      }
    }
  });
}

// Hook for rescheduling a walk
export function useRescheduleWalk() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ walkId, newDate, newTimeSlot }: { walkId: string; newDate: string; newTimeSlot: string }) => {
      const response = await apiClient.patch<Walk>(`/walks/${walkId}/reschedule`, {
        date: newDate,
        timeSlot: newTimeSlot
      });
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to reschedule walk');
      }
      
      return response.data;
    },
    onSuccess: (data: Walk) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.upcoming() });
      
      if (data.dogId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.walks.byDog(data.dogId) });
      }
      
      if (data.walkerId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.walks.byWalker(data.walkerId) });
      }
    }
  });
}

// Hook for getting walk details
export function useWalkDetails(walkId: string) {
  return useQuery({
    queryKey: queryKeys.walks.byId(walkId),
    queryFn: async () => {
      if (!walkId) throw new Error('Walk ID is required');
      
      const response = await apiClient.get<Walk>(`/walks/${walkId}`);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch walk details');
      }
      
      return response.data;
    },
    enabled: !!walkId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
} 