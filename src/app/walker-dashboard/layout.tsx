'use client';

import RouteGuard from '@/components/RouteGuard';

export default function WalkerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'walker-dashboard' }}>
      <div className="space-y-6">
        {/* Page Content */}
        {children}
      </div>
    </RouteGuard>
  );
} 