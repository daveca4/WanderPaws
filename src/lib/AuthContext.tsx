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

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = getCurrentUser();
      setUser(storedUser);
      setIsLoading(false);
    };

    loadUser();
  }, []);

  // Handle login
  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await login(email, password);
      setUser(user);
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