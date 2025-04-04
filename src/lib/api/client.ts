import axios from 'axios';
import type { AxiosError, AxiosResponse } from 'axios';
import { getSession, refreshToken } from '../auth/session';

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
  if (session) {
    config.headers['user-id'] = session.userId;
    config.headers['user-role'] = session.role;
    
    if (session.profileId) {
      config.headers['user-profile-id'] = session.profileId;
    }
    
    if (session.token) {
      config.headers['Authorization'] = `Bearer ${session.token}`;
    }
  }
  
  // Debug log the request with additional details
  const requestDetails = {
    method: config.method?.toUpperCase(),
    url: config.url,
    headers: config.headers,
    data: config.data
  };
  
  console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
  console.log('📋 Headers:', JSON.stringify(config.headers, null, 2));
  
  if (config.data) {
    console.log('📦 Request Data:', JSON.stringify(config.data, null, 2));
  }
  
  return config;
});

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Add ok property to successful responses
    response.ok = response.status >= 200 && response.status < 300;
    
    console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url);
    console.log('📊 Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Add ok and error properties to error responses
    if (error.response) {
      error.response.ok = false;
      error.response.error = error.message || 'An error occurred';
      
      console.log('❌ API Error:', originalRequest?.method?.toUpperCase(), originalRequest?.url);
      console.log('📊 Status:', error.response.status);
      console.log('📦 Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Network Error:', error.message);
    }
    
    // Handle 401 Unauthorized errors - try to refresh token if possible
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._isRetry) {
      try {
        (originalRequest as any)._isRetry = true;
        
        // Attempt to refresh the token
        const refreshed = await refreshToken();
        if (refreshed) {
          // Retry the original request with new token
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 