import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys, getAuthHeaders } from '@/lib/queryClient';
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
  return useQuery({
    queryKey: queryKeys.dogs.all(),
    queryFn: async () => {
      const response = await api.get<DogsResponse>('/api/data/dogs');
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch dogs');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Hook for fetching dogs by owner ID
export const useOwnerDogs = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.dogs.list({ ownerId: user?.profileId }),
    queryFn: async () => {
      if (!user?.profileId) {
        return [];
      }
      const result = await api.get<{data: Dog[]}>(`/api/owners/${user.profileId}/dogs`);
      return result.data || [];
    },
    enabled: !!user?.profileId,
  });
};

// Hook for fetching a single dog
export function useDog(id?: string) {
  return useQuery({
    queryKey: queryKeys.dogs.byId(id || ''),
    queryFn: async () => {
      const response = await api.get<Dog>(`/api/data/dogs/${id}`);
      if (!response.ok) {
        throw new Error(response.error || `Failed to fetch dog ${id}`);
      }
      return response.data;
    },
    enabled: !!id,
  });
}

// Hook for creating a dog
export function useCreateDog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newDog: Omit<Dog, 'id'>) => {
      const response = await api.post<Dog>('/api/data/dogs', newDog);
      if (!response.ok) {
        throw new Error(response.error || 'Failed to create dog');
      }
      return response.data;
    },
    onSuccess: (data: Dog) => {
      // Invalidate all dog queries to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.dogs.all() });
      
      // If we know this dog's owner, invalidate that specific owner's dogs
      if (data.ownerId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.dogs.list({ ownerId: data.ownerId }) });
      }
    }
  });
}

// Hook for updating a dog
export const useUpdateDog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updatedDog: Partial<Dog> & { id: string }) => {
      const result = await api.put<{data: Dog}>(`/api/dogs/${updatedDog.id}`, updatedDog);
      return result.data.data;
    },
    onSuccess: (data: Dog, variables: Partial<Dog> & { id: string }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.dogs.byId(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dogs.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dogs.list({ ownerId: data.ownerId }) });
    },
  });
};

// Hook for deleting a dog
export function useDeleteDog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ success: boolean }>(`/api/data/dogs/${id}`);
      if (!response.ok) {
        throw new Error(response.error || `Failed to delete dog ${id}`);
      }
      return response.data.success;
    },
    onSuccess: (_: boolean, id: string) => {
      // Remove the dog from the cache
      queryClient.removeQueries({ queryKey: queryKeys.dogs.byId(id) });
      
      // Invalidate all dog lists
      queryClient.invalidateQueries({ queryKey: queryKeys.dogs.all() });
    }
  });
}

// ==================== OWNER HOOKS ====================

// Hook for fetching owner profile by user ID
export function useOwnerByUserId(userId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.owners.byUser(userId || user?.id || ''),
    queryFn: async () => {
      const effectiveUserId = userId || user?.id;
      
      if (!effectiveUserId) {
        throw new Error('No user ID available');
      }
      
      const response = await api.get<Owner>(`/api/data/owners/byUserId/${effectiveUserId}`);
      if (!response.ok) {
        // Handle gracefully if owner not found
        if (response.status === 404) {
          throw new Error('No owner profile found for this user');
        }
        throw new Error(response.error || 'Failed to fetch owner profile');
      }
      return response.data;
    },
    enabled: !!(userId || user?.id),
    staleTime: 5 * 60 * 1000, // 5 minutes - owner data changes infrequently
    retry: (failureCount: number, error: Error) => {
      // Don't retry if the owner profile doesn't exist
      if (error.message === 'No owner profile found for this user') {
        return false;
      }
      return failureCount < 2;
    }
  });
}

// Hook for ensuring owner profile exists
export function useEnsureOwnerProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (ownerData: { name?: string; email?: string }) => {
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
    onSuccess: (data: Owner) => {
      // Update all owner queries
      queryClient.invalidateQueries({ queryKey: queryKeys.owners.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.owners.byUser(user?.id || '') });
      
      // Set this specific owner's data
      queryClient.setQueryData(queryKeys.owners.byId(data.id), data);
    }
  });
}

// ==================== SUBSCRIPTION HOOKS ====================

// Hook for fetching subscription plans
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: queryKeys.subscriptions.plans(),
    queryFn: async () => {
      const response = await api.get<SubscriptionPlansResponse>('/api/subscriptions/plans');
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch subscription plans');
      }
      return response.data.plans || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour - plans change infrequently
  });
}

// Hook for fetching user subscriptions
export function useUserSubscriptions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.subscriptions.userSubscriptions(),
    queryFn: async () => {
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
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook for creating a subscription
export function useCreateSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ planId }: { planId: string }) => {
      const response = await api.post<UserSubscription>(
        '/api/subscriptions/users',
        { planId }
      );
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to create subscription');
      }
      
      return response.data;
    },
    onSuccess: () => {
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.userSubscriptions() });
    }
  });
}

// Submits feedback for a completed walk
export const useSubmitWalkFeedback = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      walkId, 
      feedback 
    }: { 
      walkId: string; 
      feedback: { 
        rating: number; 
        comment: string 
      } 
    }) => {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/walks/${walkId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(feedback),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to submit walk feedback');
      }
      
      return response.json();
    },
    onSuccess: (_data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.walks.byId(variables.walkId)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.walks.all()
      });
    },
  });
}; 