'use client';

import { ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { AuthProvider } from '@/lib/AuthContext';
import { MessageProvider } from '@/lib/MessageContext';
import { DataProvider } from '@/lib/DataContext';
import { LandingLayout } from '@/components/LandingLayout';
import { setupMonitoring } from '@/lib/monitoring';

export function Providers({ children }: { children: ReactNode }) {
  // Create a client for each session to avoid sharing state between users
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
        retry: 1,
        staleTime: 30000, // 30 seconds
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
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
} 