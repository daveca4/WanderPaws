'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Assessment, Walker } from '@/lib/types';
import { formatDate } from '@/utils/helpers';
import { useAuth } from '@/lib/AuthContext';
import RouteGuard from '@/components/RouteGuard';

export default function EditAssessmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  return (
    <RouteGuard requiredPermission={{ action: 'update', resource: 'assessments' }}>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Assessment Edit Feature</h2>
          <p className="text-gray-500 mb-4">
            The assessment edit feature is currently being updated. Please check back later.
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