'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import MediaUploader from '@/components/walks/MediaUploader';
import { useAuth } from '@/lib/AuthContext';
import { getBookingById } from '@/utils/helpers';

export default function WalkMediaPage() {
  const params = useParams();
  const walkId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Walk Media Upload</h2>
        <p className="text-gray-500 mb-4">
          The media upload feature is currently being updated. Please check back later.
        </p>
        <Link
          href="/walker-dashboard/walks"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          Return to Walks
        </Link>
      </div>
    </div>
  );
} 