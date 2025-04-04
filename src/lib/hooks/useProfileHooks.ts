import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import apiClient from '@/lib/api/client';
import { Owner, Walker } from '@/lib/types';

// Query keys for profile data
export const profileKeys = {
  all: ['profiles'] as const,
  owner: (id: string) => [...profileKeys.all, 'owner', id] as const,
  walker: (id: string) => [...profileKeys.all, 'walker', id] as const,
  byUserId: (userId: string) => [...profileKeys.all, 'user', userId] as const,
};

// Hook to fetch the current user's owner profile
export function useOwnerProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: profileKeys.owner(user?.profileId || ''),
    queryFn: async () => {
      if (!user || user.role !== 'owner') {
        console.error('❌ User is not an owner or undefined', user);
        return null;
      }
      
      // If we have a profileId, use that first
      if (user.profileId) {
        try {
          console.log('🔍 Fetching owner profile with profileId:', user.profileId);
          const response = await apiClient.get<Owner>(`/data/owners/${user.profileId}`);
          
          if (response.ok) {
            console.log('✅ Owner profile found via profileId:', response.data);
            return response.data;
          }
        } catch (error) {
          console.warn('❌ Error fetching owner by profileId:', error);
        }
      }
      
      // Fallback to looking up by userId
      try {
        console.log('🔍 Fetching owner profile by userId:', user.id);
        const response = await apiClient.get<{data?: Owner}>(`/data/owners/byUserId/${user.id}`);
        
        if (response.ok && response.data) {
          console.log('✅ Owner profile found via userId:', response.data);
          return response.data.data || response.data;
        }
      } catch (error) {
        console.warn('❌ Error fetching owner by userId:', error);
      }
      
      console.warn('⚠️ No owner profile found');
      return null;
    },
    enabled: !!user && user.role === 'owner',
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook to fetch the current user's walker profile
export function useWalkerProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: profileKeys.walker(user?.profileId || ''),
    queryFn: async () => {
      if (!user || user.role !== 'walker') {
        console.error('❌ User is not a walker or undefined', user);
        return null;
      }
      
      // If we have a profileId, use that first
      if (user.profileId) {
        try {
          console.log('🔍 Fetching walker profile with profileId:', user.profileId);
          const response = await apiClient.get<Walker>(`/data/walkers/${user.profileId}`);
          
          if (response.ok) {
            console.log('✅ Walker profile found via profileId:', response.data);
            return response.data;
          }
        } catch (error) {
          console.warn('❌ Error fetching walker by profileId:', error);
        }
      }
      
      // Fallback to looking up by userId
      try {
        console.log('🔍 Fetching walker profile by userId:', user.id);
        const response = await apiClient.get<{data?: Walker}>(`/data/walkers/byUserId/${user.id}`);
        
        if (response.ok && response.data) {
          console.log('✅ Walker profile found via userId:', response.data);
          return response.data.data || response.data;
        }
      } catch (error) {
        console.warn('❌ Error fetching walker by userId:', error);
      }
      
      console.warn('⚠️ No walker profile found');
      return null;
    },
    enabled: !!user && user.role === 'walker',
    staleTime: 60 * 1000, // 1 minute
  });
}

// Hook to fetch either owner or walker profile based on user role
export function useUserProfile() {
  const { user } = useAuth();
  const { data: ownerData, isLoading: isOwnerLoading } = useOwnerProfile();
  const { data: walkerData, isLoading: isWalkerLoading } = useWalkerProfile();
  
  return {
    data: user?.role === 'owner' ? ownerData : walkerData,
    isLoading: user?.role === 'owner' ? isOwnerLoading : isWalkerLoading,
  };
}

// Hook to ensure the current user has an owner profile
export function useEnsureOwnerProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Partial<Owner>) => {
      if (!user) {
        throw new Error('User is not authenticated');
      }
      
      console.log('🔍 Ensuring owner profile exists:', data);
      const response = await apiClient.post('/data/owners/ensure', {
        userId: user.id,
        name: data.name || user.name || '',
        email: data.email || user.email || '',
        ...data
      });
      
      if (!response.ok) {
        console.error('❌ Error creating owner profile:', response.error);
        throw new Error(response.error || 'Failed to create owner profile');
      }
      
      // Update user profile ID in the session if needed
      if (!user.profileId && response.data?.id) {
        // Call session update here if you have a way to do that
        console.log('✅ Owner profile created, profile ID:', response.data.id);
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.byUserId(user?.id || '') });
      queryClient.invalidateQueries({ queryKey: profileKeys.owner(data.id) });
    },
  });
}

// Hook to update owner profile
export function useUpdateOwnerProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Owner> }) => {
      console.log('🔍 Updating owner profile:', id, data);
      const response = await apiClient.patch(`/data/owners/${id}`, data);
      
      if (!response.ok) {
        console.error('❌ Error updating owner profile:', response.error);
        throw new Error(response.error || 'Failed to update owner profile');
      }
      
      console.log('✅ Updated owner profile:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.owner(data.id) });
      queryClient.invalidateQueries({ queryKey: profileKeys.byUserId(data.userId) });
    },
  });
} 