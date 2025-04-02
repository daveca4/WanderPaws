import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../AuthContext';
import { api } from '../api/client';
import { queryKeys } from '../queryClient';
import { Walker, Dog, Walk, Assessment } from '../types';

// Walker profile hooks
export function useWalkerProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: queryKeys.walkers.byId(user?.profileId || ''),
    queryFn: async () => {
      if (!user?.profileId) {
        return null;
      }
      
      const response = await api.get<Walker>(`/api/data/walkers/${user.profileId}`);
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch walker profile');
      }
      
      return response.data;
    },
    enabled: !!user?.profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Walker's assigned dogs
export function useWalkerDogs() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.dogs.byWalker(user?.profileId || ''),
    queryFn: async () => {
      if (!user?.profileId) {
        return [];
      }
      
      const response = await api.get<Dog[]>(`/api/walkers/${user.profileId}/dogs`);
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch assigned dogs');
      }
      
      console.log(`Found ${response.data.length} dogs assigned to walker ${user.profileId}`);
      return response.data;
    },
    enabled: !!user?.profileId,
    placeholderData: []
  });
}

// Fetch walker's upcoming walks
export function useWalkerUpcomingWalks() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.walks.upcoming(user?.profileId || ''),
    queryFn: async () => {
      if (!user?.profileId) {
        return [];
      }
      
      const response = await api.get<{ walks: Walk[] }>(`/api/walkers/${user.profileId}/walks/upcoming`);
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch upcoming walks');
      }
      
      return response.data.walks || [];
    },
    enabled: !!user?.profileId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Fetch walker's completed walks
export function useWalkerCompletedWalks() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.walks.completed(user?.profileId || ''),
    queryFn: async () => {
      if (!user?.profileId) {
        return [];
      }
      
      const response = await api.get<{ walks: Walk[] }>(`/api/walkers/${user.profileId}/walks/completed`);
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch completed walks');
      }
      
      return response.data.walks || [];
    },
    enabled: !!user?.profileId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch pending assessments
export function useWalkerPendingAssessments() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.assessments.byWalker(user?.profileId || ''),
    queryFn: async () => {
      if (!user?.profileId) {
        return [];
      }
      
      const response = await api.get<Assessment[]>(`/api/walkers/${user.profileId}/assessments/pending`);
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch pending assessments');
      }
      
      return response.data;
    },
    enabled: !!user?.profileId,
  });
}

// Update walker profile
export function useUpdateWalkerProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Walker>) => {
      if (!user?.profileId) {
        throw new Error('No walker profile ID available');
      }
      
      const response = await api.patch<Walker>(`/api/data/walkers/${user.profileId}`, data);
      if (!response.ok) {
        throw new Error(response.error || 'Failed to update walker profile');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.walkers.byId(data.id), data);
    }
  });
}

// Update walk status (start, complete, cancel)
export function useUpdateWalkStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ walkId, status, notes }: { walkId: string; status: string; notes?: string }) => {
      const response = await api.patch<Walk>(`/api/walks/${walkId}/status`, { 
        status, 
        notes 
      });
      
      if (!response.ok) {
        throw new Error(response.error || `Failed to update walk status to ${status}`);
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the walk in all queries that might have it
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.byId(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.upcoming() });
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.completed() });
      
      // Show success toast or notification
      console.log(`Walk ${variables.walkId} status updated to ${variables.status}`);
    }
  });
}

// Complete walk with optimistic update
export function useCompleteWalk() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Add context type definition
  interface CompleteWalkContext {
    previousUpcomingWalks?: Walk[];
    previousCompletedWalks?: Walk[];
  }
  
  return useMutation({
    mutationFn: async ({ walkId, notes }: { walkId: string; notes?: string }) => {
      const response = await api.patch<Walk>(`/api/walks/${walkId}/complete`, {
        notes,
        completedAt: new Date().toISOString()
      });
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to complete walk');
      }
      
      return response.data;
    },
    // Optimistically update the UI
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.walks.upcoming(user?.profileId || '') });
      
      // Snapshot the previous value
      const previousUpcomingWalks = queryClient.getQueryData<Walk[]>(
        queryKeys.walks.upcoming(user?.profileId || '')
      );
      
      // Optimistically update upcoming walks by removing this one
      queryClient.setQueryData<Walk[]>(
        queryKeys.walks.upcoming(user?.profileId || ''),
        old => old?.filter(walk => walk.id !== variables.walkId) || []
      );
      
      // Snapshot completed walks
      const previousCompletedWalks = queryClient.getQueryData<Walk[]>(
        queryKeys.walks.completed(user?.profileId || '')
      );
      
      // Get the walk details
      const walk = queryClient.getQueryData<Walk>(
        queryKeys.walks.byId(variables.walkId)
      );
      
      // Add to completed walks if we have the walk data
      if (walk) {
        const completedWalk = {
          ...walk,
          status: 'completed' as const,
          notes: variables.notes,
          completedAt: new Date().toISOString()
        };
        
        queryClient.setQueryData<Walk[]>(
          queryKeys.walks.completed(user?.profileId || ''),
          old => old ? [completedWalk, ...old] : [completedWalk]
        );
      }
      
      return { previousUpcomingWalks, previousCompletedWalks };
    },
    onError: (err, variables, context) => {
      // If there was an error, roll back
      if (context?.previousUpcomingWalks) {
        queryClient.setQueryData(
          queryKeys.walks.upcoming(user?.profileId || ''),
          context.previousUpcomingWalks
        );
      }
      
      if (context?.previousCompletedWalks) {
        queryClient.setQueryData(
          queryKeys.walks.completed(user?.profileId || ''),
          context.previousCompletedWalks
        );
      }
    },
    onSettled: () => {
      // Always refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.upcoming(user?.profileId || '') });
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.completed(user?.profileId || '') });
    }
  });
}

// Submit assessment
export function useSubmitAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ assessmentId, data }: { assessmentId: string; data: Partial<Assessment> }) => {
      const response = await api.patch<Assessment>(`/api/assessments/${assessmentId}/submit`, data);
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to submit assessment');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.byId(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessments.byWalker() });
    }
  });
} 