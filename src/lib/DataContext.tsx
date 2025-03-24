import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Dog, Owner, Walker, Walk, Assessment, Message, Conversation, SubscriptionPlan, UserSubscription } from './types';

// Define the shape of our data context
interface DataContextType {
  // Data access methods
  dogs: Dog[];
  owners: Owner[];
  walkers: Walker[];
  walks: Walk[];
  assessments: Assessment[];
  messages: Message[];
  conversations: Conversation[];
  subscriptionPlans: SubscriptionPlan[];
  userSubscriptions: UserSubscription[];
  
  // Get by ID methods
  getDogById: (id: string) => Dog | undefined;
  getOwnerById: (id: string) => Owner | undefined;
  getWalkerById: (id: string) => Walker | undefined;
  getWalkById: (id: string) => Walk | undefined;
  getAssessmentById: (id: string) => Assessment | undefined;
  
  // Get related data
  getDogsByOwnerId: (ownerId: string) => Dog[];
  getWalksByDogId: (dogId: string) => Walk[];
  getWalksByWalkerId: (walkerId: string) => Walk[];
  
  // CRUD operations
  createDog: (dog: Omit<Dog, 'id'>) => Promise<Dog>;
  updateDog: (id: string, dog: Partial<Dog>) => Promise<Dog>;
  deleteDog: (id: string) => Promise<boolean>;
  
  createWalk: (walk: Omit<Walk, 'id'>) => Promise<Walk>;
  updateWalk: (id: string, walk: Partial<Walk>) => Promise<Walk>;
  deleteWalk: (id: string) => Promise<boolean>;
  
  // Data source control
  dbEmpty: boolean;
  
  // Data loading state
  isLoading: boolean;
  error: string | null;
  
  // Database utilities
  resetDatabase: () => Promise<{ success: boolean }>;
}

