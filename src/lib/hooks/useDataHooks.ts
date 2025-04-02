import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../api/client';
import { queryKeys } from '../queryClient';
import { Dog, Owner, Walker, Walk, Assessment, UserSubscription, SubscriptionPlan } from '../types';
import { useAuth } from '../AuthContext';

// Type definitions for query responses
type DogsResponse = Dog[];
type OwnerResponse = Owner;
type OwnersResponse = Owner[];
type SubscriptionPlansResponse = { plans: SubscriptionPlan[] };
type UserSubscriptionsResponse = { subscriptions: UserSubscription[] };

// ==================== DOG HOOKS ====================

// Hook for fetching all dogs
export function useDogs() {
  return useQuery<DogsResponse, Error>(
    queryKeys.dogs.all(),
    async () => {
      const response = await api.get<DogsResponse>('/api/data/dogs');
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch dogs');
      }
      return response.data;
    },
    {
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  );
}

// Hook for fetching dogs by owner ID
export function useOwnerDogs(ownerId?: string) {
  const { user } = useAuth();
  
  return useQuery<DogsResponse, Error>(
    queryKeys.dogs.byOwner(ownerId || 'current'),
    async () => {
      // If no ownerId provided, but user has profileId, use that
      const effectiveOwnerId = ownerId || user?.profileId;
      
      if (!effectiveOwnerId) {
        console.log('No owner ID available for dog fetch');
        return [];
      }
      
      const response = await api.get<DogsResponse>(`/api/data/owners/${effectiveOwnerId}/dogs`);
      
      if (!response.ok) {
        // If we get a 404, just return an empty array rather than error
        if (response.status === 404) {
          console.log('Owner not found, returning empty dogs array');
          return [];
        }
        throw new Error(response.error || `Failed to fetch dogs for owner ${effectiveOwnerId}`);
      }
      
      return response.data;
    },
    {
      // Only run query if we have a user or ownerId
      enabled: !!(ownerId || user?.profileId),
      
      // Keep previous data while loading new data
      keepPreviousData: true,
      
      // Log details about the response
      onSuccess: (data) => {
        console.log(`Found ${data.length} dogs for owner ${ownerId || user?.profileId}`);
      }
    }
  );
}

// Hook for fetching a single dog
export function useDog(id?: string) {
  return useQuery<Dog, Error>(
    queryKeys.dogs.byId(id || ''),
    async () => {
      const response = await api.get<Dog>(`/api/data/dogs/${id}`);
      if (!response.ok) {
        throw new Error(response.error || `Failed to fetch dog ${id}`);
      }
      return response.data;
    },
    {
      enabled: !!id,
    }
  );
}

// Hook for creating a dog
export function useCreateDog() {
  const queryClient = useQueryClient();
  
  return useMutation<Dog, Error, Omit<Dog, 'id'>>(
    async (newDog) => {
      const response = await api.post<Dog>('/api/data/dogs', newDog);
      if (!response.ok) {
        throw new Error(response.error || 'Failed to create dog');
      }
      return response.data;
    },
    {
      onSuccess: (data, variables, context) => {
        // Invalidate all dog queries to refetch
        queryClient.invalidateQueries(queryKeys.dogs.all());
        
        // If we know this dog's owner, invalidate that specific owner's dogs
        if (data.ownerId) {
          queryClient.invalidateQueries(queryKeys.dogs.byOwner(data.ownerId));
        }
      }
    }
  );
}

// Hook for updating a dog
export function useUpdateDog() {
  const queryClient = useQueryClient();
  
  return useMutation<
    Dog,
    Error,
    { id: string; data: Partial<Dog> }
  >(
    async ({ id, data }) => {
      const response = await api.patch<Dog>(`/api/data/dogs/${id}`, data);
      if (!response.ok) {
        throw new Error(response.error || `Failed to update dog ${id}`);
      }
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Update cache for this specific dog
        queryClient.setQueryData(queryKeys.dogs.byId(data.id), data);
        
        // Invalidate any dog lists that might include this dog
        queryClient.invalidateQueries(queryKeys.dogs.all());
        queryClient.invalidateQueries(queryKeys.dogs.byOwner(data.ownerId));
      }
    }
  );
}

// Hook for deleting a dog
export function useDeleteDog() {
  const queryClient = useQueryClient();
  
  return useMutation<boolean, Error, string>(
    async (id) => {
      const response = await api.delete<{ success: boolean }>(`/api/data/dogs/${id}`);
      if (!response.ok) {
        throw new Error(response.error || `Failed to delete dog ${id}`);
      }
      return response.data.success;
    },
    {
      onSuccess: (_, id) => {
        // Remove the dog from the cache
        queryClient.removeQueries(queryKeys.dogs.byId(id));
        
        // Invalidate all dog lists
        queryClient.invalidateQueries(queryKeys.dogs.all());
      }
    }
  );
}

