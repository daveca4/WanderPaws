'use client';

import { ReactNode } from 'react';
import { usePermission } from '@/lib/AuthContext';

interface PermissionGateProps {
  children: ReactNode;
  action: string;
  resource: string;
  resourceOwnerId?: string;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user permissions
 */
export default function PermissionGate({
  children,
  action,
  resource,
  resourceOwnerId,
  fallback = null,
}: PermissionGateProps) {
  // Check if the user has permission to perform this action on this resource
  const hasPermission = usePermission(action, resource, resourceOwnerId);

  // Render children if the user has permission, otherwise render the fallback
  return <>{hasPermission ? children : fallback}</>;
} 