'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './types';
import { login as authLogin, logout as authLogout, getCurrentUser, hasPermission, getUserPermissions } from './auth';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkPermission: (action: string, resource: string, resourceOwnerId?: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load the current user when the app starts
    const loadUser = async () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const loggedInUser = await authLogin(email, password);
      if (loggedInUser) {
        setUser(loggedInUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authLogout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkPermission = (action: string, resource: string, resourceOwnerId?: string): boolean => {
    return hasPermission(user, action, resource, resourceOwnerId);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hook to check permissions
export function usePermission(action: string, resource: string, resourceOwnerId?: string) {
  const { checkPermission } = useAuth();
  return checkPermission(action, resource, resourceOwnerId);
} 