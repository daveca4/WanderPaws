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
      return user; // Already has a profileId
    }

    try {
      // Based on role, find the appropriate profile
      if (user.role === 'owner') {
        // Fetch or create owner profile
        const response = await fetch('/api/data/owners/ensure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.id,
            name: user.name || 'Dog Owner',
            email: user.email
          })
        });

        if (response.ok) {
          const owner = await response.json();
          // Update the user with the profileId
          const updatedUser = { ...user, profileId: owner.id };
          
          // Update local storage
          localStorage.setItem('wanderpaws_user', JSON.stringify(updatedUser));
          return updatedUser;
        }
      }
      
      // Could add similar logic for walker role if needed
    } catch (error) {
      console.error('Error ensuring profile ID:', error);
    }
    
    return user;
  };

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      let storedUser = getCurrentUser();
      
      if (storedUser) {
        // Ensure the user has a profileId
        storedUser = await ensureProfileId(storedUser);
        setUser(storedUser);
      }
      
      setIsLoading(false);
    };

    loadUser();
  }, []);

  // Handle login
  const handleLogin = async (email: string, password: string) => {
    try {
      let user = await login(email, password);
      
      if (user) {
        // Ensure the user has a profileId
        user = await ensureProfileId(user);
        setUser(user);
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