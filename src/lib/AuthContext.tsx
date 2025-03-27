'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role, Permission } from './types';
import { login, logout, getCurrentUser, hasPermission } from './auth';

// Define the context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  hasPermission: (action: string, resource: string, resourceOwnerId?: string) => boolean;
  checkPermission: (action: string, resource: string, resourceOwnerId?: string) => boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  loading: true,
  login: async () => null,
  logout: async () => {},
  hasPermission: () => false,
  checkPermission: () => false,
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ensure user has a profileId based on their role
  const ensureProfileId = async (user: User) => {
    if (user.profileId) {
      console.log('User already has profileId:', user.profileId);
      return user;
    }

    try {
      console.log('Ensuring profile ID for user:', user.id, user.role);
      
      // Based on role, find the appropriate profile
      if (user.role === 'owner') {
        // Fetch or create owner profile
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

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to ensure owner profile:', error);
          throw new Error(error.message || 'Failed to ensure owner profile');
        }

        const data = await response.json();
        console.log('Received owner profile:', data);
        
        if (!data.id) {
          console.error('No profile ID in response:', data);
          throw new Error('No profile ID returned from server');
        }

        // Update the user with the profileId
        const updatedUser = { 
          ...user, 
          profileId: data.id,
          name: data.name || user.name // Use profile name if available
        };
        
        // Update local storage
        localStorage.setItem('wanderpaws_user', JSON.stringify(updatedUser));
        console.log('Updated user with profileId:', updatedUser);
        return updatedUser;
      }
      
      // Could add similar logic for walker role if needed
      return user;
    } catch (error) {
      console.error('Error ensuring profile ID:', error);
      throw error; // Re-throw to handle in the calling function
    }
  };

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        let storedUser = getCurrentUser();
        console.log('AuthContext - Initial stored user:', storedUser);
        
        if (storedUser) {
          // Ensure the user has a profileId
          storedUser = await ensureProfileId(storedUser);
          console.log('AuthContext - User after ensuring profileId:', storedUser);
          setUser(storedUser);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        // Don't set user if we couldn't ensure profile
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Handle login
  const handleLogin = async (email: string, password: string) => {
    try {
      let user = await login(email, password);
      console.log('AuthContext - User after login:', user);
      
      if (user) {
        try {
          // Ensure the user has a profileId
          user = await ensureProfileId(user);
          console.log('AuthContext - User after login and ensuring profileId:', user);
          setUser(user);
        } catch (error) {
          console.error('Error ensuring profile after login:', error);
          // Still return the user even if profile ensure failed
        }
      }
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  // Check permissions
  const checkPermission = (action: string, resource: string, resourceOwnerId?: string) => {
    return hasPermission(user, action, resource, resourceOwnerId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loading: isLoading,
        login: handleLogin,
        logout: handleLogout,
        hasPermission: checkPermission,
        checkPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to check permissions
export function usePermission(action: string, resource: string, resourceOwnerId?: string) {
  const { hasPermission } = useAuth();
  return hasPermission(action, resource, resourceOwnerId);
} 