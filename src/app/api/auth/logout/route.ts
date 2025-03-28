import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json({
      message: 'Logout successful',
    });
    
    // Clear the authentication cookie
    response.cookies.delete('wanderpaws_auth');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
} 