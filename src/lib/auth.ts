import { User, Permission, Role } from './types';
import { mockUsers } from './mockUsers';
import { permissions } from './mockUsers';

// Type guard functions
function isAdmin(role: Role): role is 'admin' {
  return role === 'admin';
}

function isOwner(role: Role): role is 'owner' {
  return role === 'owner';
}

function isWalker(role: Role): role is 'walker' {
  return role === 'walker';
}

// Constants for local storage
const USER_STORAGE_KEY = 'wanderpaws_user';

// Simulate user authentication
export async function login(email: string, password: string): Promise<User | null> {
  // In a real app, we would verify the password against a hash
  const user = mockUsers.find(user => user.email === email);
  
  if (!user) {
    return null;
  }
  
  // In a real app, we would check the password here
  // For demo purposes, we'll just return the user
  
  // Update last login time
  user.lastLogin = new Date().toISOString();
  
  // Store user in local storage
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
  
  return user;
}

export async function logout(): Promise<void> {
  // Clear user from local storage
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
  return;
}

// Get the current user from storage
export function getCurrentUser(): User | null {
  // Check for browser environment
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Get user from local storage
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  if (!userJson) {
    return null;
  }
  
  try {
    return JSON.parse(userJson) as User;
  } catch (error) {
    console.error('Error parsing user from storage:', error);
    return null;
  }
}

// Check if a user has a specific permission
export function hasPermission(
  user: User | null, 
  action: string, 
  resource: string,
  resourceOwnerId?: string
): boolean {
  if (!user) return false;
  
  // Admins have all permissions
  if (isAdmin(user.role)) return true;
  
  // Get permissions for the user's role
  const rolePermissions = permissions[user.role];
  if (!rolePermissions) return false;
  
  // Check if the permission exists for this role
  const hasBasePermission = rolePermissions.some(
    permission => permission.action === action && permission.resource === resource
  );
  
  if (!hasBasePermission) return false;
  
  // If this is a resource ownership check (e.g., for owners and walkers who should
  // only access their own resources), verify the ownership
  if (resourceOwnerId && !isAdmin(user.role)) {
    // For owners, check if they own the resource
    if (isOwner(user.role) && user.profileId !== resourceOwnerId) {
      return false;
    }
    
    // For walkers, check if they are assigned to the resource
    if (isWalker(user.role) && user.profileId !== resourceOwnerId) {
      // Note: In a real app, we would need more complex logic here to check 
      // walk assignments, walker schedules, etc.
      return false;
    }
  }
  
  return true;
}

// Get all permissions for a user
export function getUserPermissions(user: User | null): Permission[] {
  if (!user) return [];
  
  // Admins have all permissions
  if (isAdmin(user.role)) {
    return Object.values(permissions).flat();
  }
  
  // Return permissions for the user's role
  return permissions[user.role] || [];
} 