// Create the context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Create a provider component
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for all data
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [walkers, setWalkers] = useState<Walker[]>([]);
  const [walks, setWalks] = useState<Walk[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<UserSubscription[]>([]);
  
  // Database state
  const [dbEmpty, setDbEmpty] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Verify database connection using API
  const verifyDatabaseConnection = async () => {
    try {
      const response = await fetch('/api/check-database-connection');
      const data = await response.json();
      const isEmpty = data.isEmpty;
      setDbEmpty(isEmpty);
      return !isEmpty;
    } catch (err) {
      console.error('Error connecting to database:', err);
      setError('Failed to connect to database');
      return false;
    }
  };

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load data from API endpoints instead of direct database access
        const [dogsResponse, ownersResponse, walkersResponse, walksResponse, assessmentsResponse, 
               subscriptionPlansResponse, userSubscriptionsResponse] = await Promise.all([
          fetch('/api/data/dogs'),
          fetch('/api/data/owners'),
          fetch('/api/data/walkers'),
          fetch('/api/data/walks'),
          fetch('/api/data/assessments'),
          fetch('/api/data/subscription-plans'),
          fetch('/api/data/user-subscriptions')
        ]);
        
        if (!dogsResponse.ok || !ownersResponse.ok || !walkersResponse.ok || !walksResponse.ok) {
          throw new Error('Failed to fetch data from API');
        }
        
        const dogsData = await dogsResponse.json();
        const ownersData = await ownersResponse.json();
        const walkersData = await walkersResponse.json();
        const walksData = await walksResponse.json();
        
        // Set data (already parsed by the API)
        setDogs(dogsData);
        setOwners(ownersData);
        setWalkers(walkersData);
        setWalks(walksData);
        
        // Load additional data if responses are ok
        if (assessmentsResponse.ok) {
          setAssessments(await assessmentsResponse.json());
        }
        
        // Load subscription data
        if (subscriptionPlansResponse.ok) {
          setSubscriptionPlans(await subscriptionPlansResponse.json());
        }
        
        if (userSubscriptionsResponse.ok) {
          setUserSubscriptions(await userSubscriptionsResponse.json());
        }
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data from database');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Check database connection first
    verifyDatabaseConnection().then((hasData) => {
      if (hasData) {
        loadData();
      }
    });
  }, []);
  
  // Data access methods
  const getDogById = (id: string) => {
    return dogs.find(dog => dog.id === id);
  };
  
  const getOwnerById = (id: string) => {
    return owners.find(owner => owner.id === id);
  };
  
  const getWalkerById = (id: string) => {
    return walkers.find(walker => walker.id === id);
  };
  
  const getWalkById = (id: string) => {
    return walks.find(walk => walk.id === id);
  };
  
  const getAssessmentById = (id: string) => {
    return assessments.find(assessment => assessment.id === id);
  };
  
  // Get related data
  const getDogsByOwnerId = (ownerId: string) => {
    return dogs.filter(dog => dog.ownerId === ownerId);
  };
  
  const getWalksByDogId = (dogId: string) => {
    return walks.filter(walk => walk.dogId === dogId);
  };
  
  const getWalksByWalkerId = (walkerId: string) => {
    return walks.filter(walk => walk.walkerId === walkerId);
  };
  
  // CRUD operations using fetch instead of direct database calls
  const createDog = async (dog: Omit<Dog, 'id'>): Promise<Dog> => {
    try {
      const response = await fetch('/api/data/dogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dog),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create dog');
      }
      
      const newDog = await response.json();
      
      // Update local state
      setDogs(prevDogs => [...prevDogs, newDog]);
      return newDog;
    } catch (error) {
      console.error('Error creating dog:', error);
      throw error;
    }
  };
  
  const updateDog = async (id: string, dogUpdates: Partial<Dog>): Promise<Dog> => {
    try {
      const response = await fetch(`/api/data/dogs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dogUpdates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update dog');
      }
      
      const updatedDog = await response.json();
      
      // Update local state
      setDogs(prevDogs => prevDogs.map(dog => {
        if (dog.id === id) {
          return updatedDog;
        }
        return dog;
      }));
      
      return updatedDog;
    } catch (error) {
      console.error(`Error updating dog with ID ${id}:`, error);
      throw error;
    }
  };
  
  const deleteDog = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/data/dogs/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete dog');
      }
      
      // Update local state
      setDogs(prevDogs => prevDogs.filter(dog => dog.id !== id));
      return true;
    } catch (error) {
      console.error(`Error deleting dog with ID ${id}:`, error);
      return false;
    }
  };
  
  const createWalk = async (walk: Omit<Walk, 'id'>): Promise<Walk> => {
    try {
      const response = await fetch('/api/data/walks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(walk),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create walk');
      }
      
      const newWalk = await response.json();
      
      // Update local state
      setWalks(prevWalks => [...prevWalks, newWalk]);
      return newWalk;
    } catch (error) {
      console.error('Error creating walk:', error);
      throw error;
    }
  };
  
  const updateWalk = async (id: string, walkUpdates: Partial<Walk>): Promise<Walk> => {
    try {
      const response = await fetch(`/api/data/walks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(walkUpdates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update walk');
      }
      
      const updatedWalk = await response.json();
      
      // Update local state
      setWalks(prevWalks => prevWalks.map(walk => {
        if (walk.id === id) {
          return updatedWalk;
        }
        return walk;
      }));
      
      return updatedWalk;
    } catch (error) {
      console.error(`Error updating walk with ID ${id}:`, error);
      throw error;
    }
  };
  
  const deleteWalk = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/data/walks/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete walk');
      }
      
      // Update local state
      setWalks(prevWalks => prevWalks.filter(walk => walk.id !== id));
      return true;
    } catch (error) {
      console.error(`Error deleting walk with ID ${id}:`, error);
      return false;
    }
  };
  
  const resetDatabase = async () => {
    try {
      const response = await fetch('/api/admin/reset-database', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset database');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error resetting database:', error);
      return { success: false };
    }
  };
  
  // Context value
  const contextValue: DataContextType = {
    // Data
    dogs,
    owners,
    walkers,
    walks,
    assessments,
    messages,
    conversations,
    subscriptionPlans,
    userSubscriptions,
    
    // Get by ID methods
    getDogById,
    getOwnerById,
    getWalkerById,
    getWalkById,
    getAssessmentById,
    
    // Get related data
    getDogsByOwnerId,
    getWalksByDogId,
    getWalksByWalkerId,
    
    // CRUD operations
    createDog,
    updateDog,
    deleteDog,
    
    createWalk,
    updateWalk,
    deleteWalk,
    
    // Data state
    dbEmpty,
    isLoading,
    error,
    
    // Database utilities
    resetDatabase,
  };
  
  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use the data context
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 