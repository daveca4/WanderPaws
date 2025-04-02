'use client';

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from './queryClient';
import { AuthProvider } from './AuthContext';
import { DataProvider } from './DataContext';
import { MessageProvider } from './MessageContext';
import { LandingLayout } from '@/components/LandingLayout';

// Conditionally import devtools to avoid build issues
const ReactQueryDevtools = process.env.NODE_ENV === 'development'
  ? React.lazy(() => import('@tanstack/react-query-devtools').then(mod => ({ default: mod.ReactQueryDevtools })))
  : () => null;

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance for each client (won't affect server components)
  const [queryClient] = React.useState(() => createQueryClient());
  
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
      
      {/* Only show ReactQueryDevtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <React.Suspense fallback={null}>
          <ReactQueryDevtools />
        </React.Suspense>
      )}
    </QueryClientProvider>
  );
} 