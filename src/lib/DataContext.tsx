'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { Dog, Owner, Walker, Walk, Assessment, Message, Conversation, User, UserSubscription, SubscriptionPlan } from './types';

// Create a context with initial empty values
interface DataContextType {
  dogs: Dog[];
  owners: Owner[];
  walkers: Walker[];
  walks: Walk[];
  assessments: Assessment[];
  users: User[];
  messages: Message[];
  conversations: Conversation[];
  userSubscriptions: UserSubscription[];
  subscriptionPlans: SubscriptionPlan[];
  // These functions return empty data for backward compatibility
  getDogById: (id: string) => Dog | undefined;
  getOwnerById: (id: string) => Owner | undefined;
  getWalkerById: (id: string) => Walker | undefined;
  getWalkById: (id: string) => Walk | undefined;
  getAssessmentById: (id: string) => Assessment | undefined;
  getUserById: (id: string) => User | undefined;
  // Pass-through no-op functions
  updateDog: (id: string, data: Partial<Dog>) => Promise<Dog>;
  updateOwner: (id: string, data: Partial<Owner>) => Promise<Owner>;
  updateWalker: (id: string, data: Partial<Walker>) => Promise<Walker>;
  updateWalk: (id: string, data: Partial<Walk>) => Promise<Walk>;
  updateAssessment: (id: string, data: Partial<Assessment>) => Promise<Assessment>;
}

// Create the context
const DataContext = createContext<DataContextType | undefined>(undefined);

/**
 * TEMPORARY PROVIDER STUB - This is a temporary solution while migrating to React Query
 * All components using this provider should be migrated to use the appropriate React Query hooks
 */
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Empty data arrays
  const emptyData = {
    dogs: [],
    owners: [],
    walkers: [],
    walks: [],
    assessments: [],
    users: [],
    messages: [],
    conversations: [],
    userSubscriptions: [],
    subscriptionPlans: [],
    // Return undefined for all getById functions
    getDogById: () => undefined,
    getOwnerById: () => undefined,
    getWalkerById: () => undefined,
    getWalkById: () => undefined,
    getAssessmentById: () => undefined,
    getUserById: () => undefined,
    // No-op update functions that return an empty promise
    updateDog: async () => ({} as Dog),
    updateOwner: async () => ({} as Owner),
    updateWalker: async () => ({} as Walker),
    updateWalk: async () => ({} as Walk),
    updateAssessment: async () => ({} as Assessment),
  };

  return (
    <DataContext.Provider value={emptyData}>
      {children}
    </DataContext.Provider>
  );
};

// Hook to use the data context
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 