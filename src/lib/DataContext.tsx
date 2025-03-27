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
  refreshData: () => Promise<void>;
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

  // Fetch data based on user role and permissions
  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch dogs
      const dogsData = await DogAPI.getAll();
      setDogs(dogsData);

      // Fetch owners if admin or if user is an owner (to see their own data)
      if (user.role === 'admin' || user.role === 'owner') {
        const ownersData = await OwnerAPI.getAll();
        setOwners(ownersData);
      }

      // Fetch walkers if admin or if user is a walker
      if (user.role === 'admin' || user.role === 'walker') {
        const walkersData = await WalkerAPI.getAll();
        setWalkers(walkersData);
      }

      // Fetch walks based on role
      let walksData;
      if (user.role === 'admin') {
        walksData = await WalkAPI.getAll();
      } else if (user.role === 'walker' && user.profileId) {
        walksData = await WalkAPI.getByWalkerId(user.profileId);
      } else if (user.role === 'owner' && user.profileId) {
        // Get all dogs for this owner
        const ownerDogs = dogsData.filter((dog: Dog) => dog.ownerId === user.profileId);
        // Get walks for all owner's dogs
        const walkPromises = ownerDogs.map((dog: Dog) => WalkAPI.getByDogId(dog.id));
        const walkResults = await Promise.all(walkPromises);
        walksData = walkResults.flat();
      }
      if (walksData) {
        setWalks(walksData);
      }

      // Fetch assessments if admin or if user is a walker
      if (user.role === 'admin' || user.role === 'walker') {
        const assessmentsData = await AssessmentAPI.getAll();
        setAssessments(assessmentsData);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch data on mount and when user changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const refreshData = useCallback(() => fetchData(), [fetchData]);

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