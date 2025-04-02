import { getAuthHeaders } from '../queryClient';

// API response type for type safety
type ApiResponse<T> = {
  data: T;
  status: number;
  ok: boolean;
  error?: string;
};

// Main API client function
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Create headers object with auth headers
  const authHeaders = getAuthHeaders();
  
  const headerValues = {
    'Content-Type': 'application/json',
    ...authHeaders,
    ...(options.headers instanceof Headers 
      ? Object.fromEntries(Array.from(options.headers.entries())) 
      : options.headers || {})
  };

  const config: RequestInit = {
    ...options,
    headers: headerValues
  };

  try {
    // Add cache busting for GET requests
    const url = options.method === 'GET' 
      ? `${endpoint}${endpoint.includes('?') ? '&' : '?'}_t=${Date.now()}` 
      : endpoint;
    
    console.log(`API ${options.method || 'GET'} request to ${url}`);
    const start = performance.now();
    
    const response = await fetch(url, config);
    const end = performance.now();
    
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try {
        // Try to parse as JSON anyway, in case Content-Type header is wrong
        data = JSON.parse(text);
      } catch {
        // If it's not JSON, use the text as data
        data = text;
      }
    }
    
    console.log(`API response from ${url} in ${Math.round(end - start)}ms:`, 
      response.status, response.ok ? 'OK' : 'ERROR');
    
    if (!response.ok) {
      console.error('API error:', data);
    }
    
    return {
      data,
      status: response.status,
      ok: response.ok,
      error: !response.ok ? data?.error || 'An unexpected error occurred' : undefined
    };
  } catch (error) {
    console.error('Network error:', error);
    return {
      data: null as unknown as T,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    apiClient<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, data: any, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  put: <T>(endpoint: string, data: any, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  patch: <T>(endpoint: string, data: any, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * API client utilities
 */

// Generic API request function with error handling
export const apiRequest = async <T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.message || `API request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return response.json();
};

// Specialized API request functions
export const get = <T>(url: string): Promise<T> => {
  return apiRequest<T>(url);
};

export const post = <T>(url: string, data: any): Promise<T> => {
  return apiRequest<T>(url, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const put = <T>(url: string, data: any): Promise<T> => {
  return apiRequest<T>(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const del = <T>(url: string): Promise<T> => {
  return apiRequest<T>(url, {
    method: 'DELETE'
  });
}; 