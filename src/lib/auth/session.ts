import { User, Role } from '../types';

// Session storage key
const SESSION_STORAGE_KEY = 'wanderpaws_session';

// Session interface
export interface Session {
  userId: string;
  role: Role;
  profileId?: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Get the current session from storage
 */
export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData) as Session;
    
    // Check if session has expired
    if (session.expiresAt && Date.now() > session.expiresAt) {
      console.log('Session expired, clearing');
      clearSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to parse session from storage:', error);
    clearSession();
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
    console.error('Failed to refresh token:', error);
    // If refresh fails, clear session
    clearSession();
    return false;
  }
} 