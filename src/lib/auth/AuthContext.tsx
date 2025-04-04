'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import apiClient from '../api/client';
import { 
  getSession, 
  setSession, 
  clearSession, 
  updateSession, 
  createSession,
  Session 
} from './session';
import { hasPermission as checkPermission } from '../auth';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  ensureProfile: () => Promise<void>;
  hasPermission: (action: string, resource: string, resourceOwnerId?: string) => boolean;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  login: async () => null,
  logout: async () => {},
  ensureProfile: async () => {},
  hasPermission: () => false,
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Effect to initialize auth state from session
  useEffect(() => {
    const initialize = async () => {
      try {
        const currentSession = getSession();
        if (currentSession) {
          setSessionState(currentSession);
          await fetchUserData(currentSession.userId);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Listen for session updates
    const handleSessionUpdate = () => {
      const currentSession = getSession();
      setSessionState(currentSession);
      
      if (currentSession) {
        fetchUserData(currentSession.userId);
      } else {
        setUser(null);
      }
    };

    window.addEventListener('session:updated', handleSessionUpdate);
    window.addEventListener('session:cleared', () => {
      setSessionState(null);
      setUser(null);
    });

    return () => {
      window.removeEventListener('session:updated', handleSessionUpdate);
      window.removeEventListener('session:cleared', () => {});
    };
  }, []);

  // Fetch user data from API
  const fetchUserData = async (userId: string) => {
    try {
      // Instead of making an API call that doesn't exist, use localStorage
      const userJson = localStorage.getItem('wanderpaws_user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);
      } else {
        throw new Error('No user data in localStorage');
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      clearSession();
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    
    try {
      // Use direct fetch instead of apiClient
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await response.json();
      const user = data.user;
      
      if (!user) {
        throw new Error('Login failed: No user data returned');
      }
      
      // Store in original format for backward compatibility
      localStorage.setItem('wanderpaws_user', JSON.stringify(user));
      
      // Create and store the session in new format
      const newSession = createSession(user, data.token, data.refreshToken, data.expiresIn);
      setSession(newSession);
      
      // Update state
      setUser(user);
      setSessionState(newSession);
      
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Call logout API if we have a token
      if (session?.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: session.token
          }),
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear both session storage mechanisms
      localStorage.removeItem('wanderpaws_user');
      clearSession();
    }
  };

  // Function to ensure the user has a profile ID for their role
  const ensureProfile = async (): Promise<void> => {
    if (!user || !session) return;
    
    // Only handle owner profiles for now (can expand for other roles)
    if (user.role === 'owner' && !user.profileId) {
      try {
        const response = await fetch('/api/data/owners/ensure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': user.id,
            'user-role': user.role
          },
          body: JSON.stringify({
            userId: user.id,
            name: user.name || 'Dog Owner',
            email: user.email
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const profileId = data.id;
          
          // Update user in both storage mechanisms
          const updatedUser = { ...user, profileId };
          setUser(updatedUser);
          
          // Update localStorage wanderpaws_user
          localStorage.setItem('wanderpaws_user', JSON.stringify(updatedUser));
          
          // Update session
          updateSession({ profileId });
        } else {
          console.error('Failed to ensure owner profile:', await response.text());
        }
      } catch (error) {
        console.error('Failed to ensure owner profile:', error);
      }
    }
  };

  // Check if user has a specific permission
  const hasPermission = (action: string, resource: string, resourceOwnerId?: string): boolean => {
    return checkPermission(user, action, resource, resourceOwnerId);
  };

  // Context value
  const value: AuthContextType = {
    session,
    user,
    loading,
    login,
    logout,
    ensureProfile,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 