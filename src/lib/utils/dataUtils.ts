/**
 * Utility functions for standardized data handling across the application
 */

/**
 * Process API response data to standardize format across different endpoints
 * This handles various response formats we've seen across the API
 * 
 * @param responseData - The data returned from API
 * @param dataKey - Optional key to extract (e.g., 'dogs', 'walks', 'assessments')
 * @returns Normalized array data
 */
export function processApiResponseData<T>(responseData: any, dataKey?: string): T[] {
  // Handle if responseData is null or undefined
  if (!responseData) {
    console.warn('Empty response data received');
    return [];
  }

  // If already an array, return it
  if (Array.isArray(responseData)) {
    return responseData;
  }

  // Handle if responseData is an object
  if (typeof responseData === 'object') {
    // Check for specific data key if provided
    if (dataKey && responseData[dataKey] && Array.isArray(responseData[dataKey])) {
      return responseData[dataKey];
    }
    
    // Check for common data keys
    if (responseData.data && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    
    // Check for entity-specific keys
    const commonKeys = ['dogs', 'walkers', 'owners', 'walks', 'assessments', 'users', 'subscriptions'];
    for (const key of commonKeys) {
      if (responseData[key] && Array.isArray(responseData[key])) {
        return responseData[key];
      }
    }
    
    // If it's an object but doesn't have any recognized array properties,
    // return the object itself in an array
    return [responseData];
  }
  
  // If it's something else, return an empty array
  console.warn('Unexpected response data format:', responseData);
  return [];
}

/**
 * Extract pagination information from API response
 * 
 * @param response - The API response object
 * @returns Pagination details or null if not available
 */
export function extractPaginationInfo(response: any): { 
  total: number, 
  page: number, 
  limit: number, 
  hasMore: boolean 
} | null {
  if (!response || typeof response !== 'object') {
    return null;
  }
  
  // Extract pagination data
  const total = response.total || response.count || 0;
  const page = response.page || response.currentPage || 1;
  const limit = response.limit || response.pageSize || 20;
  
  // Calculate hasMore
  const hasMore = total > (page * limit);
  
  return { total, page, limit, hasMore };
}

/**
 * Debug log API response data with consistent formatting
 * 
 * @param source - Source of the log (hook/component name)
 * @param endpoint - API endpoint called
 * @param data - Response data
 */
export function logApiResponse(source: string, endpoint: string, data: any): void {
  console.group(`🔍 [${source}] API Response from ${endpoint}`);
  console.log('Raw data type:', typeof data);
  console.log('Is array?', Array.isArray(data));
  
  let itemCount = 0;
  if (Array.isArray(data)) {
    itemCount = data.length;
  } else if (data && typeof data === 'object') {
    if (data.data && Array.isArray(data.data)) {
      itemCount = data.data.length;
    } else {
      // Look for entity-specific keys
      const commonKeys = ['dogs', 'walkers', 'owners', 'walks', 'assessments', 'users', 'subscriptions'];
      for (const key of commonKeys) {
        if (data[key] && Array.isArray(data[key])) {
          itemCount = data[key].length;
          break;
        }
      }
    }
  }
  
  console.log('Item count:', itemCount);
  console.log('Data:', data);
  console.groupEnd();
} 