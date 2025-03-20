import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/AuthContext';
import { LandingLayout } from '@/components/LandingLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WanderPaws | Dog Walking Service',
  description: 'Premium dog walking and pet care services for your furry friends.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: We'll determine auth state at the component level
  // since this is a server component and can't use hooks
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <LandingLayout>
            {children}
          </LandingLayout>
        </AuthProvider>
      </body>
    </html>
  );
} 