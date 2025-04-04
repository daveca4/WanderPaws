import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { queryKeys, getAuthHeaders } from '@/lib/queryClient';
import { Dog, Owner, Walker, Walk, Assessment, UserSubscription, SubscriptionPlan } from '../types';
import { useAuth } from '../auth/AuthContext';

// Type definitions for query responses
type DogsResponse = Dog[];
type OwnersResponse = Owner[];
type WalkersResponse = Walker[];
type WalksResponse = Walk[];
type AssessmentsResponse = Assessment[];
type UserSubscriptionsResponse = UserSubscription[];
type SubscriptionPlansResponse = SubscriptionPlan[];

// ==================== DOG HOOKS ====================

// Hook to fetch all dogs
export function useAllDogs() {
  return useQuery({
    queryKey: queryKeys.dogs.all(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<DogsResponse>('/data/dogs');
        return response.data;
      } catch (error) {
        console.error('Failed to fetch dogs:', error);
        throw new Error('Failed to fetch dogs');
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch owner's dogs (only accessible to owners)
export function useOwnerDogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: queryKeys.dogs.byOwner(user?.profileId || ''),
    queryFn: async () => {
      if (!user || user.role !== 'owner' || !user.profileId) {
        console.error('Unauthorized: Only owners can access their dogs', { user });
        return [];
      }
      
      console.log('🐕 Fetching dogs for owner with profile ID:', user.profileId);
      
      try {
        // First try the dogs API endpoint - the general endpoint that returns dogs for current user
        try {
          console.log('🔍 Trying general /data/dogs API endpoint...');
          const dogsResult = await apiClient.get('/data/dogs');
          console.log('✅ Response from /data/dogs:', dogsResult);
          
          if (dogsResult.ok) {
            const dogs = dogsResult.data || [];
            console.log('✅ Found dogs via dogs API:', dogs.length);
            return dogs;
          }
        } catch (dogsError) {
          console.warn('❌ Error fetching from /data/dogs:', dogsError);
        }
        
        // Then try the owner-specific endpoint
        console.log('🔍 Trying owner-specific endpoint...');
        const result = await apiClient.get(`/data/owners/${user.profileId}/dogs`);
        console.log('✅ API Response from owner-specific endpoint:', result);
        
        if (!result.ok) {
          console.error('❌ Error response from dogs API:', result.error);
          throw new Error(result.error || 'Failed to fetch dogs');
        }
        
        // Handle different response structures
        let dogs;
        if (Array.isArray(result.data)) {
          dogs = result.data;
        } else if (result.data && typeof result.data === 'object') {
          if (result.data.data && Array.isArray(result.data.data)) {
            dogs = result.data.data;
          } else {
            dogs = result.data;
          }
        } else {
          dogs = [];
        }
        
        console.log('✅ Final parsed dogs data:', dogs);
        return dogs;
      } catch (error) {
        console.error('❌ Error fetching owner dogs:', error);
        // Return empty array instead of throwing to avoid breaking the UI
        return [];
      }
    },
    enabled: !!user && user.role === 'owner' && !!user.profileId,
    staleTime: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
  });
}

// Hook to fetch a specific dog by ID
export function useDogById(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dogs.byId(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Dog ID is required');
      try {
        const response = await apiClient.get<Dog>(`/data/dogs/${id}`);
        return response.data;
      } catch (error) {
        console.error(`Failed to fetch dog ${id}:`, error);
        throw new Error(`Failed to fetch dog ${id}`);
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to create a new dog
export function useCreateDog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newDog: Omit<Dog, 'id'>) => {
      try {
        const response = await apiClient.post<Dog>('/data/dogs', newDog);
        return response.data;
      } catch (error) {
        console.error('Failed to create dog:', error);
        throw new Error('Failed to create dog');
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.dogs.all() });
    },
  });
}

