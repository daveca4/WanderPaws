/**
 * Standardized hooks for owner dashboard data fetching using the consistent data fetching pattern
 */

import { useFetchData, useDataMutation } from './useDataFetching';
import { queryKeys } from '../queryClient';
import { Dog, Owner, Walk, Assessment, UserSubscription, SubscriptionPlan } from '../types';
import { useAuth } from '../auth/AuthContext';

/**
 * Hook to fetch owner profile by user ID
 */
export function useOwnerProfile() {
  const { user } = useAuth();
  
  return useFetchData<Owner>(
    `/data/owners/byUserId/${user?.id || ''}`,
    queryKeys.owners.byUser(user?.id || ''),
    {
      enabled: !!user?.id,
      requireRole: 'owner',
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2
    }
  );
}

/**
 * Hook to fetch owner's dogs
 */
export function useOwnerDogs() {
  const { user } = useAuth();
  
  return useFetchData<Dog[]>(
    `/data/owners/${user?.profileId || ''}/dogs`,
    queryKeys.dogs.byOwner(user?.profileId || ''),
    {
      enabled: !!user?.profileId,
      requireRole: 'owner',
      staleTime: 10 * 1000, // 10 seconds
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      retry: 2
    }
  );
}

/**
 * Hook to fetch a specific dog by ID
 */
export function useDogById(id: string | undefined) {
  return useFetchData<Dog>(
    `/data/dogs/${id || ''}`,
    queryKeys.dogs.byId(id || ''),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Hook to create a new dog
 */
export function useCreateDog() {
  const { user } = useAuth();
  
  return useDataMutation<Dog, Omit<Dog, 'id'>>(
    '/data/dogs',
    'post',
    {
      requireRole: 'owner',
      onSuccessQueryKey: queryKeys.dogs.byOwner(user?.profileId || '')
    }
  );
}

/**
 * Hook to update a dog
 */
export function useUpdateDog() {
  return useDataMutation<Dog, Partial<Dog> & { id: string }>(
    `/data/dogs/update`,
    'put',
    {
      requireRole: 'owner',
      onSuccessQueryKey: queryKeys.dogs.all()
    }
  );
}

/**
 * Hook to delete a dog
 */
export function useDeleteDog() {
  return useDataMutation<{ success: boolean }, { id: string }>(
    `/data/dogs/delete`,
    'post',
    {
      requireRole: 'owner',
      onSuccessQueryKey: queryKeys.dogs.all()
    }
  );
}

/**
 * Hook to fetch subscription plans
 */
export function useSubscriptionPlans() {
  return useFetchData<SubscriptionPlan[]>(
    '/subscriptions/plans',
    queryKeys.subscriptions.plans(),
    {
      staleTime: 60 * 60 * 1000, // 1 hour - plans don't change often
    }
  );
}

/**
 * Hook to fetch user subscriptions
 */
export function useUserSubscriptions() {
  const { user } = useAuth();
  
  return useFetchData<UserSubscription[]>(
    '/subscriptions/user',
    queryKeys.subscriptions.user(user?.id || ''),
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );
}

/**
 * Hook to subscribe to a plan
 */
export function useSubscribeToPlan() {
  return useDataMutation<
    UserSubscription, 
    { planId: string; paymentMethodId?: string }
  >(
    '/subscriptions/subscribe',
    'post',
    {
      requireAuth: true,
      onSuccessQueryKey: queryKeys.subscriptions.user('')
    }
  );
}

/**
 * Hook to fetch owner's upcoming walks
 */
export function useUpcomingWalks() {
  const { user } = useAuth();
  
  return useFetchData<Walk[]>(
    `/data/owners/${user?.profileId || ''}/walks/upcoming`,
    queryKeys.walks.upcoming(user?.profileId),
    {
      enabled: !!user?.profileId,
      requireRole: 'owner',
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
      refetchOnWindowFocus: true,
    }
  );
}

/**
 * Hook to submit walk feedback
 */
export function useSubmitWalkFeedback() {
  return useDataMutation<
    Walk,
    { walkId: string; rating: number; comments: string; tags?: string[] }
  >(
    '/walks/feedback',
    'post',
    {
      requireRole: 'owner',
      onSuccessQueryKey: queryKeys.walks.all()
    }
  );
} 