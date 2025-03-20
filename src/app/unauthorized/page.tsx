'use client';

import { useAuth } from '@/lib/AuthContext';
import { getDashboardUrlForRole } from '@/lib/authUtils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');

  // Get the dashboard URL for current user (if logged in)
  const dashboardUrl = user ? getDashboardUrlForRole(user.role) : '/';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="mx-auto h-24 w-24 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {user ? (
            <>
              <Link
                href={dashboardUrl}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Go to Your Dashboard
              </Link>
              
              {returnUrl && (
                <p className="text-sm text-gray-500">
                  If you believe you should have access to{' '}
                  <span className="font-medium text-gray-900">{returnUrl}</span>,
                  please contact your administrator.
                </p>
              )}
            </>
          ) : (
            <>
              <Link
                href={`/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Sign In
              </Link>
              <Link
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Home
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 