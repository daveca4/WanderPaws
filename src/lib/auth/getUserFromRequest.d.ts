import { NextRequest } from 'next/server';

export interface UserFromRequest {
  userId: string;
  role: string;
  profileId: string;
}

/**
 * Extracts user information from request headers
 * @param request The Next.js request object
 * @returns Object containing userId, role, and profileId from headers
 */
export declare function getUserFromRequest(request: NextRequest): Promise<UserFromRequest>; 