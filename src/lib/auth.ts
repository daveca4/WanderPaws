'use client';

import { User, Role } from './types';

// Constants for local storage
const USER_STORAGE_KEY = 'wanderpaws_user';

// Type for permissions
export type Permission = string;

// Define available permissions
export const permissions = {
  // Owner permissions
  MANAGE_OWN_PROFILE: 'manage_own_profile' as Permission,
  MANAGE_OWN_DOGS: 'manage_own_dogs' as Permission,
  BOOK_WALKS: 'book_walks' as Permission,
  VIEW_OWN_WALKS: 'view_own_walks' as Permission,
  CANCEL_OWN_WALKS: 'cancel_own_walks' as Permission,
  ACCESS_OWNER_DASHBOARD: 'access_owner-dashboard' as Permission,
  CREATE_DOGS: 'create_dogs' as Permission,
  READ_DOGS: 'read_dogs' as Permission,
  READ_SUBSCRIPTION_PLANS: 'read_subscription_plans' as Permission,
  READ_WALKS: 'read_walks' as Permission,
  CREATE_WALKS: 'create_walks' as Permission,
  
  // Walker permissions
  MANAGE_WALKER_PROFILE: 'manage_walker_profile' as Permission,
  MANAGE_AVAILABILITY: 'manage_availability' as Permission,
  MANAGE_WALKS: 'manage_walks' as Permission,
  UPLOAD_WALK_MEDIA: 'upload_walk_media' as Permission,
  CREATE_ASSESSMENTS: 'create_assessments' as Permission,
  
  // Admin permissions
  MANAGE_ALL_USERS: 'manage_all_users' as Permission,
  VIEW_REPORTS: 'view_reports' as Permission,
  MANAGE_SUBSCRIPTIONS: 'manage_subscriptions' as Permission,
  MANAGE_ASSESSMENTS: 'manage_assessments' as Permission,
  MANAGE_CONTENT: 'manage_content' as Permission,
  MANAGE_MARKETING: 'manage_marketing' as Permission,
  MANAGE_HOLIDAY_REQUESTS: 'manage_holiday_requests' as Permission,
};

// Map roles to permissions
export const rolePermissions: Record<Role, Permission[]> = {
  owner: [
    permissions.MANAGE_OWN_PROFILE,
    permissions.MANAGE_OWN_DOGS,
    permissions.BOOK_WALKS,
    permissions.VIEW_OWN_WALKS,
    permissions.CANCEL_OWN_WALKS,
    permissions.ACCESS_OWNER_DASHBOARD,
    permissions.CREATE_DOGS,
    permissions.READ_DOGS,
    permissions.READ_SUBSCRIPTION_PLANS,
    permissions.READ_WALKS,
    permissions.CREATE_WALKS,
  ],
  walker: [
    permissions.MANAGE_WALKER_PROFILE,
    permissions.MANAGE_AVAILABILITY,
    permissions.MANAGE_WALKS,
    permissions.UPLOAD_WALK_MEDIA,
    permissions.CREATE_ASSESSMENTS,
  ],
  admin: [
    // Admin has all permissions
    ...Object.values(permissions),
  ],
};

// Function to check if a user has a specific permission
export function hasPermission(user: User | null, action: string, resource: string, resourceOwnerId?: string): boolean {
  if (!user) return false;
  
  // Admin role always has access to everything
  if (user.role === 'admin') {
    return true;
  }
  
  // Special case for walkers accessing media
  if (user.role === 'walker' && action === 'upload_walk_media' && resource === 'media') {
    return true;
  }
  
  // Special case for owners accessing owner-dashboard
  if (user.role === 'owner' && action === 'access' && resource === 'owner-dashboard') {
    return true;
  }
  
  // Special case for owners creating dogs
  if (user.role === 'owner' && action === 'create' && resource === 'dogs') {
    return true;
  }
  
  // Special case for owners reading dogs
  if (user.role === 'owner' && action === 'read' && resource === 'dogs') {
    return true;
  }
  
  // Special case for owners viewing dogs 
  if (user.role === 'owner' && action === 'view' && resource === 'dogs') {
    return true;
  }
  
  // Special case for owners updating dogs
  if (user.role === 'owner' && action === 'update' && resource === 'dogs') {
    return true;
  }
  
  // Special case for owners reading subscription plans
  if (user.role === 'owner' && action === 'read' && resource === 'subscription_plans') {
    return true;
  }
  
  // Special case for owners reading and creating walks
  if (user.role === 'owner' && (action === 'read' || action === 'create') && resource === 'walks') {
    return true;
  }
  
  const permission = `${action}_${resource}` as Permission;
  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes(permission);
}

// Function to get all permissions for a user
export function getUserPermissions(user: User | null): Permission[] {
  if (!user) return [];
  return rolePermissions[user.role] || [];
}

// User registration - client-side function that calls the API
export async function registerUser(name: string, email: string, password: string, role: Role): Promise<User | null> {
  if (typeof window === 'undefined') {
    console.error('registerUser should not be called from the server side');
    return null;
  }
  
  try {
    // Use the registration API route
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
      }),
    });
    
    // Get response data even if it's an error
    const data = await response.json();
    
    // Check if the request was successful
    if (!response.ok) {
      // Use the error message from the API if available
      throw new Error(data.error || 'Registration failed');
    }
    
    console.log('User registration successful:', data.message);
    
    return data.user as User;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error; // Re-throw to let the UI handle it
  }
}

// Login function - client-side function that calls the API
export async function login(email: string, password: string): Promise<User | null> {
  if (typeof window === 'undefined') {
    console.error('login should not be called from the server side');
    return null;
  }
  
  try {
    // Use the login API route
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    
    // Get response data even if it's an error
    const data = await response.json();
    
    // Check if the request was successful
    if (!response.ok) {
      // Use the error message from the API if available
      throw new Error(data.error || 'Login failed');
    }
    
    console.log('Login successful:', data.message);
    const user = data.user;
    
    // Store user in local storage
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    
    return user as User;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}

// Logout function - client-side function
export async function logout(): Promise<void> {
  try {
    // Call the logout API if needed
    await fetch('/api/auth/logout', {
      method: 'POST',
    });
    
    // Clear user from local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

// Get current user from local storage
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') {
    // We're on the server, user is not available
    return null;
  }
  
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  if (!userJson) {
    return null;
  }
  
  try {
    const user = JSON.parse(userJson);
    
    // Validate required fields
    if (!user.id || !user.email || !user.role) {
      console.error('Invalid user object in local storage:', user);
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
    
    // Validate role
    if (!['owner', 'walker', 'admin'].includes(user.role)) {
      console.error('Invalid user role in local storage:', user.role);
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
    
    // Ensure all required fields are present
    const validatedUser: User = {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      name: user.name || null,
      emailVerified: user.emailVerified || false,
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString(),
      lastLogin: user.lastLogin || new Date().toISOString(),
      profileId: user.profileId || null,
      image: user.image || null,
      passwordHash: user.passwordHash || ''
    };
    
    // Update storage with validated user
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(validatedUser));
    
    return validatedUser;
  } catch (error) {
    console.error('Error parsing user from local storage:', error);
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

