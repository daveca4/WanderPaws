import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import apiClient from '@/lib/api/client';
import { DogWalkStatus as WalkStatus } from '@/lib/types';

export const walksKeys = {
  all: ['walks'] as const,
  lists: () => [...walksKeys.all, 'list'] as const,
  list: (filters: any) => [...walksKeys.lists(), { ...filters }] as const,
  details: () => [...walksKeys.all, 'detail'] as const,
  detail: (id: string) => [...walksKeys.details(), id] as const,
  dogWalks: (dogId: string) => [...walksKeys.lists(), 'dog', dogId] as const,
  ownerWalks: (ownerId: string) => [...walksKeys.lists(), 'owner', ownerId] as const,
  walkerWalks: (walkerId: string) => [...walksKeys.lists(), 'walker', walkerId] as const,
};

// Hook to fetch walks for a specific dog
export function useDogWalks(dogId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: walksKeys.dogWalks(dogId || ''),
    queryFn: async () => {
      if (!dogId || !user) return [];
      
      console.log('🔍 Fetching walks for dog:', dogId);
      try {
        const response = await apiClient.get(`/data/dogs/${dogId}/walks`);
        
        if (!response.ok) {
          console.error('❌ Error fetching dog walks:', response.error);
          return [];
        }
        
        console.log('✅ Fetched dog walks:', response.data?.length || 0);
        return response.data || [];
      } catch (error) {
        console.error('❌ Exception fetching dog walks:', error);
        return [];
      }
    },
    enabled: !!dogId && !!user,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to fetch all walks for the current owner
export function useOwnerWalks() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: walksKeys.ownerWalks(user?.profileId || ''),
    queryFn: async () => {
      if (!user || !user.profileId || user.role !== 'owner') return [];
      
      console.log('🔍 Fetching all walks for owner:', user.profileId);
      
      try {
        // First try owner-specific endpoint
        const response = await apiClient.get(`/data/owners/${user.profileId}/walks`);
        
        if (response.ok && Array.isArray(response.data)) {
          console.log('✅ Fetched owner walks:', response.data.length);
          return response.data;
        }
      } catch (error) {
        console.warn('⚠️ Error with owner walks endpoint, trying fallback:', error);
      }
      
      // Fallback: Get all the owner's dogs and then all walks for each dog
      try {
        const dogsResponse = await apiClient.get(`/data/owners/${user.profileId}/dogs`);
        
        if (dogsResponse.ok && Array.isArray(dogsResponse.data)) {
          const dogs = dogsResponse.data;
          console.log('✅ Found owner dogs for walks lookup:', dogs.length);
          
          if (dogs.length === 0) return [];
          
          // Get all walks for each dog and combine them
          const allWalks: any[] = [];
          
          for (const dog of dogs) {
            try {
              const dogWalksResponse = await apiClient.get(`/data/dogs/${dog.id}/walks`);
              
              if (dogWalksResponse.ok && Array.isArray(dogWalksResponse.data)) {
                allWalks.push(...dogWalksResponse.data);
              }
            } catch (dogWalksError) {
              console.warn('⚠️ Error fetching walks for dog:', dog.id, dogWalksError);
            }
          }
          
          // Sort walks by date (most recent first)
          allWalks.sort((a, b) => {
            return new Date(b.date || b.scheduledDate || 0).getTime() - 
                   new Date(a.date || a.scheduledDate || 0).getTime();
          });
          
          console.log('✅ Combined walks from all dogs:', allWalks.length);
          return allWalks;
        }
      } catch (fallbackError) {
        console.error('❌ Error with fallback walks lookup:', fallbackError);
      }
      
      return [];
    },
    enabled: !!user && !!user.profileId && user.role === 'owner',
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to fetch all walks for the current walker
export function useWalkerWalks() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: walksKeys.walkerWalks(user?.profileId || ''),
    queryFn: async () => {
      if (!user || !user.profileId || user.role !== 'walker') return [];
      
      console.log('🔍 Fetching all walks for walker:', user.profileId);
      
      try {
        // First try walker-specific endpoint
        const response = await apiClient.get(`/data/walkers/${user.profileId}/walks`);
        
        if (response.ok && Array.isArray(response.data)) {
          console.log('✅ Fetched walker walks:', response.data.length);
          return response.data;
        }
      } catch (error) {
        console.warn('⚠️ Error with walker walks endpoint, trying fallback:', error);
      }
      
      // Fallback: Try the generic walks endpoint with walker filter
      try {
        const fallbackResponse = await apiClient.get(`/data/walks?walkerId=${user.profileId}`);
        
        if (fallbackResponse.ok && Array.isArray(fallbackResponse.data)) {
          console.log('✅ Fetched walker walks via filter:', fallbackResponse.data.length);
          return fallbackResponse.data;
        }
      } catch (fallbackError) {
        console.error('❌ Error with fallback walker walks:', fallbackError);
      }
      
      return [];
    },
    enabled: !!user && !!user.profileId && user.role === 'walker',
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to fetch all upcoming walks for the current user (owner or walker)
export function useUpcomingWalks() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...walksKeys.lists(), 'upcoming', user?.role || '', user?.profileId || ''],
    queryFn: async () => {
      if (!user || !user.profileId) return [];
      
      console.log('🔍 Fetching upcoming walks for', user.role, user.profileId);
      
      // Different endpoint based on user role
      const endpoint = user.role === 'owner' 
        ? `/data/owners/${user.profileId}/walks/upcoming`
        : `/data/walkers/${user.profileId}/walks/upcoming`;
      
      try {
        const response = await apiClient.get(endpoint);
        
        if (response.ok && Array.isArray(response.data)) {
          console.log('✅ Fetched upcoming walks:', response.data.length);
          return response.data;
        }
      } catch (error) {
        console.warn('⚠️ Error with upcoming walks endpoint, trying fallback:', error);
      }
      
      // Fallback: Get all walks and filter for upcoming ones client-side
      try {
        const allWalksQuery = user.role === 'owner' 
          ? useOwnerWalks() 
          : useWalkerWalks();
        
        const allWalks = await allWalksQuery.refetch();
        
        if (allWalks.data) {
          const now = new Date();
          const upcomingWalks = allWalks.data.filter((walk: any) => {
            const walkDate = new Date(walk.date || walk.scheduledDate || 0);
            return walkDate > now && walk.status !== 'cancelled' && walk.status !== 'completed';
          });
          
          console.log('✅ Filtered upcoming walks client-side:', upcomingWalks.length);
          return upcomingWalks;
        }
      } catch (fallbackError) {
        console.error('❌ Error with fallback upcoming walks:', fallbackError);
      }
      
      return [];
    },
    enabled: !!user && !!user.profileId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to fetch a specific walk by ID