// Hook to update a dog
export function useUpdateDog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updatedDog: Partial<Dog> & { id: string }) => {
      const result = await apiClient.put<{data: Dog}>(`/dogs/${updatedDog.id}`, updatedDog);
      return result.data.data;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.dogs.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dogs.byId(data.id) });
    },
  });
}

// Hook to delete a dog
export function useDeleteDog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const response = await apiClient.delete<{ success: boolean }>(`/data/dogs/${id}`);
        return response.data;
      } catch (error) {
        console.error(`Failed to delete dog ${id}:`, error);
        throw new Error(`Failed to delete dog ${id}`);
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({ queryKey: queryKeys.dogs.all() });
    },
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
      
      const response = await apiClient.get<Owner>(`/data/owners/byUserId/${effectiveUserId}`);
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
  
  const getOwnerProfile = async (userId: string) => {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const effectiveUserId = userId;
      if (!effectiveUserId) {
        throw new Error('User ID is required');
      }
      
      try {
        const response = await apiClient.get<Owner>(`/data/owners/byUserId/${effectiveUserId}`);
        return response.data;
      } catch (error) {
        // Handle gracefully if owner not found
        return null;
      }
    } catch (error) {
      console.error('Error fetching owner profile:', error);
      throw error;
    }
  };
  
  const createOwnerProfile = async (userId: string) => {
    try {
      // Basic data for creating a new owner profile
      const data = {
        userId,
        name: user?.name || 'Pet Owner',
        email: user?.email || '',
      };
      
      const response = await apiClient.post<Owner>('/data/owners/ensure', data);
      return response.data;
    } catch (error) {
      console.error('Error creating owner profile:', error);
      throw new Error('Failed to ensure owner profile');
    }
  };
  
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error('User must be logged in');
      }
      
      // First try to get the existing profile
      const existingProfile = await getOwnerProfile(user.id);
      
      // If profile exists, return it
      if (existingProfile) {
        return existingProfile;
      }
      
      // Otherwise create a new one
      return createOwnerProfile(user.id);
    },
    onSuccess: (ownerProfile) => {
      // Update the user with the owner profile ID
      if (ownerProfile?.id && user) {
        const updatedUser = {
          ...user,
          profileId: ownerProfile.id,
        };
        
        // Update local storage
        localStorage.setItem('wanderpaws_user', JSON.stringify(updatedUser));
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['user'] });
      }
    },
  });
}

// ==================== SUBSCRIPTION HOOKS ====================

// Hook to fetch all subscription plans
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: queryKeys.subscriptions.plans(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<SubscriptionPlansResponse>('/subscriptions/plans');
        return response.data;
      } catch (error) {
        console.error('Failed to fetch subscription plans:', error);
        throw new Error('Failed to fetch subscription plans');
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Hook to fetch user subscriptions
export function useUserSubscriptions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: queryKeys.subscriptions.user(user?.id || ''),
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      
      try {
        const response = await apiClient.get<UserSubscriptionsResponse>('/subscriptions/users');
        return response.data;
      } catch (error) {
        console.error('Failed to fetch user subscriptions:', error);
        throw new Error('Failed to fetch user subscriptions');
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to subscribe to a plan
export function useSubscribeToPlan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ planId }: { planId: string }) => {
      const response = await apiClient.post<UserSubscription>(
        '/subscriptions/users',
        { planId }
      );
      return response.data;
    },
    onSuccess: (sub) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.user(user?.id || '') });
    },
  });
}

// Submits feedback for a completed walk
export function useSubmitWalkFeedback() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ walkId, rating, comment }: { walkId: string; rating: number; comment?: string }) => {
      const response = await apiClient.post(`/walks/${walkId}/feedback`, { rating, comment });
      
      if (!response.ok) {
        throw new Error(response.error || 'Failed to submit feedback');
      }
      
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['walks'] });
    },
    onError: (error: Error) => {
      console.error('Error submitting walk feedback:', error);
    }
  });
} 