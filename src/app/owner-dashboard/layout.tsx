'use client';

import { WorkflowProgress } from '@/components/WorkflowProgress';
import RouteGuard from '@/components/RouteGuard';

export default function OwnerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'owner-dashboard' }}>
      <div className="space-y-6">
        {/* Workflow Progress Component */}
        <WorkflowProgress />
        
        {/* Page Content */}
        {children}
      </div>
    </RouteGuard>
  );
} 