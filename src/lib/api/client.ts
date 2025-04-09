import axios from 'axios';
import type { AxiosError, AxiosResponse } from 'axios';
import { getSession, refreshToken, Session } from '../auth/session';
import { logger } from '../utils/logger';

// Extend the AxiosResponse type to include 'ok' and 'error' properties
declare module 'axios' {
  interface AxiosResponse<T = any> {
    ok: boolean;
    error?: string;
  }
}

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 
    'Content-Type': 'application/json',
    'Cache-Control': 'max-age=300' // 5 min cache
  }
});

// Request interceptor to add auth headers
apiClient.interceptors.request.use(config => {
  const session = getSession();
  
  logger.info('API Request', { 
    method: config.method?.toUpperCase(),
    url: config.url,
    hasSession: !!session
  });
  
  if (session) {
    // Add all auth headers
    config.headers['user-id'] = session.userId;
    config.headers['user-role'] = session.role;
    
    if (session.profileId) {
      config.headers['user-profile-id'] = session.profileId;
    }
    
    if (session.token) {
      config.headers['Authorization'] = `Bearer ${session.token}`;
    }
    
    // Log auth details
    logger.info('Auth headers set', {
      userId: session.userId,
      role: session.role,
      hasProfileId: !!session.profileId,
      hasToken: !!session.token
    });
  } else {
    logger.warn('No session available for API request', { 
      url: config.url 
    });
  }
  
  // Debug log headers
  const sanitizedHeaders = { ...config.headers };
  if (sanitizedHeaders.Authorization) {
    sanitizedHeaders.Authorization = 'Bearer [REDACTED]';
  }
  
  logger.info('Request headers', sanitizedHeaders);
  
  if (config.data) {
    logger.info('Request payload', {
      dataSize: JSON.stringify(config.data).length,
      dataKeys: Object.keys(config.data)
    });
  }
  
  return config;
});

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Add ok property to successful responses
    response.ok = response.status >= 200 && response.status < 300;
    
    logger.info('API Response success', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      dataSize: JSON.stringify(response.data).length
    });
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const originalUrl = originalRequest?.url || 'unknown';
    
    // Add ok and error properties to error responses
    if (error.response) {
      error.response.ok = false;
      error.response.error = error.message || 'An error occurred';
      
      logger.error('API Response error', {
        method: originalRequest?.method?.toUpperCase(),
        url: originalUrl,
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      
      // Special handling for 401 Unauthorized
      if (error.response.status === 401) {
        logger.warn('Authentication failure', { 
          url: originalUrl,
          headers: originalRequest?.headers
        });
      }
    } else {
      logger.error('Network Error', { 
        message: error.message,
        url: originalUrl
      });
    }
    
    // Handle 401 Unauthorized errors - try to refresh token if possible
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._isRetry) {
      try {
        (originalRequest as any)._isRetry = true;
        
        logger.info('Attempting token refresh after 401', {
          url: originalUrl
        });
        
        // Attempt to refresh the token
        const refreshed = await refreshToken();
        if (refreshed) {
          logger.success('Token refreshed successfully, retrying request', {
            url: originalUrl
          });
          
          // Get the fresh session
          const session = getSession();
          if (session && session.token) {
            // Update authorization header with new token
            originalRequest.headers['Authorization'] = `Bearer ${session.token}`;
          }
          
          // Retry the original request with new token
          return apiClient(originalRequest);
        } else {
          logger.warn('Token refresh failed', {
            url: originalUrl
          });
        }
      } catch (refreshError) {
        logger.error('Token refresh error', { 
          error: refreshError,
          url: originalUrl
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 