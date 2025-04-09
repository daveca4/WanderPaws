/**
 * Standard data fetching hooks to be used across all dashboard pages
 * for consistent data retrieval throughout the application.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import apiClient from '../api/client';
import { queryKeys } from '../queryClient';
import { logger } from '../utils/logger';

/**
 * Generic data fetching hook with standardized error handling and data processing
 * 
 * @param endpoint The API endpoint to fetch data from
 * @param queryKey The React Query key for caching
 * @param options Additional configuration options
 * @returns The query result with data, loading state, and error
 */
export function useFetchData<T>(
  endpoint: string,
  queryKey: unknown[],
  options: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
    retry?: number;
    select?: (data: any) => T;
    requireAuth?: boolean;
    requireRole?: string | string[];
    customHeaders?: Record<string, string>;
  } = {}
) {
  const { 
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes default
    refetchInterval = undefined,
    refetchOnWindowFocus = true,
    refetchOnMount = true,
    retry = 2,
    select,
    requireAuth = true,
    requireRole,
    customHeaders = {}
  } = options;
  
  const { user } = useAuth();
  
  // Determine if the query should be enabled based on auth requirements
  const isEnabled = enabled && 
    (!requireAuth || !!user) && 
    (!requireRole || (
      Array.isArray(requireRole) 
        ? requireRole.includes(user?.role || '')
        : user?.role === requireRole
    ));
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      logger.info(`Fetching data from ${endpoint}`, { queryKey });
      
      if (requireAuth && !user) {
        logger.error('Authentication required but user not found', { endpoint });
        throw new Error('Authentication required');
      }
      
      if (requireRole) {
        const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
        if (!user?.role || !roles.includes(user.role)) {
          logger.error('Unauthorized: Incorrect role', { 
            endpoint, 
            requiredRoles: roles, 
            userRole: user?.role 
          });
          throw new Error(`Unauthorized: ${roles.join(' or ')} role required`);
        }
      }
      
      // Add auth headers
      const headers: Record<string, string> = { ...customHeaders };
      if (user) {
        if (user.id) headers['user-id'] = user.id;
        if (user.role) headers['user-role'] = user.role;
        if (user.profileId) headers['user-profile-id'] = user.profileId;
      }
      
      try {
        const response = await apiClient.get(endpoint, { headers });
        
        if (!response.ok) {
          logger.error(`API error from ${endpoint}`, { 
            status: response.status, 
            error: response.error 
          });
          throw new Error(response.error || `Failed to fetch data from ${endpoint}`);
        }
        
        logger.success(`Successfully fetched data from ${endpoint}`, {
          dataSize: typeof response.data === 'object' ? 
            Object.keys(response.data).length : 
            (response.data ? 1 : 0)
        });
        
        return response.data;
      } catch (error) {
        logger.error(`Error fetching data from ${endpoint}`, { error });
        throw error;
      }
    },
    enabled: isEnabled,
    staleTime,
    refetchInterval,
    refetchOnWindowFocus,
    refetchOnMount,
    retry,
    select,
  });
}

/**
 * Generic data mutation hook with standardized error handling
 * 
 * @param endpoint The API endpoint to send data to
 * @param method The HTTP method to use (post, put, delete, patch)
 * @param options Additional configuration options
 * @returns The mutation function and state
 */
export function useDataMutation<T, TVariables>(
  endpoint: string,
  method: 'post' | 'put' | 'delete' | 'patch',
  options: {
    onSuccessQueryKey?: unknown[];
    onSuccessCallback?: (data: T, variables: TVariables) => void;
    onErrorCallback?: (error: Error, variables: TVariables) => void;
    requireAuth?: boolean;
    requireRole?: string | string[];
    customHeaders?: Record<string, string>;
  } = {}
) {
  const {
    onSuccessQueryKey,
    onSuccessCallback,
    onErrorCallback,
    requireAuth = true,
    requireRole,
    customHeaders = {}
  } = options;
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation<T, Error, TVariables>({
    mutationFn: async (variables: TVariables): Promise<T> => {
      logger.info(`Making ${method.toUpperCase()} request to ${endpoint}`, { 
        method, 
        variables: typeof variables === 'object' && variables !== null ? 
          Object.keys(variables as object) : 
          'primitive' 
      });
      
      if (requireAuth && !user) {
        logger.error('Authentication required but user not found', { endpoint, method });
        throw new Error('Authentication required');
      }
      
      if (requireRole) {
        const roles = Array.isArray(requireRole) ? requireRole : [requireRole];
        if (!user?.role || !roles.includes(user.role)) {
          logger.error('Unauthorized: Incorrect role', { 
            endpoint, 
            method,
            requiredRoles: roles, 
            userRole: user?.role 
          });
          throw new Error(`Unauthorized: ${roles.join(' or ')} role required`);
        }
      }
      
      // Add auth headers
      const headers: Record<string, string> = { ...customHeaders };
      if (user) {
        if (user.id) headers['user-id'] = user.id;
        if (user.role) headers['user-role'] = user.role;
        if (user.profileId) headers['user-profile-id'] = user.profileId;
      }
      
      try {
        let response;
        
        switch (method) {
          case 'post':
            response = await apiClient.post(endpoint, variables, { headers });
            break;
          case 'put':
            response = await apiClient.put(endpoint, variables, { headers });
            break;
          case 'patch':
            response = await apiClient.patch(endpoint, variables, { headers });
            break;
          case 'delete':
            response = await apiClient.delete(endpoint, { 
              headers,
              data: variables 
            });
            break;
        }
        
        if (!response.ok) {
          logger.error(`API error from ${endpoint}`, {
             method: method.toUpperCase(),
             status: response.status, 
             error: response.error 
           });
           const errorDetail = response.data?.error || response.error || `Failed to ${method} data to ${endpoint}`;
          throw new Error(errorDetail);
        }
        
        logger.success(`Successfully sent ${method.toUpperCase()} request to ${endpoint}`);
        return response.data as T;
      } catch (error) {
        logger.error(`Error sending ${method.toUpperCase()} request to ${endpoint}`, { 
            error: error instanceof Error ? error.message : String(error) 
        });
        throw error instanceof Error ? error : new Error(String(error));
      }
    },
    onSuccess: (data, variables) => {
      if (onSuccessQueryKey) {
        queryClient.invalidateQueries({ queryKey: onSuccessQueryKey });
      }
      if (onSuccessCallback) {
        onSuccessCallback(data, variables);
      }
    },
    onError: (error, variables) => {
        if (onErrorCallback) {
            onErrorCallback(error, variables);
        }
    }
  });
} 