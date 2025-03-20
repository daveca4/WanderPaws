'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { AuthProtection } from './AuthProtection';

// Define paths that should have the app layout (with Navbar and Sidebar)
const APP_PATHS = [
  '/admin',
  '/owner-dashboard',
  '/walker-dashboard',
  '/dogs',
  '/walkers',
  '/owners',
  '/schedule',
  '/insights',
];

// Define paths that should have clean layout (login, register, landing)
const AUTH_PATHS = [
  '/login',
  '/register',
  '/unauthorized',
];

export function LandingLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  
  // Check if this is a public path that doesn't need auth protection
  const isPublicPath = pathname === '/' || AUTH_PATHS.some(path => pathname.startsWith(path));
  
  // Check if this is an app path that needs the app layout
  const isAppPath = APP_PATHS.some(path => pathname.startsWith(path));
  
  // For auth paths (login/register) or the landing page when not logged in
  if (isPublicPath) {
    return <>{children}</>;
  }
  
  // For app paths or when user is authenticated, render with nav/sidebar
  // and wrap with AuthProtection
  if (isAppPath || user) {
    return (
      <AuthProtection>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </AuthProtection>
    );
  }
  
  // Default case - use AuthProtection to handle redirection
  return <AuthProtection>{children}</AuthProtection>;
} 