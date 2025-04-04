'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { ReactNode, useEffect } from 'react';

interface RouteGuardProps {
  children: ReactNode;
  requiredPermission?: {
    action: string;
    resource: string;
  };
  redirectTo?: string;
}

export default function RouteGuard({
  children,
  requiredPermission,
  redirectTo = '/login',
}: RouteGuardProps) {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if the user is authenticated and has the required permission
    if (!loading) {
      if (!user) {
        // User is not logged in, redirect to login
        router.push(`${redirectTo}?returnUrl=${encodeURIComponent(pathname)}`);
      } else if (
        requiredPermission &&
        !hasSpecialPermission(user, requiredPermission, pathname) &&
        !hasPermission(requiredPermission.action, requiredPermission.resource)
      ) {
        // User doesn't have the required permission, redirect to unauthorized page
        console.error(`Access denied to ${pathname}: Required permission ${requiredPermission.action}:${requiredPermission.resource} not granted for user role ${user.role}`);
        router.push('/unauthorized');
      }
    }
  }, [user, loading, requiredPermission, router, redirectTo, pathname, hasPermission]);

  // Helper function to check for special path-based permissions
  function hasSpecialPermission(user: any, permission: { action: string; resource: string }, path: string) {
    console.log(`Checking special permission for path: ${path} with required permission: ${permission.action}:${permission.resource}`);
    
    // Allow access to any profile pages for all authenticated users
    if (
      path === '/profile' || 
      path.includes('/profile') ||
      path.includes('/owners/') ||
      path.includes('/walkers/')
    ) {
      console.log('✅ Special access granted for profile-related path:', path);
      return true;
    }
    
    // Special case for owner dashboard access by owners
    if (permission.resource === 'owner-dashboard' && user.role === 'owner') {
      console.log('✅ Special access granted for owner to owner-dashboard');
      return true;
    }
    
    // Special case for walker dashboard access by walkers
    if (permission.resource === 'walker-dashboard' && user.role === 'walker') {
      console.log('✅ Special access granted for walker to walker-dashboard');
      return true;
    }
    
    // Special case for messages access by any authenticated user
    if (permission.resource === 'messages') {
      console.log('✅ Special access granted for messages');
      return true;
    }
    
    console.log('❌ No special permission applies for', path);
    return false;
  }

  // Show nothing while loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If user is null and still loading, don't render children
  if (!user) {
    return null;
  }

  // If permission is required but not granted, and no special permission applies
  if (
    requiredPermission &&
    !hasSpecialPermission(user, requiredPermission, pathname) &&
    !hasPermission(requiredPermission.action, requiredPermission.resource)
  ) {
    return null;
  }

  // User is authenticated and has permission, render children
  return <>{children}</>;
} 