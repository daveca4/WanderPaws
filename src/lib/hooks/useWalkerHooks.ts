import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import apiClient from '../api/client';
import { queryKeys } from '../queryClient';
import { Walker, Dog, Walk, Assessment } from '../types';
import { processApiResponseData, logApiResponse } from '../utils/dataUtils';

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
      
      const response = await apiClient.get<Walker>(`/api/data/walkers/${user.profileId}`);
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
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: queryKeys.dogs.byWalker(user?.profileId || ''),
    queryFn: async () => {
      if (!user?.profileId) {
        console.error('Unauthorized: No walker profile ID available');
        return [];
      }
      
      console.log('🐕 Fetching dogs for walker with profile ID:', user.profileId);
      
      try {
        // First try the general dogs API endpoint
        try {
          console.log('🔍 Trying general /data/dogs API endpoint...');
          const dogsResult = await apiClient.get('/data/dogs');
          logApiResponse('useWalkerDogs', '/data/dogs', dogsResult.data);
          
          if (dogsResult.ok) {
            const dogs = processApiResponseData<Dog>(dogsResult.data);
            console.log('✅ Found dogs via general dogs API:', dogs.length);
            return dogs;
          }
        } catch (dogsError) {
          console.warn('❌ Error fetching from /data/dogs:', dogsError);
        }
        
        // Then try the walker-specific endpoint
        console.log('🔍 Trying walker-specific endpoint...');
        const result = await apiClient.get(`/api/data/walkers/${user.profileId}/dogs`);
        logApiResponse('useWalkerDogs', `/api/data/walkers/${user.profileId}/dogs`, result.data);
        
        if (!result.ok) {
          // Try legacy endpoint as fallback
          console.log('🔍 Trying legacy walker endpoint...');
          const legacyResult = await apiClient.get(`/api/walkers/${user.profileId}/dogs`);
          logApiResponse('useWalkerDogs', `/api/walkers/${user.profileId}/dogs`, legacyResult.data);
          
          if (!legacyResult.ok) {
            console.error('❌ Error response from both walker dogs APIs');
            throw new Error(result.error || legacyResult.error || 'Failed to fetch assigned dogs');
          }
          
          const dogs = processApiResponseData<Dog>(legacyResult.data);
          console.log('✅ Found dogs via legacy endpoint:', dogs.length);
          return dogs;
        }
        
        // Process response data using the utility function
        const dogs = processApiResponseData<Dog>(result.data);
        console.log('✅ Final parsed dogs data:', dogs.length);
        return dogs;
      } catch (error) {
        console.error('❌ Error fetching walker dogs:', error);
        // Return empty array instead of throwing to avoid breaking the UI
        return [];
      }
    },
    enabled: !!user?.profileId,
    staleTime: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
  });
}

// Fetch walker's upcoming walks
export function useWalkerUpcomingWalks() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.walks.upcoming(user?.profileId || ''),
    queryFn: async () => {
      if (!user?.profileId) {
        console.error('Unauthorized: No walker profile ID available');
        return [];
      }
      
      console.log('🚶 Fetching upcoming walks for walker with profile ID:', user.profileId);
      
      try {
        // Try the new data API endpoint first
        try {
          console.log('🔍 Trying data API endpoint...');
          const response = await apiClient.get(`/api/data/walkers/${user.profileId}/walks/upcoming`);
          logApiResponse('useWalkerUpcomingWalks', `/api/data/walkers/${user.profileId}/walks/upcoming`, response.data);
          
          if (response.ok) {
            const walks = processApiResponseData<Walk>(response.data, 'walks');
            console.log('✅ Found upcoming walks via data API:', walks.length);
            return walks;
          }
        } catch (dataApiError) {
          console.warn('❌ Error fetching from data API:', dataApiError);
        }
        
        // Fall back to the legacy API endpoint
        console.log('🔍 Trying legacy API endpoint...');
        const legacyResponse = await apiClient.get(`/api/walkers/${user.profileId}/walks/upcoming`);
        logApiResponse('useWalkerUpcomingWalks', `/api/walkers/${user.profileId}/walks/upcoming`, legacyResponse.data);
        
        if (!legacyResponse.ok) {
          throw new Error(legacyResponse.error || 'Failed to fetch upcoming walks');
        }
        
        const walks = processApiResponseData<Walk>(legacyResponse.data, 'walks');
        console.log('✅ Found upcoming walks via legacy API:', walks.length);
        return walks;
      } catch (error) {
        console.error('❌ Error fetching walker upcoming walks:', error);
        // Return empty array instead of throwing to avoid breaking the UI
        return [];
      }
    },
    enabled: !!user?.profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

