'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import { formatDate } from '@/utils/helpers';

export default function AssessmentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  return (
    <RouteGuard requiredPermission={{ action: 'access', resource: 'admin-dashboard' }}>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Assessment Details</h2>
          <p className="text-gray-500 mb-4">
            The assessment details feature is currently being updated. Please check back later.
          </p>
          <Link
            href="/admin/assessments"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Return to Assessments
          </Link>
        </div>
      </div>
    </RouteGuard>
  );
} 