// ==================== OWNER HOOKS ====================

// Hook for fetching owner profile by user ID
export function useOwnerByUserId(userId?: string) {
  const { user } = useAuth();
  
  return useQuery<OwnerResponse, Error>(
    queryKeys.owners.byUser(userId || user?.id || ''),
    async () => {
      const effectiveUserId = userId || user?.id;
      
      if (!effectiveUserId) {
        throw new Error('No user ID available');
      }
      
      const response = await api.get<OwnerResponse>(`/api/data/owners/byUserId/${effectiveUserId}`);
      if (!response.ok) {
        // Handle gracefully if owner not found
        if (response.status === 404) {
          throw new Error('No owner profile found for this user');
        }
        throw new Error(response.error || 'Failed to fetch owner profile');
      }
      return response.data;
    },
    {
      enabled: !!(userId || user?.id),
      staleTime: 5 * 60 * 1000, // 5 minutes - owner data changes infrequently
      retry: (failureCount, error) => {
        // Don't retry if the owner profile doesn't exist
        if (error.message === 'No owner profile found for this user') {
          return false;
        }
        return failureCount < 2;
      }
    }
  );
}

// Hook for ensuring owner profile exists
export function useEnsureOwnerProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation<Owner, Error, { name?: string; email?: string }>(
    async (ownerData) => {
      if (!user?.id) {
        throw new Error('No user ID available');
      }
      
      const data = {
        userId: user.id,
        name: ownerData.name || user.name || 'Dog Owner',
        email: ownerData.email || user.email
      };
      
      const response = await api.post<Owner>('/api/data/owners/ensure', data);
      if (!response.ok) {
        throw new Error(response.error || 'Failed to ensure owner profile');
      }
      
      // Update user in localStorage to include profile ID
      try {
        const storedUser = JSON.parse(localStorage.getItem('wanderpaws_user') || '{}');
        storedUser.profileId = response.data.id;
        localStorage.setItem('wanderpaws_user', JSON.stringify(storedUser));
        console.log('Updated user in localStorage with profileId:', response.data.id);
      } catch (e) {
        console.error('Error updating localStorage with owner profile ID:', e);
      }
      
      return response.data;
    },
    {
      onSuccess: (data) => {
        // Update all owner queries
        queryClient.invalidateQueries(queryKeys.owners.all());
        queryClient.invalidateQueries(queryKeys.owners.byUser(user?.id || ''));
        
        // Set this specific owner's data
        queryClient.setQueryData(queryKeys.owners.byId(data.id), data);
      }
    }
  );
}

// ==================== SUBSCRIPTION HOOKS ====================

// Hook for fetching subscription plans
export function useSubscriptionPlans() {
  return useQuery<SubscriptionPlan[], Error>(
    queryKeys.subscriptions.plans(),
    async () => {
      const response = await api.get<SubscriptionPlansResponse>('/api/subscriptions/plans');
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch subscription plans');
      }
      return response.data.plans || [];
    },
    {
      staleTime: 60 * 60 * 1000, // 1 hour - plans change infrequently
    }
  );
}

// Hook for fetching user subscriptions
export function useUserSubscriptions() {
  const { user } = useAuth();
  
  return useQuery<UserSubscription[], Error>(
    queryKeys.subscriptions.userSubscriptions(),
    async () => {
      if (!user?.id) {
        return [];
      }
      
      const response = await api.get<UserSubscriptionsResponse>('/api/subscriptions/users');
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch user subscriptions');
      }
      
      // Filter to just this user's subscriptions
      const allSubs = response.data.subscriptions || [];
      return allSubs.filter(sub => 
        sub.userId === user.id || 
        sub.userId === user.profileId
      );
    },
    {
      enabled: !!user?.id,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
}

// Hook for creating a subscription
export function useCreateSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation<
    UserSubscription, 
    Error,
    { planId: string }
  >(
    async ({ planId }) => {
      const response = await api.post<UserSubscription>(
        '/api/subscriptions/users',
        { planId }
      );
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to create subscription');
      }
      
      return response.data;
    },
    {
      onSuccess: () => {
        // Invalidate subscription queries
        queryClient.invalidateQueries(queryKeys.subscriptions.userSubscriptions());
      }
    }
  );
} 