'use client';

import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { Dog, Owner, Walker, Walk, Assessment, Message, Conversation, User, UserSubscription, SubscriptionPlan } from './types';
import { useAuth } from './AuthContext';
import { DogAPI, OwnerAPI, WalkerAPI, WalkAPI, AssessmentAPI } from './api/requests';

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
  // Data fetching functions
  getDogById: (id: string) => Dog | undefined;
  getOwnerById: (id: string) => Owner | undefined;
  getWalkerById: (id: string) => Walker | undefined;
  getWalkById: (id: string) => Walk | undefined;
  getAssessmentById: (id: string) => Assessment | undefined;
  getUserById: (id: string) => User | undefined;
  // Data mutation functions
  updateDog: (id: string, data: Partial<Dog>) => Promise<Dog>;
  updateOwner: (id: string, data: Partial<Owner>) => Promise<Owner>;
  updateWalker: (id: string, data: Partial<Walker>) => Promise<Walker>;
  updateWalk: (id: string, data: Partial<Walk>) => Promise<Walk>;
  updateAssessment: (id: string, data: Partial<Assessment>) => Promise<Assessment>;
  // Additional functions
  refreshData: () => Promise<boolean>;
  deleteDog: (id: string) => Promise<boolean>;
}

// Create the context
const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [walks, setWalks] = useState<Walk[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // Fetch all data from API
  const fetchData = useCallback(async () => {
    try {
      if (isLoading) return; // Prevent multiple simultaneous calls
      setIsLoading(true);
      setError(null);

      // Set authentication headers
      const headers = {
        'user-id': user?.id || '',
        'user-role': user?.role || '',
        'user-profile-id': user?.profileId || ''
      };

      // Fetch walkers
      try {
        const walkersRes = await fetch('/api/data/walkers', { headers });
        if (walkersRes.ok) {
          const walkersData = await walkersRes.json();
          setWalkers(walkersData);
        }
      } catch (error) {
        console.warn('Failed to fetch walkers:', error);
      }

      // Fetch owners
      try {
        const ownersRes = await fetch('/api/data/owners', { headers });
        if (ownersRes.ok) {
          const ownersData = await ownersRes.json();
          setOwners(ownersData);
        }
      } catch (error) {
        console.warn('Failed to fetch owners:', error);
      }

      // Fetch dogs
      try {
        const dogsRes = await fetch('/api/data/dogs', { headers });
        if (dogsRes.ok) {
          const dogsData = await dogsRes.json();
          setDogs(dogsData);
        }
      } catch (error) {
        console.warn('Failed to fetch dogs:', error);
      }

      // Fetch walks
      try {
        const walksRes = await fetch('/api/data/walks', { headers });
        if (walksRes.ok) {
          const walksData = await walksRes.json();
          setWalks(walksData);
        }
      } catch (error) {
        console.warn('Failed to fetch walks:', error);
      }
      
      // Fetch assessments - include all user types to see their assessments
      try {
        const assessmentsRes = await fetch('/api/data/assessments', { headers });
        if (assessmentsRes.ok) {
          const assessmentsData = await assessmentsRes.json();
          setAssessments(assessmentsData);
        }
      } catch (error) {
        console.warn('Failed to fetch assessments:', error);
      }

      // Note: Subscription endpoints are commented out until they're implemented
      /*
      // Fetch user subscriptions
      const subscriptionsRes = await fetch('/api/data/subscriptions', { headers });
      if (subscriptionsRes.ok) {
        const subscriptionsData = await subscriptionsRes.json();
        setUserSubscriptions(subscriptionsData);
      }
      
      // Fetch subscription plans
      const plansRes = await fetch('/api/data/subscription-plans', { headers });
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setSubscriptionPlans(plansData);
      }
      */

      return true;
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, user]);

  // Fetch data on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Utility functions to get entities by ID
  const getDogById = useCallback((id: string) => dogs.find(dog => dog.id === id), [dogs]);
  const getOwnerById = useCallback((id: string) => owners.find(owner => owner.id === id), [owners]);
  const getWalkerById = useCallback((id: string) => walkers.find(walker => walker.id === id), [walkers]);
  const getWalkById = useCallback((id: string) => walks.find(walk => walk.id === id), [walks]);
  const getAssessmentById = useCallback((id: string) => assessments.find(assessment => assessment.id === id), [assessments]);
  const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);

  // Update functions
  const updateDog = async (id: string, data: Partial<Dog>): Promise<Dog> => {
    const updatedDog = await DogAPI.update(id, data);
    setDogs(prev => prev.map(dog => dog.id === id ? updatedDog : dog));
    return updatedDog;
  };

  const updateOwner = async (id: string, data: Partial<Owner>): Promise<Owner> => {
    const updatedOwner = await OwnerAPI.update(id, data);
    setOwners(prev => prev.map(owner => owner.id === id ? updatedOwner : owner));
    return updatedOwner;
  };

  const updateWalker = async (id: string, data: Partial<Walker>): Promise<Walker> => {
    const updatedWalker = await WalkerAPI.update(id, data);
    setWalkers(prev => prev.map(walker => walker.id === id ? updatedWalker : walker));
    return updatedWalker;
  };

  const updateWalk = async (id: string, data: Partial<Walk>): Promise<Walk> => {
    const updatedWalk = await WalkAPI.update(id, data);
    setWalks(prev => prev.map(walk => walk.id === id ? updatedWalk : walk));
    return updatedWalk;
  };

  const updateAssessment = async (id: string, data: Partial<Assessment>): Promise<Assessment> => {
    const updatedAssessment = await AssessmentAPI.update(id, data);
    setAssessments(prev => prev.map(assessment => assessment.id === id ? updatedAssessment : assessment));
    return updatedAssessment;
  };

  const deleteDog = async (id: string): Promise<boolean> => {
    try {
      await DogAPI.delete(id);
      setDogs(prev => prev.filter(dog => dog.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting dog:', error);
      return false;
    }
  };

  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Force direct API calls to get the most up-to-date data, bypassing cache
      try {
        // Set authentication headers for API requests
        const headers = {
          'Cache-Control': 'no-cache', 
          'user-id': user?.id || '',
          'user-role': user?.role || '',
          'user-profile-id': user?.profileId || ''
        };
        
        // Fetch assessments directly
        try {
          const assessmentsResponse = await fetch('/api/data/assessments', {
            cache: 'no-store',
            headers
          });
          
          if (assessmentsResponse.ok) {
            const freshAssessments = await assessmentsResponse.json();
            setAssessments(freshAssessments);
          }
        } catch (assessmentsError) {
          console.warn('Error fetching assessments:', assessmentsError);
        }
        
        // Fetch dogs directly 
        try {
          const dogsResponse = await fetch('/api/data/dogs', {
            cache: 'no-store',
            headers
          });
          
          if (dogsResponse.ok) {
            const freshDogs = await dogsResponse.json();
            setDogs(freshDogs);
          }
        } catch (dogsError) {
          console.warn('Error fetching dogs:', dogsError);
        }
      } catch (apiError) {
        console.error('Error during direct API refresh:', apiError);
        // Fall back to general fetchData if direct API calls fail
        await fetchData();
      }
      
      return true;
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, user]);

  const value = {
    dogs,
    owners,
    walkers,
    walks,
    assessments,
    users,
    messages,
    conversations,
    userSubscriptions,
    subscriptionPlans,
    getDogById,
    getOwnerById,
    getWalkerById,
    getWalkById,
    getAssessmentById,
    getUserById,
    updateDog,
    updateOwner,
    updateWalker,
    updateWalk,
    updateAssessment,
    refreshData,
    deleteDog
  };

  if (error) {
    console.error('DataProvider Error:', error);
  }

  return (
    <DataContext.Provider value={value}>
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