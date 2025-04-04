import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import apiClient from '@/lib/api/client';
import { UserSubscription } from '@/lib/types';

interface UserSubscriptionsResponse {
  subscriptions?: UserSubscription[];
}

// Query keys for consistent cache management
export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  user: (id: string) => [...subscriptionKeys.all, 'user', id] as const,
};

// Hook to fetch user's active subscriptions
export function useUserSubscriptions() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: subscriptionKeys.user(user?.id || ''),
    queryFn: async () => {
      if (!user) {
        console.error('❌ No user in context for subscription fetch');
        return [];
      }
      
      console.log('💳 Fetching subscriptions for user:', user.id);
      
      try {
        // Try with user ID first
        try {
          console.log('🔍 Trying with user.id:', user.id);
          const response = await apiClient.get<UserSubscriptionsResponse>(`/data/subscriptions/users?userId=${user.id}`);
          
          if (response.ok) {
            const data = response.data || {};
            console.log('✅ Subscription data via user.id:', data);
            
            if (data.subscriptions && Array.isArray(data.subscriptions)) {
              return data.subscriptions;
            } else if (Array.isArray(data)) {
              return data;
            }
          }
        } catch (error) {
          console.warn('❌ Error fetching subscriptions with user.id:', error);
        }
        
        // Then try with profileId fallback
        if (user.profileId) {
          try {
            console.log('🔍 Trying with profileId instead:', user.profileId);
            const profileResponse = await apiClient.get<UserSubscriptionsResponse>(`/data/subscriptions/users?userId=${user.profileId}`);
            
            if (profileResponse.ok) {
              const profileData = profileResponse.data || {};
              console.log('✅ Subscription data via profileId:', profileData);
              
              if (profileData.subscriptions && Array.isArray(profileData.subscriptions)) {
                return profileData.subscriptions;
              } else if (Array.isArray(profileData)) {
                return profileData;
              }
            }
          } catch (profileError) {
            console.warn('❌ Error fetching subscriptions with profileId:', profileError);
          }
        }
        
        // Try data API as a last resort
        try {
          console.log('🔍 Trying data API fallback');
          const dataResponse = await apiClient.get<UserSubscriptionsResponse>(`/data/subscriptions?userId=${user.id}`);
          
          if (dataResponse.ok) {
            const dataResult = dataResponse.data || {};
            console.log('✅ Subscription data via data API:', dataResult);
            
            if (dataResult.subscriptions && Array.isArray(dataResult.subscriptions)) {
              return dataResult.subscriptions;
            } else if (Array.isArray(dataResult)) {
              return dataResult;
            }
          }
        } catch (dataError) {
          console.warn('❌ Error fetching subscriptions from data API:', dataError);
        }
        
        // Return empty array if all methods fail
        console.warn('⚠️ All subscription fetch methods failed, returning empty array');
        return [];
      } catch (error) {
        console.error('❌ Error in useUserSubscriptions:', error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
}

// Helper to find the active subscription from a list
export function findActiveSubscription(subscriptions: UserSubscription[] = []): UserSubscription | undefined {
  const now = new Date();
  return subscriptions.find(sub => 
    sub.status === 'active' && new Date(sub.endDate) > now
  );
}

// Helper to check if a user has an active subscription
export function useHasActiveSubscription() {
  const { data: subscriptions = [] } = useUserSubscriptions();
  const activeSubscription = findActiveSubscription(subscriptions);
  return !!activeSubscription;
} 