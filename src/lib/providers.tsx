'use client';

import React from 'react';
import { QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { createQueryClient } from './queryClient';
import { AuthProvider } from './AuthContext';
import { DataProvider } from './DataContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance for each client (won't affect server components)
  const [queryClient] = React.useState(() => createQueryClient());
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataProvider>
          {children}
        </DataProvider>
      </AuthProvider>
      
      {/* Only show ReactQueryDevtools in development */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
} 