export function useWalk(walkId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: walksKeys.detail(walkId || ''),
    queryFn: async () => {
      if (!walkId || !user) return null;
      
      console.log('🔍 Fetching walk details:', walkId);
      
      try {
        const response = await apiClient.get(`/data/walks/${walkId}`);
        
        if (!response.ok) {
          console.error('❌ Error fetching walk:', response.error);
          return null;
        }
        
        console.log('✅ Fetched walk:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Exception fetching walk:', error);
        return null;
      }
    },
    enabled: !!walkId && !!user,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to create a new walk
export function useCreateWalk() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (walkData: any) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('🔍 Creating new walk:', walkData);
      
      const response = await apiClient.post('/data/walks', walkData);
      
      if (!response.ok) {
        console.error('❌ Error creating walk:', response.error);
        throw new Error(response.error || 'Failed to create walk');
      }
      
      console.log('✅ Created walk:', response.data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: walksKeys.lists() });
      
      if (variables.dogId) {
        queryClient.invalidateQueries({ queryKey: walksKeys.dogWalks(variables.dogId) });
      }
      
      if (user?.profileId) {
        if (user.role === 'owner') {
          queryClient.invalidateQueries({ queryKey: walksKeys.ownerWalks(user.profileId) });
        } else if (user.role === 'walker') {
          queryClient.invalidateQueries({ queryKey: walksKeys.walkerWalks(user.profileId) });
        }
      }
    },
  });
}

// Hook to update a walk's status
export function useUpdateWalkStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ walkId, status }: { walkId: string; status: WalkStatus }) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('🔍 Updating walk status:', walkId, 'to', status);
      
      const response = await apiClient.patch(`/data/walks/${walkId}/status`, { status });
      
      if (!response.ok) {
        console.error('❌ Error updating walk status:', response.error);
        throw new Error(response.error || 'Failed to update walk status');
      }
      
      console.log('✅ Updated walk status:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: walksKeys.all });
      
      // Invalidate the specific walk query
      if (data && data.id) {
        queryClient.invalidateQueries({ queryKey: walksKeys.detail(data.id) });
      }
      
      // Invalidate dog walks if available
      if (data && data.dogId) {
        queryClient.invalidateQueries({ queryKey: walksKeys.dogWalks(data.dogId) });
      }
    },
  });
}

// Hook to submit walk feedback
export function useSubmitWalkFeedback() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ walkId, feedback }: { walkId: string; feedback: any }) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('🔍 Submitting feedback for walk:', walkId);
      
      const response = await apiClient.post(`/data/walks/${walkId}/feedback`, feedback);
      
      if (!response.ok) {
        console.error('❌ Error submitting walk feedback:', response.error);
        throw new Error(response.error || 'Failed to submit feedback');
      }
      
      console.log('✅ Submitted walk feedback:', response.data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate the specific walk query
      queryClient.invalidateQueries({ queryKey: walksKeys.detail(variables.walkId) });
    },
  });
} 