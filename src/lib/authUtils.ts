import { User, Role } from './types';

/**
 * Get the dashboard URL for a specific user role
 * @param role User role
 * @returns Dashboard URL for the given role
 */
export function getDashboardUrlForRole(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'owner':
      return '/owner-dashboard';
    case 'walker':
      return '/walker-dashboard';
    default:
      return '/';
  }
}

/**
 * Check if the current URL is accessible for the user
 * @param url URL to check
 * @param user User object
 * @returns Whether the URL is accessible
 */
export function isUrlAccessibleForUser(url: string, user: User | null): boolean {
  if (!user) {
    // Public paths that don't require authentication
    const publicPaths = ['/', '/login', '/register', '/unauthorized'];
    return publicPaths.some(path => url === path || url.startsWith(`${path}?`));
  }

  // Admin can access everything
  if (user.role === 'admin') {
    return true;
  }

  // Check owner access
  if (user.role === 'owner') {
    const allowedOwnerPaths = [
      '/owner-dashboard',
      '/dogs',
      '/schedule',
      '/walkers',
      '/owners',
      '/insights',
    ];
    return allowedOwnerPaths.some(path => url.startsWith(path));
  }

  // Check walker access
  if (user.role === 'walker') {
    const allowedWalkerPaths = [
      '/walker-dashboard',
      '/schedule',
      '/dogs',
    ];
    return allowedWalkerPaths.some(path => url.startsWith(path));
  }

  return false;
}

/**
 * Get the redirect URL when a user tries to access an unauthorized page
 * @param user User object
 * @returns Redirect URL
 */
export function getRedirectUrlForUnauthorizedAccess(user: User | null): string {
  if (!user) {
    return '/login';
  }
  
  return getDashboardUrlForRole(user.role);
} 