// Fetch walker's completed walks
export function useWalkerCompletedWalks() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.walks.completed(user?.profileId || ''),
    queryFn: async () => {
      if (!user?.profileId) {
        console.error('Unauthorized: No walker profile ID available');
        return [];
      }
      
      console.log('🚶 Fetching completed walks for walker with profile ID:', user.profileId);
      
      try {
        // Try the new data API endpoint first
        try {
          console.log('🔍 Trying data API endpoint...');
          const response = await apiClient.get(`/api/data/walkers/${user.profileId}/walks/completed`);
          logApiResponse('useWalkerCompletedWalks', `/api/data/walkers/${user.profileId}/walks/completed`, response.data);
          
          if (response.ok) {
            const walks = processApiResponseData<Walk>(response.data, 'walks');
            console.log('✅ Found completed walks via data API:', walks.length);
            return walks;
          }
        } catch (dataApiError) {
          console.warn('❌ Error fetching from data API:', dataApiError);
        }
        
        // Fall back to the legacy API endpoint
        console.log('🔍 Trying legacy API endpoint...');
        const legacyResponse = await apiClient.get(`/api/walkers/${user.profileId}/walks/completed`);
        logApiResponse('useWalkerCompletedWalks', `/api/walkers/${user.profileId}/walks/completed`, legacyResponse.data);
        
        if (!legacyResponse.ok) {
          throw new Error(legacyResponse.error || 'Failed to fetch completed walks');
        }
        
        const walks = processApiResponseData<Walk>(legacyResponse.data, 'walks');
        console.log('✅ Found completed walks via legacy API:', walks.length);
        return walks;
      } catch (error) {
        console.error('❌ Error fetching walker completed walks:', error);
        // Return empty array instead of throwing to avoid breaking the UI
        return [];
      }
    },
    enabled: !!user?.profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

