"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getDogsByOwnerId } from '@/utils/helpers';
import { Dog } from '@/lib/types';

export default function OwnerProfilePage() {
  const params = useParams();
  const ownerId = params.id as string;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Owner Profile</h2>
            <p className="mt-1 text-sm text-gray-500">This page is currently being updated.</p>
            <div className="mt-4">
              <Link 
                href="/"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 