import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, getAuthHeaders } from '@/lib/queryClient';
import { Walk } from '@/lib/types';

// Location interfaces
interface Location {
  id: string;
  walkId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

// Fetch real-time walk data including location updates
export const useLiveWalk = (walkId: string) => {
  return useQuery({
    queryKey: queryKeys.walks.byId(walkId),
    queryFn: async (): Promise<Walk & { locations?: Location[] }> => {
      if (!walkId) {
        throw new Error('Walk ID is required');
      }
      
      const headers = getAuthHeaders();
      const response = await fetch(`/api/walks/${walkId}/live`, { headers });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to fetch live walk data');
      }
      
      return response.json();
    },
    enabled: !!walkId,
    // Poll for updates every 10 seconds for active walks
    refetchInterval: (context) => {
      const data = context.state.data as (Walk & { locations?: Location[] }) | undefined;
      if (data?.status === 'completed' || data?.status === 'cancelled') {
        return false; // Stop polling for completed or cancelled walks
      }
      return 10000; // 10 seconds
    },
  });
};

// Submit new location update (for walker app)
export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      walkId, 
      latitude, 
      longitude 
    }: { 
      walkId: string; 
      latitude: number; 
      longitude: number; 
    }) => {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/walks/${walkId}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({ latitude, longitude }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to update location');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the live walk query to get fresh location data
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.byId(variables.walkId) });
    }
  });
};

// Get historical locations for a completed walk
export const useWalkLocations = (walkId: string) => {
  return useQuery({
    queryKey: queryKeys.walks.locations(walkId),
    queryFn: async (): Promise<Location[]> => {
      if (!walkId) {
        throw new Error('Walk ID is required');
      }
      
      const headers = getAuthHeaders();
      const response = await fetch(`/api/walks/${walkId}/locations`, { headers });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to fetch walk locations');
      }
      
      return response.json();
    },
    enabled: !!walkId,
  });
};

// Start walk and begin location tracking
export const useStartWalk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ walkId }: { walkId: string }) => {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/walks/${walkId}/start`, {
        method: 'POST',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to start walk');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the walk queries to reflect updated status
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.byId(variables.walkId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.upcoming() });
    }
  });
};

// Complete walk and stop location tracking
export const useCompleteWalk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      walkId, 
      metrics 
    }: { 
      walkId: string; 
      metrics?: { 
        distance: number; 
        duration: number;
        steps: number;
      } 
    }) => {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/walks/${walkId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({ metrics }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to complete walk');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.byId(variables.walkId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.upcoming() });
      queryClient.invalidateQueries({ queryKey: queryKeys.walks.completed() });
    }
  }); 
}; 