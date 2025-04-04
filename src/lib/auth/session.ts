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
 * Get the user session from memory or localStorage
 */
export function getSession() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    // Try getting from localStorage
    const storedUser = localStorage.getItem('wanderpaws_user');
    const storedSession = localStorage.getItem('wanderpaws_session');
    
    if (!storedUser || !storedSession) {
      console.warn('Missing user or session in localStorage');
      return null;
    }
    
    const user = JSON.parse(storedUser);
    const session = JSON.parse(storedSession);
    
    // Add extra debug info
    console.log('Retrieved session from localStorage', {
      userId: user.id,
      role: user.role,
      isAdmin: user.role === 'admin',
      sessionData: {
        hasToken: !!session.token,
        expires: new Date(session.expires).toISOString(),
        isExpired: new Date(session.expires) < new Date(),
      }
    });
    
    // Convert profileId to string if it exists
    if (user.profileId) {
      user.profileId = String(user.profileId);
    }
    
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profileId: user.profileId,
      token: session.token,
      refreshToken: session.refreshToken,
      expires: new Date(session.expires),
    };
  } catch (error) {
    console.error('Error retrieving session:', error);
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