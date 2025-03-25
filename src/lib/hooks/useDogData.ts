import { useQuery, useMutation, useQueryClient } from 'react-query';
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
  return useQuery(dogKeys.lists(), DogAPI.getAll, {
    staleTime: 60000, // 1 min before refetching
    cacheTime: 300000, // 5 min before cache invalidation
  });
}

// Hook for fetching owner's dogs
export function useOwnerDogs(ownerId: string | undefined) {
  return useQuery(
    [...dogKeys.lists(), { owner: ownerId }],
    () => {
      if (!ownerId) return [];
      return DogAPI.getByOwnerId(ownerId);
    },
    {
      enabled: !!ownerId,
      staleTime: 60000
    }
  );
}

// Hook for fetching a single dog's details
export function useDog(id: string) {
  return useQuery(
    dogKeys.detail(id),
    () => DogAPI.getById(id),
    {
      enabled: !!id,
      staleTime: 60000,
      retry: 1,
      // When focusing back on the page, refetch if it's been more than 30 seconds
      refetchOnWindowFocus: (query) => 
        query.state.dataUpdatedAt < Date.now() - 30000,
    }
  );
}

// Hook for creating a new dog
export function useCreateDog() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (newDog: Omit<Dog, 'id'>) => DogAPI.create(newDog),
    {
      onSuccess: (data) => {
        // Update dogs list cache
        queryClient.invalidateQueries(dogKeys.lists());
      },
    }
  );
}

// Hook for updating a dog with optimistic updates
export function useUpdateDog() {
  const queryClient = useQueryClient();
  
  return useMutation(
    ({ id, data }: { id: string; data: Partial<Dog> }) => DogAPI.update(id, data), 
    {
      // Optimistic updates with proper rollback
      onMutate: async ({ id, data }) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries(dogKeys.detail(id));
        
        // Snapshot the previous value
        const previousDog = queryClient.getQueryData<Dog>(dogKeys.detail(id));
        
        // Optimistically update the cache
        if (previousDog) {
          queryClient.setQueryData<Dog>(dogKeys.detail(id), {
            ...previousDog,
            ...data
          });
          
          // Also update in the dogs list
          queryClient.setQueryData<Dog[]>(dogKeys.lists(), (old = []) => 
            old.map(dog => dog.id === id ? { ...dog, ...data } : dog)
          );
        }
        
        return { previousDog };
      },
      
      // If the mutation fails, use the context we saved
      onError: (err, { id }, context: any) => {
        if (context?.previousDog) {
          queryClient.setQueryData(dogKeys.detail(id), context.previousDog);
          
          // Update list cache too
          queryClient.setQueryData<Dog[]>(dogKeys.lists(), (old = []) => 
            old.map(dog => dog.id === id ? context.previousDog : dog)
          );
        }
      },
      
      // Always refetch after error or success to ensure cache consistency
      onSettled: (data, error, { id }) => {
        queryClient.invalidateQueries(dogKeys.detail(id));
        queryClient.invalidateQueries(dogKeys.lists());
      },
    }
  );
}

// Hook for deleting a dog
export function useDeleteDog() {
  const queryClient = useQueryClient();
  
  return useMutation(
    (id: string) => DogAPI.delete(id),
    {
      onMutate: async (id) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries(dogKeys.lists());
        
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
        queryClient.invalidateQueries(dogKeys.lists());
      },
    }
  );
} 