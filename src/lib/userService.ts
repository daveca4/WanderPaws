import { User } from './types';

// API endpoints
const API_ENDPOINTS = {
  USERS: '/api/users',
};

// Fetch all users
export async function getUsers(): Promise<User[]> {
  try {
    const response = await fetch(API_ENDPOINTS.USERS);
    if (!response.ok) throw new Error('Failed to fetch users');
    
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Fetch user by ID
export async function getUserById(userId: string): Promise<User | undefined> {
  try {
    const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`);
    if (!response.ok) {
      if (response.status === 404) return undefined;
      throw new Error(`Failed to fetch user with ID ${userId}`);
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return undefined;
  }
}

// Fetch multiple users by IDs
export async function getUsersByIds(userIds: string[]): Promise<User[]> {
  if (!userIds.length) return [];
  
  try {
    const idsString = userIds.join(',');
    const response = await fetch(`${API_ENDPOINTS.USERS}?ids=${idsString}`);
    if (!response.ok) throw new Error('Failed to fetch users by IDs');
    
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Error fetching users by IDs:', error);
    return [];
  }
}

// Create a new user
export async function createUser(userData: Omit<User, 'id'>): Promise<User | undefined> {
  try {
    const response = await fetch(API_ENDPOINTS.USERS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) throw new Error('Failed to create user');
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error creating user:', error);
    return undefined;
  }
}

// Update a user
export async function updateUser(userId: string, userData: Partial<User>): Promise<User | undefined> {
  try {
    const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) throw new Error(`Failed to update user ${userId}`);
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    return undefined;
  }
} 