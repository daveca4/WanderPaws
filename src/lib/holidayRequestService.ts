import { HolidayRequest } from './types';

// API endpoints
const API_ENDPOINTS = {
  HOLIDAY_REQUESTS: '/api/holiday-requests',
};

// Mock data to use when the API is not available
const MOCK_HOLIDAY_REQUESTS: HolidayRequest[] = [
  {
    id: 'mock-hr-1',
    walkerId: 'walker-1',
    date: '2023-09-01',
    reason: 'Personal leave',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mock-hr-2',
    walkerId: 'walker-2',
    date: '2023-09-15',
    reason: 'Doctor appointment',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Flag to toggle between real API and mock data
const USE_MOCK_DATA = true;

// Fetch all holiday requests
export async function getHolidayRequests(): Promise<HolidayRequest[]> {
  if (USE_MOCK_DATA) {
    return MOCK_HOLIDAY_REQUESTS;
  }
  
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
  if (USE_MOCK_DATA) {
    return MOCK_HOLIDAY_REQUESTS.filter(req => req.status === 'pending');
  }
  
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
  if (USE_MOCK_DATA) {
    return MOCK_HOLIDAY_REQUESTS.filter(req => req.status === 'pending').length;
  }
  
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
  if (USE_MOCK_DATA) {
    return MOCK_HOLIDAY_REQUESTS.filter(req => req.walkerId === walkerId);
  }
  
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
  if (USE_MOCK_DATA) {
    const newRequest = {
      ...requestData,
      id: `mock-hr-${MOCK_HOLIDAY_REQUESTS.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    MOCK_HOLIDAY_REQUESTS.push(newRequest);
    return newRequest;
  }
  
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
  if (USE_MOCK_DATA) {
    const index = MOCK_HOLIDAY_REQUESTS.findIndex(r => r.id === requestId);
    if (index >= 0) {
      MOCK_HOLIDAY_REQUESTS[index] = {
        ...MOCK_HOLIDAY_REQUESTS[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      return MOCK_HOLIDAY_REQUESTS[index];
    }
    return undefined;
  }
  
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