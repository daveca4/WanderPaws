import React from 'react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
}

export default function AdminHeader({ title, subtitle, actionButton }: AdminHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actionButton && (
        <div>
          {actionButton}
        </div>
      )}
    </div>
  );
} 