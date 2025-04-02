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
      console.log('AuthContext - User already has profileId:', user.profileId);
      return user;
    }

    try {
      console.log('AuthContext - Ensuring profile ID for user:', {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
      });
      
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
          console.error('AuthContext - Failed to ensure owner profile:', error);
          throw new Error(error.message || 'Failed to ensure owner profile');
        }

        const data = await response.json();
        console.log('AuthContext - Received owner profile:', data);
        
        if (!data.id) {
          console.error('AuthContext - No profile ID in response:', data);
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
        console.log('AuthContext - Updated user with profileId:', updatedUser);
        return updatedUser;
      }
      
      // Could add similar logic for walker role if needed
      return user;
    } catch (error) {
      console.error('AuthContext - Error ensuring profile ID:', error);
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
          try {
            storedUser = await ensureProfileId(storedUser);
            console.log('AuthContext - User after ensuring profileId:', storedUser);
            setUser(storedUser);
          } catch (error) {
            console.error('AuthContext - Error ensuring profile on load:', error);
            // Still set the user even if profile ensure failed
            setUser(storedUser);
          }
        }
      } catch (error) {
        console.error('AuthContext - Error loading user:', error);
        // Clear any invalid user data
        localStorage.removeItem('wanderpaws_user');
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
          console.error('AuthContext - Error ensuring profile after login:', error);
          // Still set the user even if profile ensure failed
          setUser(user);
        }
      }
      
      return user;
    } catch (error) {
      console.error('AuthContext - Login error:', error);
      return null;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      localStorage.removeItem('wanderpaws_user');
      console.log('AuthContext - User logged out successfully');
    } catch (error) {
      console.error('AuthContext - Error during logout:', error);
      // Still clear the user state even if logout fails
      setUser(null);
      localStorage.removeItem('wanderpaws_user');
    }
  };

  // Check permissions
  const checkPermission = (action: string, resource: string, resourceOwnerId?: string) => {
    const hasAccess = hasPermission(user, action, resource, resourceOwnerId);
    console.log('AuthContext - Checking permission:', {
      action,
      resource,
      resourceOwnerId,
      userId: user?.id,
      userRole: user?.role,
      hasAccess
    });
    return hasAccess;
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