// Fetch walker's pending assessments
export function useWalkerPendingAssessments() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.assessments.byWalker(user?.profileId),
    queryFn: async () => {
      if (!user?.profileId) {
        console.error('Unauthorized: No walker profile ID available');
        return [];
      }
      
      console.log('🔍 Fetching pending assessments for walker with profile ID:', user.profileId);
      
      try {
        // Try the new data API endpoint first
        try {
          console.log('🔍 Trying data API endpoint for assessments...');
          const response = await apiClient.get(`/api/data/walkers/${user.profileId}/assessments`);
          logApiResponse('useWalkerPendingAssessments', `/api/data/walkers/${user.profileId}/assessments`, response.data);
          
          if (response.ok) {
            const assessments = processApiResponseData<Assessment>(response.data, 'assessments');
            console.log('✅ Found assessments via data API:', assessments.length);
            return assessments;
          }
        } catch (dataApiError) {
          console.warn('❌ Error fetching from data API:', dataApiError);
        }
        
        // Try assessments endpoint with ready_for_review status
        try {
          console.log('🔍 Trying assessments with ready_for_review status...');
          const readyResponse = await apiClient.get(`/api/assessments?status=ready_for_review&walkerId=${user.profileId}`);
          logApiResponse('useWalkerPendingAssessments', `/api/assessments?status=ready_for_review&walkerId=${user.profileId}`, readyResponse.data);
          
          if (readyResponse.ok) {
            const assessments = processApiResponseData<Assessment>(readyResponse.data, 'assessments');
            console.log('✅ Found assessments via ready_for_review status:', assessments.length);
            return assessments;
          }
        } catch (assessmentError) {
          console.warn('❌ Error fetching assessments with ready_for_review status:', assessmentError);
        }
        
        // Fall back to the legacy API endpoint
        console.log('🔍 Trying legacy assessments API endpoint...');
        const legacyResponse = await apiClient.get(`/api/walkers/${user.profileId}/assessments`);
        logApiResponse('useWalkerPendingAssessments', `/api/walkers/${user.profileId}/assessments`, legacyResponse.data);
        
        if (!legacyResponse.ok) {
          throw new Error(legacyResponse.error || 'Failed to fetch pending assessments');
        }
        
        const assessments = processApiResponseData<Assessment>(legacyResponse.data, 'assessments');
        console.log('✅ Found assessments via legacy API:', assessments.length);
        return assessments;
      } catch (error) {
        console.error('❌ Error fetching walker pending assessments:', error);
        // Return empty array instead of throwing to avoid breaking the UI
        return [];
      }
    },
    enabled: !!user?.profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
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
      
      const response = await apiClient.patch<Walker>(`/api/data/walkers/${user.profileId}`, data);
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
      const response = await apiClient.patch<Walk>(`/api/walks/${walkId}/status`, { 
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
      const response = await apiClient.patch<Walk>(`/api/walks/${walkId}/complete`, {
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
      const response = await apiClient.patch<Assessment>(`/api/assessments/${assessmentId}/submit`, data);
      
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

// Query keys for walker data
export const walkerKeys = {
  all: ['walkers'] as const,
  lists: () => [...walkerKeys.all, 'list'] as const,
  list: (filters: any) => [...walkerKeys.lists(), { ...filters }] as const,
  details: () => [...walkerKeys.all, 'detail'] as const,
  detail: (id: string) => [...walkerKeys.details(), id] as const,
};

// Hook to fetch all walkers (admin only)
export function useAllWalkers() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: walkerKeys.lists(),
    queryFn: async () => {
      if (!user || user.role !== 'admin') {
        console.error('❌ Only admin users can fetch all walkers');
        return [];
      }
      
      console.log('🔍 Fetching all walkers');
      const response = await apiClient.get('/data/walkers');
      
      if (!response.ok) {
        console.error('❌ Error fetching walkers:', response.error);
        return [];
      }
      
      console.log('✅ Fetched walkers:', response.data);
      return response.data || [];
    },
    enabled: !!user && user.role === 'admin',
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook to fetch available walkers (for owners)
export function useAvailableWalkers() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...walkerKeys.lists(), 'available'],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('🔍 Fetching available walkers');
      
      try {
        // Try the specific endpoint first
        const response = await apiClient.get('/data/walkers/available');
        
        if (response.ok) {
          console.log('✅ Fetched available walkers:', response.data);
          return response.data || [];
        }
      } catch (error) {
        console.warn('⚠️ Error with available walkers endpoint:', error);
      }
      
      // Fallback to all walkers filtered by status
      try {
        const allWalkersResponse = await apiClient.get('/data/walkers?status=active');
        
        if (allWalkersResponse.ok) {
          console.log('✅ Fetched walkers via status filter:', allWalkersResponse.data);
          return allWalkersResponse.data || [];
        }
      } catch (fallbackError) {
        console.error('❌ Error fetching walkers with filter:', fallbackError);
      }
      
      // Last resort: get all walkers and filter client-side
      try {
        const lastResortResponse = await apiClient.get('/data/walkers');
        
        if (lastResortResponse.ok) {
          const walkers = lastResortResponse.data || [];
          // Use type assertion and safe property check
          const availableWalkers = walkers.filter((walker: any) => 
            walker && typeof walker === 'object' && walker.status === 'active'
          );
          console.log('✅ Filtered available walkers client-side:', availableWalkers.length);
          return availableWalkers;
        }
      } catch (lastError) {
        console.error('❌ All attempts to fetch walkers failed:', lastError);
      }
      
      return [];
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook for owners to see their assigned walkers
export function useMyWalkers() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...walkerKeys.lists(), 'my', user?.profileId || ''],
    queryFn: async () => {
      if (!user || user.role !== 'owner' || !user.profileId) {
        console.error('Unauthorized: Only owners can access their walkers');
        return [];
      }
      
      console.log('🔍 Fetching walkers for owner:', user.profileId);
      
      try {
        // Try the owner-specific endpoint first
        try {
          console.log('🔍 Trying owner-specific walkers endpoint');
          const response = await apiClient.get(`/data/owners/${user.profileId}/walkers`);
          
          if (response.ok && Array.isArray(response.data)) {
            console.log('✅ Fetched owner walkers:', response.data.length);
            return response.data;
          }
        } catch (error) {
          console.warn('⚠️ Error with owner walkers endpoint:', error);
        }
        
        // Fallback to dogs + walks to find walkers
        try {
          // Get owner's dogs first
          console.log('🔍 Trying fallback via owner dogs');
          const dogsResponse = await apiClient.get(`/data/owners/${user.profileId}/dogs`);
          
          if (dogsResponse.ok && Array.isArray(dogsResponse.data)) {
            const dogs = dogsResponse.data;
            console.log('✅ Found owner dogs for walker lookup:', dogs.length);
            
            if (dogs.length === 0) return [];
            
            // Get all owner's walks to find walkers
            const walkerIds = new Set<string>();
            const walkers: any[] = [];
            
            for (const dog of dogs) {
              try {
                const walksResponse = await apiClient.get(`/data/dogs/${dog.id}/walks`);
                
                if (walksResponse.ok && Array.isArray(walksResponse.data)) {
                  const walks = walksResponse.data;
                  
                  // Extract unique walker IDs
                  for (const walk of walks) {
                    if (walk.walkerId && !walkerIds.has(walk.walkerId)) {
                      walkerIds.add(walk.walkerId);
                      
                      // Fetch walker details
                      try {
                        const walkerResponse = await apiClient.get(`/data/walkers/${walk.walkerId}`);
                        if (walkerResponse.ok) {
                          walkers.push(walkerResponse.data);
                        }
                      } catch (walkerError) {
                        console.warn('⚠️ Error fetching walker details:', walkerError);
                      }
                    }
                  }
                }
              } catch (walksError) {
                console.warn('⚠️ Error fetching dog walks:', walksError);
              }
            }
            
            console.log('✅ Found assigned walkers via walks:', walkers.length);
            return walkers;
          }
        } catch (fallbackError) {
          console.error('❌ Error with fallback walker lookup:', fallbackError);
        }
        
        // Last resort - try the walker assignment endpoint
        try {
          console.log('🔍 Trying walker assignments endpoint');
          const assignmentsResponse = await apiClient.get(`/data/assignments?ownerId=${user.profileId}`);
          
          if (assignmentsResponse.ok && Array.isArray(assignmentsResponse.data)) {
            const assignments = assignmentsResponse.data;
            console.log('✅ Found walker assignments:', assignments.length);
            
            // If we have assignments, fetch each walker
            if (assignments.length > 0) {
              const walkerIds = new Set(assignments.map(a => a.walkerId).filter(Boolean));
              const walkers: any[] = [];
              
              for (const walkerId of Array.from(walkerIds)) {
                try {
                  const walkerResponse = await apiClient.get(`/data/walkers/${walkerId}`);
                  if (walkerResponse.ok) {
                    walkers.push(walkerResponse.data);
                  }
                } catch (walkerError) {
                  console.warn('⚠️ Error fetching assigned walker:', walkerError);
                }
              }
              
              console.log('✅ Fetched assigned walkers from assignments:', walkers.length);
              return walkers;
            }
          }
        } catch (assignmentError) {
          console.warn('⚠️ Error with assignments endpoint:', assignmentError);
        }
        
        // If all else fails, return empty array
        console.warn('⚠️ All walker fetch attempts failed');
        return [];
      } catch (error) {
        console.error('❌ Error in useMyWalkers:', error);
        return [];
      }
    },
    enabled: !!user && user.role === 'owner' && !!user.profileId,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
}

// Hook to fetch a specific walker
export function useWalker(id?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: walkerKeys.detail(id || ''),
    queryFn: async () => {
      if (!id || !user) return null;
      
      console.log('🔍 Fetching walker details:', id);
      const response = await apiClient.get(`/data/walkers/${id}`);
      
      if (!response.ok) {
        console.error('❌ Error fetching walker:', response.error);
        return null;
      }
      
      console.log('✅ Fetched walker:', response.data);
      return response.data;
    },
    enabled: !!id && !!user,
    staleTime: 60 * 1000, // 1 minute
  });
} 