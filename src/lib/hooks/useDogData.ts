import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DogAPI } from '../api/requests';
import type { Dog } from '../types';

// Query keys for consistent cache management
export const dogKeys = {
  all: ['dogs'] as const,
  lists: () => [...dogKeys.all, 'list'] as const,
  list: (filters: any) => [...dogKeys.lists(), { ...filters }] as const,
  details: () => [...dogKeys.all, 'detail'] as const,
  detail: (id: string) => [...dogKeys.details(), id] as const,
};

// Hook for fetching all dogs
export function useDogs() {
  return useQuery({
    queryKey: dogKeys.lists(),
    queryFn: () => DogAPI.getAll(),
    staleTime: 60000, // 1 min before refetching
    gcTime: 300000, // 5 min before cache invalidation (formerly cacheTime)
  });
}

// Hook for fetching owner's dogs
export function useOwnerDogs(ownerId: string | undefined) {
  return useQuery({
    queryKey: [...dogKeys.lists(), { owner: ownerId }],
    queryFn: async () => {
      if (!ownerId) {
        console.log('No owner ID provided to useOwnerDogs');
        return [];
      }
      
      try {
        console.log('Fetching dogs for owner:', ownerId);
        const dogs = await DogAPI.getByOwnerId(ownerId);
        console.log('Fetched dogs:', dogs);
        return dogs;
      } catch (error: unknown) {
        console.error('Error fetching owner dogs:', error);
        throw error;
      }
    },
    enabled: !!ownerId,
    staleTime: 60000,
    retry: 2,
    retryDelay: 1000
  });
}

// Hook for fetching a single dog's details
export function useDog(id: string) {
  return useQuery({
    queryKey: dogKeys.detail(id),
    queryFn: () => DogAPI.getById(id),
    enabled: !!id,
    staleTime: 60000,
    retry: 1,
    // When focusing back on the page, refetch if it's been more than 30 seconds
    refetchOnWindowFocus: (query: any) => 
      query.state.dataUpdatedAt < Date.now() - 30000,
  });
}

// Hook for creating a new dog
export function useCreateDog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newDog: Omit<Dog, 'id'>) => DogAPI.create(newDog),
    onSuccess: (data: Dog) => {
      // Update dogs list cache
      queryClient.invalidateQueries({ queryKey: dogKeys.lists() });
    }
  });
}

// Hook for updating a dog with optimistic updates
export function useUpdateDog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Dog> }) => DogAPI.update(id, data),
    // Optimistic updates with proper rollback
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: dogKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: dogKeys.lists() });
      
      // Snapshot the previous value
      const previousDog = queryClient.getQueryData<Dog>(dogKeys.detail(id));
      const previousDogs = queryClient.getQueryData<Dog[]>(dogKeys.lists());
      
      // Optimistically update the cache
      if (previousDog) {
        console.log('Optimistically updating dog in cache:', { ...previousDog, ...data });
        queryClient.setQueryData<Dog>(dogKeys.detail(id), {
          ...previousDog,
          ...data
        });
        
        // Also update in the dogs list
        if (previousDogs) {
          queryClient.setQueryData<Dog[]>(dogKeys.lists(), 
            previousDogs.map(dog => dog.id === id ? { ...dog, ...data } : dog)
          );
        }
      }
      
      return { previousDog, previousDogs };
    },
    
    // If the mutation fails, use the context we saved
    onError: (err, { id }, context: any) => {
      console.error('Error in dog update mutation:', err);
      
      if (context?.previousDog) {
        // Revert the detail view
        queryClient.setQueryData(dogKeys.detail(id), context.previousDog);
      }
      
      if (context?.previousDogs) {
        // Revert the list view
        queryClient.setQueryData(dogKeys.lists(), context.previousDogs);
      }
    }
  });
}

// Hook for deleting a dog
export function useDeleteDog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => DogAPI.delete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: dogKeys.lists() });
      
      // Snapshot the previous dogs
      const previousDogs = queryClient.getQueryData<Dog[]>(dogKeys.lists());
      
      // Optimistically update the cache
      if (previousDogs) {
        queryClient.setQueryData<Dog[]>(
          dogKeys.lists(),
          previousDogs.filter(dog => dog.id !== id)
        );
      }
      
      return { previousDogs };
    },
    
    // If the mutation fails, restore the previous data
    onError: (err, id, context: any) => {
      if (context?.previousDogs) {
        queryClient.setQueryData(dogKeys.lists(), context.previousDogs);
      }
    },
    
    // After success or failure, invalidate the relevant queries
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dogKeys.lists() });
    }
  });
} 