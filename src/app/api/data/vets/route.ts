import { NextRequest, NextResponse } from 'next/server';

// This API endpoint returns veterinarian data.
// Note: There's no vets table in the current schema, so this returns an empty array.
// When implementing vets functionality, this should be updated to fetch from the database.
export async function GET(request: NextRequest) {
  try {
    const auth = {
      userId: request.headers.get('user-id'),
      userRole: request.headers.get('user-role'),
      profileId: request.headers.get('user-profile-id')
    };
    
    // Log the request
    console.log('GET /api/data/vets - Authentication:', auth);
    
    // Check authentication
    if (!auth.userId) {
      console.warn('GET /api/data/vets - Unauthenticated request');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Return an empty array for now
    // This prevents 404 errors in the DataContext that's trying to fetch this data
    // When vets functionality is implemented, replace this with actual database queries
    console.log('GET /api/data/vets - Returning empty array (feature not implemented)');
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error in vets API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 