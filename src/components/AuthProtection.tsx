'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { isUrlAccessibleForUser, getRedirectUrlForUnauthorizedAccess } from '@/lib/authUtils';

export function AuthProtection({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip if still loading auth state
    if (loading) return;
    
    // Check if user can access the current page
    const canAccess = isUrlAccessibleForUser(pathname, user);
    
    if (!canAccess) {
      // Redirect to appropriate page based on auth state
      const redirectUrl = user 
        ? `/unauthorized?returnUrl=${encodeURIComponent(pathname)}`
        : `/login?returnUrl=${encodeURIComponent(pathname)}`;
      
      router.push(redirectUrl);
    }
  }, [user, loading, pathname, router]);

  // While loading auth state, show nothing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If user can't access the page, don't render content
  // This prevents flashing of unauthorized content before redirect
  if (!isUrlAccessibleForUser(pathname, user)) {
    return null;
  }

  // Otherwise, render the children
  return <>{children}</>;
} 