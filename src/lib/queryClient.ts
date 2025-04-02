import { QueryClient } from '@tanstack/react-query';

// Helper for auth headers to standardize auth for all API calls
export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  
  // Get user from localStorage
  try {
    const storedUser = localStorage.getItem('wanderpaws_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const headers: Record<string, string> = {};
      
      if (user.id) headers['user-id'] = user.id;
      if (user.role) headers['user-role'] = user.role;
      if (user.profileId) headers['user-profile-id'] = user.profileId;
      
      return headers;
    }
    
    // Fallback to 'user' key
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      return {};
    }

    const user = JSON.parse(userJson);
    if (!user || !user.token) {
      return {};
    }

    return {
      'Authorization': `Bearer ${user.token}`
    };
  } catch (e) {
    console.error('Error getting auth headers:', e);
    return {};
  }
}

// Define standard query keys for cache management
export const queryKeys = {
  // Dog-related queries
  dogs: {
    all: () => ['dogs'],
    byId: (id: string) => ['dogs', id],
    byWalker: (walkerId: string) => ['dogs', 'walker', walkerId],
    list: (params?: Record<string, any>) => ['dogs', 'list', params],
  },
  
  // Owner-related queries
  owners: {
    all: () => ['owners'],
    byId: (id: string) => ['owners', 'id', id],
    byUser: (userId: string) => ['owners', 'user', userId],
  },
  
  // Walker-related queries
  walkers: {
    all: () => ['walkers'],
    byId: (id: string) => ['walkers', 'id', id],
    byUser: (userId: string) => ['walkers', 'user', userId],
    nearby: (lat: number, lng: number) => ['walkers', 'nearby', lat, lng],
  },
  
  // Walk-related queries
  walks: {
    all: () => ['walks'],
    byId: (id: string) => ['walks', id],
    byDog: (dogId: string) => ['walks', 'dog', dogId],
    byWalker: (walkerId: string) => ['walks', 'walker', walkerId],
    upcoming: (profileId?: string) => ['walks', 'upcoming', profileId],
    completed: (profileId?: string) => ['walks', 'completed', profileId],
    availability: (dogId: string, date: string) => ['walks', 'availability', dogId, date],
    locations: (walkId: string) => ['walks', walkId, 'locations'],
  },
  
  // Assessment-related queries
  assessments: {
    all: () => ['assessments'],
    byDog: (dogId: string) => ['assessments', 'dog', dogId],
    byId: (id: string) => ['assessments', 'id', id],
    byWalker: (walkerId?: string) => walkerId 
      ? ['assessments', 'walker', walkerId]
      : ['assessments', 'walker'],
    pending: () => ['assessments', 'pending'],
  },
  
  // Subscription-related queries
  subscriptions: {
    plans: () => ['subscriptions', 'plans'],
    userSubscriptions: () => ['subscriptions', 'user'],
  },
  
  // User-related queries
  users: {
    all: () => ['users'],
    byId: (id: string) => ['users', 'id', id],
    current: () => ['users', 'current'],
  },
  
  // Admin-specific queries
  admin: {
    analytics: () => ['admin', 'analytics'],
    dashboard: () => ['admin', 'dashboard'],
    users: (filters?: Record<string, any>) => ['admin', 'users', filters],
    walkers: (filters?: Record<string, any>) => ['admin', 'walkers', filters],
    owners: (filters?: Record<string, any>) => ['admin', 'owners', filters],
    walks: (filters?: Record<string, any>) => ['admin', 'walks', filters],
    pendingAssessments: () => ['admin', 'pendingAssessments'],
    subscriptions: (filters?: Record<string, any>) => ['admin', 'subscriptions', filters],
  },
};

// Create a queryClient with default options
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
        throwOnError: false,
      },
      mutations: {
        throwOnError: false,
        retry: 0,
      },
    },
  });
} 