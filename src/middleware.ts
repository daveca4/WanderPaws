import { NextResponse, NextRequest } from 'next/server';

// Set up a Next.js middleware
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;
  
  // Only apply caching headers to API routes
  if (pathname.startsWith('/api/')) {
    // Set cache control headers based on the HTTP method
    if (request.method === 'GET') {
      // Cache GET requests for 30 seconds
      response.headers.set(
        'Cache-Control',
        'public, max-age=30, stale-while-revalidate=60'
      );
    } else {
      // Don't cache mutations (POST, PATCH, DELETE)
      response.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }
  }
  
  return response;
}

// Configure the middleware to run only on API routes
export const config = {
  matcher: '/api/:path*',
}; 