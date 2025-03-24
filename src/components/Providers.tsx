'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/AuthContext';
import { MessageProvider } from '@/lib/MessageContext';
import { DataProvider } from '@/lib/DataContext';
import { LandingLayout } from '@/components/LandingLayout';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        <MessageProvider>
          <LandingLayout>
            {children}
          </LandingLayout>
        </MessageProvider>
      </DataProvider>
    </AuthProvider>
  );
} 