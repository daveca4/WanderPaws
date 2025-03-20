'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
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
  const { user, loading, checkPermission } = useAuth();
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
        !checkPermission(requiredPermission.action, requiredPermission.resource)
      ) {
        // User doesn't have the required permission, redirect to unauthorized page
        router.push('/unauthorized');
      }
    }
  }, [user, loading, requiredPermission, router, redirectTo, pathname, checkPermission]);

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

  // If permission is required but not granted, don't render
  if (
    requiredPermission &&
    !checkPermission(requiredPermission.action, requiredPermission.resource)
  ) {
    return null;
  }

  // User is authenticated and has permission, render children
  return <>{children}</>;
} 