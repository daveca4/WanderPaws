import { HolidayRequest } from './types';

// API endpoints
const API_ENDPOINTS = {
  HOLIDAY_REQUESTS: '/api/holiday-requests',
};

// Fetch all holiday requests
export async function getHolidayRequests(): Promise<HolidayRequest[]> {
  try {
    const response = await fetch(API_ENDPOINTS.HOLIDAY_REQUESTS);
    if (!response.ok) throw new Error('Failed to fetch holiday requests');
    
    const data = await response.json();
    return data.requests || [];
  } catch (error) {
    console.error('Error fetching holiday requests:', error);
    return [];
  }
}

// Fetch pending holiday requests
export async function getPendingHolidayRequests(): Promise<HolidayRequest[]> {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_ENDPOINTS.HOLIDAY_REQUESTS}?status=pending`, {
      signal: controller.signal
    }).catch(err => {
      console.error('Network error during fetch:', err);
      throw new Error('Network error when fetching pending holiday requests');
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Server responded with status: ${response.status}`);
      throw new Error(`Failed to fetch pending holiday requests. Status: ${response.status}`);
    }
    
    // Safely parse JSON
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Error parsing response as JSON:', jsonError);
      console.error('Response content:', await response.text().catch(() => 'Could not read response text'));
      throw new Error('Invalid JSON response when fetching pending holiday requests');
    }
    
    // Validate data structure
    if (!data) {
      console.error('Response data is null or undefined');
      return [];
    }
    
    // Check if requests property exists and is an array
    if (!data.requests) {
      console.error('Response missing requests property:', data);
      // Try to handle different response formats
      return Array.isArray(data) ? data : [];
    }
    
    if (!Array.isArray(data.requests)) {
      console.error('Requests property is not an array:', data.requests);
      return [];
    }
    
    return data.requests;
  } catch (error) {
    console.error('Error in getPendingHolidayRequests:', error);
    // Rethrow the error to let the caller handle it
    throw error;
  }
}

// Get the count of pending holiday requests
export async function getPendingHolidayRequestsCount(): Promise<number> {
  try {
    const pendingRequests = await getPendingHolidayRequests();
    return pendingRequests.length;
  } catch (error) {
    console.error('Error getting pending holiday requests count:', error);
    // Return 0 as a fallback when there's an error
    return 0;
  }
}

// Fetch holiday requests for a specific walker
export async function getWalkerHolidayRequests(walkerId: string): Promise<HolidayRequest[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_ENDPOINTS.HOLIDAY_REQUESTS}?walkerId=${walkerId}`, {
      signal: controller.signal
    }).catch(err => {
      console.error(`Network error fetching walker holiday requests for ${walkerId}:`, err);
      throw new Error(`Network error when fetching holiday requests for walker ${walkerId}`);
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Server responded with status: ${response.status} for walker ${walkerId}`);
      throw new Error(`Failed to fetch holiday requests for walker ${walkerId}. Status: ${response.status}`);
    }
    
    // Safely parse JSON
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error(`Error parsing response as JSON for walker ${walkerId}:`, jsonError);
      throw new Error(`Invalid JSON response when fetching holiday requests for walker ${walkerId}`);
    }
    
    if (!data || !data.requests) {
      console.error(`Response missing requests property for walker ${walkerId}:`, data);
      return Array.isArray(data) ? data : [];
    }
    
    if (!Array.isArray(data.requests)) {
      console.error(`Requests property is not an array for walker ${walkerId}:`, data.requests);
      return [];
    }
    
    return data.requests;
  } catch (error) {
    console.error(`Error fetching holiday requests for walker ${walkerId}:`, error);
    return [];
  }
}

// Create a new holiday request
export async function createHolidayRequest(requestData: Omit<HolidayRequest, 'id'>): Promise<HolidayRequest | undefined> {
  try {
    const response = await fetch(API_ENDPOINTS.HOLIDAY_REQUESTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) throw new Error('Failed to create holiday request');
    const data = await response.json();
    return data.request;
  } catch (error) {
    console.error('Error creating holiday request:', error);
    return undefined;
  }
}

// Update a holiday request
export async function updateHolidayRequest(
  requestId: string,
  updateData: Partial<HolidayRequest>
): Promise<HolidayRequest | undefined> {
  try {
    const response = await fetch(`${API_ENDPOINTS.HOLIDAY_REQUESTS}/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) throw new Error(`Failed to update holiday request ${requestId}`);
    const data = await response.json();
    return data.request;
  } catch (error) {
    console.error(`Error updating holiday request ${requestId}:`, error);
    return undefined;
  }
} 