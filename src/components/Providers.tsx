'use client';

import { ReactNode, useState, useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { MessageProvider } from '@/lib/MessageContext';
import { DataProvider } from '@/lib/DataContext';
import { LandingLayout } from '@/components/LandingLayout';
import { setupMonitoring } from '@/lib/monitoring';

// Conditionally import devtools to avoid build issues
const ReactQueryDevtools = process.env.NODE_ENV === 'development'
  ? lazy(() => import('@tanstack/react-query-devtools').then(mod => ({ default: mod.ReactQueryDevtools })))
  : () => null;

export function Providers({ children }: { children: ReactNode }) {
  // Create a client for each session to avoid sharing state between users
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
        retry: 1,
        staleTime: 30000, // 30 seconds
        gcTime: 1000 * 60 * 10, // 10 minutes
      },
    },
  }));

  // Initialize monitoring once at the app level
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setupMonitoring();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataProvider>
          <MessageProvider>
            <LandingLayout>
              {children}
            </LandingLayout>
          </MessageProvider>
        </DataProvider>
      </AuthProvider>
      {process.env.NODE_ENV === 'development' && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      )}
    </QueryClientProvider>
  );
} 