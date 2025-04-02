import { QueryClient } from 'react-query';
import { getCurrentUser } from './auth';

// Predefined query keys to maintain consistency
export const queryKeys = {
  dogs: {
    all: () => ['dogs'],
    byOwner: (ownerId: string) => [...queryKeys.dogs.all(), 'owner', ownerId],
    byId: (id: string) => [...queryKeys.dogs.all(), id],
    list: (filters?: any) => [...queryKeys.dogs.all(), 'list', filters]
  },
  owners: {
    all: () => ['owners'],
    byUser: (userId: string) => [...queryKeys.owners.all(), 'user', userId],
    byId: (id: string) => [...queryKeys.owners.all(), id],
    profile: () => [...queryKeys.owners.all(), 'profile']
  },
  walkers: {
    all: () => ['walkers'],
    byId: (id: string) => [...queryKeys.walkers.all(), id]
  },
  walks: {
    all: () => ['walks'],
    byDog: (dogId: string) => [...queryKeys.walks.all(), 'dog', dogId],
    byWalker: (walkerId: string) => [...queryKeys.walks.all(), 'walker', walkerId]
  },
  assessments: {
    all: () => ['assessments'],
    byDog: (dogId: string) => [...queryKeys.assessments.all(), 'dog', dogId]
  },
  subscriptions: {
    plans: () => ['subscriptions', 'plans'],
    userSubscriptions: () => ['subscriptions', 'user']
  }
};

// Helper function to get auth headers for queries
export const getAuthHeaders = () => {
  const user = getCurrentUser();
  if (!user) return {};
  
  const headers: Record<string, string> = {
    'user-id': user.id,
    'user-role': user.role || '',
  };
  
  if (user.profileId) {
    headers['user-profile-id'] = user.profileId;
  }
  
  return headers;
};

// Configure default QueryClient with error handling and retries
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
          // Don't retry on 401/403/404
          if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
            return false;
          }
          // Retry other errors up to 2 times
          return failureCount < 2;
        },
        staleTime: 30000, // 30 seconds before data is considered stale
        cacheTime: 5 * 60 * 1000, // 5 minutes before unused data is garbage collected
        onError: (error: any) => {
          console.error('Query error:', error);
        }
      },
      mutations: {
        onError: (error: any) => {
          console.error('Mutation error:', error);
        }
      }
    }
  });
}; 