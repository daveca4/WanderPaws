import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Dog } from '../types';
import { useAuth } from '../auth/AuthContext';

// Query keys for dog data
export const dogKeys = {
  all: ['dogs'] as const,
  lists: () => [...dogKeys.all, 'list'] as const,
  list: (filters: any) => [...dogKeys.lists(), { ...filters }] as const,
  details: () => [...dogKeys.all, 'detail'] as const,
  detail: (id: string) => [...dogKeys.details(), id] as const,
};

/**
 * Hook to fetch all dogs
 */
export function useDogs() {
  return useQuery({
    queryKey: dogKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get('/api/data/dogs');
      return response.data as Dog[];
    },
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to fetch a specific dog
 */
export function useDog(id?: string) {
  return useQuery({
    queryKey: dogKeys.detail(id || ''),
    queryFn: async () => {
      const response = await apiClient.get(`/api/data/dogs/${id}`);
      return response.data as Dog;
    },
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to fetch dogs by owner ID
 */
export function useOwnerDogs(ownerId?: string) {
  const { user } = useAuth();
  
  // If no ownerId is provided and user is an owner, use their profileId
  const effectiveOwnerId = ownerId || (user?.role === 'owner' ? user.profileId : undefined);
  
  return useQuery({
    queryKey: dogKeys.list({ ownerId: effectiveOwnerId }),
    queryFn: async () => {
      if (!effectiveOwnerId) return [];
      
      const response = await apiClient.get(`/api/data/owners/${effectiveOwnerId}/dogs`);
      return response.data as Dog[];
    },
    enabled: !!effectiveOwnerId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Hook to create a new dog
 */
export function useCreateDog() {
  const queryClient = useQueryClient();
  const { user, ensureProfile } = useAuth();
  
  return useMutation({
    mutationFn: async (newDog: Omit<Dog, 'id'>) => {
      // If user is an owner and doesn't have a profileId, ensure profile exists first
      if (user?.role === 'owner' && !user.profileId) {
        await ensureProfile();
      }
      
      const response = await apiClient.post('/api/data/dogs', newDog);
      return response.data as Dog;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: dogKeys.lists() });
      
      if (data.ownerId) {
        queryClient.invalidateQueries({ 
          queryKey: dogKeys.list({ ownerId: data.ownerId }) 
        });
      }
    }
  });
}

/**
 * Hook to update a dog
 */
export function useUpdateDog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Dog> }) => {
      const response = await apiClient.patch(`/api/data/dogs/${id}`, data);
      return response.data as Dog;
    },
    onSuccess: (data) => {
      // Invalidate and update the cache
      queryClient.invalidateQueries({ queryKey: dogKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: dogKeys.lists() });
      
      if (data.ownerId) {
        queryClient.invalidateQueries({ 
          queryKey: dogKeys.list({ ownerId: data.ownerId }) 
        });
      }
    }
  });
}

/**
 * Hook to delete a dog
 */
export function useDeleteDog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/api/data/dogs/${id}`);
      return response.data;
    },
    onSuccess: (_data, id) => {
      // Invalidate and update the cache
      queryClient.removeQueries({ queryKey: dogKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: dogKeys.lists() });
    }
  });
} 