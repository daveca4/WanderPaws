'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RouteGuard from '@/components/RouteGuard';
import { useAuth } from '@/lib/AuthContext';
import { 
  getDogsByOwnerId, 
  getWalkerById, 
  generateId,
  getAvailableTimeSlots,
  getTimeFromTimeSlot,
  isWalkerAvailable
} from '@/utils/helpers';
import { Dog, Walker } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// Define an extended Walker interface that includes calculatedRating
interface WalkerWithRating extends Walker {
  calculatedRating: number;
}

export default function CreateBookingPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <RouteGuard requiredPermission={{ action: 'create', resource: 'walks' }}>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Booking Feature Temporarily Disabled</h2>
          <p className="text-gray-500 mb-4">
            The booking feature is currently being updated. Please check back later.
          </p>
          <Link
            href="/owner-dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </RouteGuard>
  );
} 