import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <h1 className="text-9xl font-extrabold text-gray-900">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-8">Page Not Found</h2>
        <p className="text-gray-600 mt-4">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
} 