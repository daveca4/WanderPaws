import { User, Role } from '../types';
import { logger } from '../utils/logger';

// Session storage key
const SESSION_STORAGE_KEY = 'wanderpaws_session';
const USER_STORAGE_KEY = 'wanderpaws_user';

// Session interface
export interface Session {
  userId: string;
  role: Role;
  profileId?: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: number;
  email?: string;
  name?: string;
  expires?: Date;
}

/**
 * Get the user session from memory or localStorage
 */
export function getSession(): Session | null {
  if (typeof window === 'undefined') {
    logger.warn('getSession called on server side');
    return null;
  }
  
  try {
    // Try getting from localStorage
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    
    // Log all localStorage keys for debugging
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      allKeys.push(localStorage.key(i));
    }
    
    logger.info('LocalStorage keys', { 
      allKeys, 
      hasUser: !!storedUser, 
      hasSession: !!storedSession 
    });
    
    if (!storedUser || !storedSession) {
      logger.warn('Missing user or session in localStorage', {
        hasUser: !!storedUser,
        hasSession: !!storedSession
      });
      
      // Check if we can recover from wanderpaws_user only
      if (storedUser && !storedSession) {
        const user = JSON.parse(storedUser);
        logger.info('Found user but no session, creating minimal session', {
          userId: user.id,
          role: user.role
        });
        
        // Create minimal session
        const minimalSession: Session = {
          userId: user.id,
          role: user.role as Role,
          profileId: user.profileId,
          email: user.email,
          name: user.name
        };
        
        // Save it to localStorage
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(minimalSession));
        
        return minimalSession;
      }
      
      return null;
    }
    
    const user = JSON.parse(storedUser);
    const session = JSON.parse(storedSession);
    
    // Add extra debug info
    logger.info('Retrieved session from localStorage', {
      userId: user.id,
      role: user.role,
      isAdmin: user.role === 'admin',
      profileId: user.profileId,
      sessionData: {
        hasToken: !!session.token,
        expires: session.expires ? new Date(session.expires).toISOString() : 'none',
        isExpired: session.expires ? new Date(session.expires) < new Date() : false,
      }
    });
    
    // Convert profileId to string if it exists
    if (user.profileId) {
      user.profileId = String(user.profileId);
    }
    
    const fullSession: Session = {
      userId: user.id,
      role: user.role as Role,
      profileId: user.profileId,
      email: user.email,
      name: user.name,
      token: session.token,
      refreshToken: session.refreshToken,
      expires: session.expires ? new Date(session.expires) : undefined,
    };
    
    return fullSession;
  } catch (error) {
    logger.error('Error retrieving session:', error);
    return null;
  }
}

/**
 * Save session to storage
 */
export function setSession(session: Session): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  
  // Trigger session updated event
  window.dispatchEvent(new Event('session:updated'));
}

/**
 * Clear the current session
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  
  // Trigger session cleared event
  window.dispatchEvent(new Event('session:cleared'));
}

/**
 * Update the current session with new values
 */
export function updateSession(updates: Partial<Session>): Session | null {
  const currentSession = getSession();
  if (!currentSession) return null;
  
  const updatedSession = { ...currentSession, ...updates };
  setSession(updatedSession);
  
  return updatedSession;
}

/**
 * Create a session from user data
 */
export function createSession(user: User, token?: string, refreshToken?: string, expiresIn?: number): Session {
  const session: Session = {
    userId: user.id,
    role: user.role,
    profileId: user.profileId,
    email: user.email,
    name: user.name,
    token,
    refreshToken
  };
  
  // Add expiration if provided
  if (expiresIn) {
    session.expiresAt = Date.now() + expiresIn * 1000;
  }
  
  return session;
}

/**
 * Attempt to refresh the auth token
 */
export async function refreshToken(): Promise<boolean> {
  const session = getSession();
  if (!session || !session.refreshToken) return false;
  
  try {
    // Call refresh token endpoint
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: session.refreshToken
      })
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    
    // Update session with new tokens
    updateSession({
      token: data.token,
      refreshToken: data.refreshToken,
      expiresAt: Date.now() + (data.expiresIn || 3600) * 1000
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to refresh token:', error);
    // If refresh fails, clear session
    clearSession();
    return false;
  }
} 