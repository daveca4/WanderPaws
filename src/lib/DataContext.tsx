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
  vets: any[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<boolean>;
  getDogById: (id: string) => Dog | undefined;
  getOwnerById: (id: string) => Owner | undefined;
  getWalkerById: (id: string) => Walker | undefined;
  getWalkById: (id: string) => Walk | undefined;
  getAssessmentById: (id: string) => Assessment | undefined;
  getUserById: (id: string) => User | undefined;
  updateDog: (id: string, data: Partial<Dog>) => Promise<Dog>;
  updateOwner: (id: string, data: Partial<Owner>) => Promise<Owner>;
  updateWalker: (id: string, data: Partial<Walker>) => Promise<Walker>;
  updateWalk: (id: string, data: Partial<Walk>) => Promise<Walk>;
  updateAssessment: (id: string, data: Partial<Assessment>) => Promise<Assessment>;
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
  const [vets, setVets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  // Function to fetch all data
  const fetchData = useCallback(async (failedEndpoints: Set<string> = new Set()): Promise<boolean> => {
    if (isLoading) return false; // prevent multiple concurrent fetches
    
    // Don't attempt to fetch data if user isn't available yet
    if (!user || !user.id) {
      console.log('Skipping data fetch - user not available yet');
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Headers needed for authenticated requests
      const headers = {
        'Content-Type': 'application/json',
        'user-id': user.id,
        'user-role': user.role || '',
        'user-profile-id': user.profileId || ''
      };
      
      console.log('Fetching data with auth headers:', {
        userId: user.id,
        userRole: user.role,
        profileId: user.profileId
      });
      
      // Fetch users
      if (!failedEndpoints.has('/api/data/users')) {
        try {
          const usersRes = await fetch('/api/data/users', { headers });
          if (usersRes.ok) {
            const usersData = await usersRes.json();
            setUsers(usersData);
          } else {
            console.error('Failed to fetch users:', usersRes.status, await usersRes.text());
            failedEndpoints.add('/api/data/users');
          }
        } catch (error) {
          console.error('Error fetching users:', error);
          failedEndpoints.add('/api/data/users');
        }
      }
      
      // Fetch owners
      if (!failedEndpoints.has('/api/data/owners')) {
        try {
          const ownersRes = await fetch('/api/data/owners', { headers });
          if (ownersRes.ok) {
            const ownersData = await ownersRes.json();
            setOwners(ownersData);
          } else {
            console.error('Failed to fetch owners:', ownersRes.status, await ownersRes.text());
            failedEndpoints.add('/api/data/owners');
          }
        } catch (error) {
          console.error('Error fetching owners:', error);
          failedEndpoints.add('/api/data/owners');
        }
      }
      
      // Fetch walkers
      if (!failedEndpoints.has('/api/data/walkers')) {
        try {
          const walkersRes = await fetch('/api/data/walkers', { headers });
          if (walkersRes.ok) {
            const walkersData = await walkersRes.json();
            setWalkers(walkersData);
          } else {
            console.error('Failed to fetch walkers:', walkersRes.status, await walkersRes.text());
            failedEndpoints.add('/api/data/walkers');
          }
        } catch (error) {
          console.error('Error fetching walkers:', error);
          failedEndpoints.add('/api/data/walkers');
        }
      }
      
      // Fetch dogs
      if (!failedEndpoints.has('/api/data/dogs')) {
        try {
          const dogsRes = await fetch('/api/data/dogs', { headers });
          if (dogsRes.ok) {
            const dogsData = await dogsRes.json();
            console.log('DataContext: Dogs data fetched:', dogsData);
            
            if (user && user.id) {
              console.log('DataContext: Current user:', user);
              
              // Identify user's dogs for debugging
              const userDogsById = dogsData.filter((dog: Dog) => dog.ownerId === user.id);
              const profileId = user.profileId || '';
              const userDogsByProfileId = profileId ? dogsData.filter((dog: Dog) => dog.ownerId === profileId) : [];
              
              console.log('DataContext: Dogs by user.id:', userDogsById);
              console.log('DataContext: Dogs by user.profileId:', userDogsByProfileId);
              
              // Also try string versions (in case of type mismatches)
              const userDogsByIdStr = dogsData.filter((dog: Dog) => dog.ownerId === user.id.toString());
              const userDogsByProfileIdStr = profileId ? dogsData.filter((dog: Dog) => dog.ownerId === profileId.toString()) : [];
              
              console.log('DataContext: User dogs by ID breakdown:');
              console.log('- By user.id:', userDogsById.length, userDogsById.map((d: Dog) => d.name));
              console.log('- By profileId:', userDogsByProfileId.length, userDogsByProfileId.map((d: Dog) => d.name));
              console.log('- By user.id string:', userDogsByIdStr.length, userDogsByIdStr.map((d: Dog) => d.name));
              console.log('- By profileId string:', userDogsByProfileIdStr.length, userDogsByProfileIdStr.map((d: Dog) => d.name));
            }
            
            // Log when dog data is loaded
            console.log('DataContext: Dog data loaded, count:', dogsData?.length);
            if (dogsData && dogsData.length > 0) {
              console.log('DataContext: First dog name:', dogsData[0].name);
              // Log dog owner IDs to help debug ownership issues
              console.log('DataContext: Dog owner IDs:', dogsData.map((dog: Dog) => dog.ownerId));
              
              // Log the full first dog object to verify structure
              console.log('DataContext: First dog full object:', JSON.stringify(dogsData[0]));
            } else {
              console.warn('DataContext: No dogs data available or empty array');
            }
            
            try {
              setDogs(dogsData);
              console.log('DataContext: Successfully set dogs data in context');
            } catch (error) {
              console.error('DataContext: Error setting dog data in context:', error);
              // Attempt to set empty array as a fallback
              setDogs([]);
            }
          } else {
            console.error('Failed to fetch dogs:', dogsRes.status, await dogsRes.text());
            failedEndpoints.add('/api/data/dogs');
          }
        } catch (error) {
          console.error('Error setting dog data in context:', error);
          setDogs([]);
        }
      }
      
      // Fetch assessments
      if (!failedEndpoints.has('/api/data/assessments')) {
        try {
          const assessmentsRes = await fetch('/api/data/assessments', { headers });
          if (assessmentsRes.ok) {
            const assessmentsData = await assessmentsRes.json();
            setAssessments(assessmentsData);
          } else {
            console.error('Failed to fetch assessments:', assessmentsRes.status, await assessmentsRes.text());
            failedEndpoints.add('/api/data/assessments');
          }
        } catch (error) {
          console.error('Error fetching assessments:', error);
          failedEndpoints.add('/api/data/assessments');
        }
      }
      
      // Fetch walks
      if (!failedEndpoints.has('/api/data/walks')) {
        try {
          const walksRes = await fetch('/api/data/walks', { headers });
          if (walksRes.ok) {
            const walksData = await walksRes.json();
            setWalks(walksData);
          } else {
            console.error('Failed to fetch walks:', walksRes.status, await walksRes.text());
            failedEndpoints.add('/api/data/walks');
          }
        } catch (error) {
          console.error('Error fetching walks:', error);
          failedEndpoints.add('/api/data/walks');
        }
      }
      
      // Fetch veterinarians
      if (!failedEndpoints.has('/api/data/vets')) {
        try {
          const vetsRes = await fetch('/api/data/vets', { headers });
          if (vetsRes.ok) {
            const vetsData = await vetsRes.json();
            setVets(vetsData);
          } else {
            console.error('Failed to fetch vets:', vetsRes.status, await vetsRes.text());
            failedEndpoints.add('/api/data/vets');
          }
        } catch (error) {
          console.error('Error fetching vets:', error);
          failedEndpoints.add('/api/data/vets');
        }
      }

      // Fetch user subscriptions
      if (!failedEndpoints.has('/api/subscriptions/users')) {
        try {
          console.log('Fetching user subscriptions in DataContext');
          const subscriptionsRes = await fetch('/api/subscriptions/users', { 
            headers: {
              ...headers,
              'user-id': user?.id || '',
              'user-role': user?.role || ''
            }
          });
          
          if (subscriptionsRes.ok) {
            const subscriptionsData = await subscriptionsRes.json();
            console.log('User subscriptions loaded:', subscriptionsData);
            if (subscriptionsData.subscriptions && Array.isArray(subscriptionsData.subscriptions)) {
              setUserSubscriptions(subscriptionsData.subscriptions);
            }
          } else {
            console.warn('Failed to fetch subscriptions from primary endpoint:', await subscriptionsRes.text());
            failedEndpoints.add('/api/subscriptions/users');
            
            // Fallback to the data API
            if (!failedEndpoints.has('/api/data/subscriptions')) {
              try {
                const fallbackRes = await fetch('/api/data/subscriptions', { headers });
                if (fallbackRes.ok) {
                  const fallbackData = await fallbackRes.json();
                  console.log('Fallback subscriptions loaded:', fallbackData);
                  setUserSubscriptions(fallbackData);
                } else {
                  console.error('Failed to fetch subscriptions from fallback:', fallbackRes.status, await fallbackRes.text());
                  failedEndpoints.add('/api/data/subscriptions');
                }
              } catch (error) {
                console.error('Error fetching fallback subscriptions:', error);
                failedEndpoints.add('/api/data/subscriptions');
              }
            }
          }
        } catch (err) {
          console.error('Error fetching subscriptions:', err);
          failedEndpoints.add('/api/subscriptions/users');
        }
      }
      
      // Fetch subscription plans
      if (!failedEndpoints.has('/api/subscriptions/plans')) {
        try {
          const plansRes = await fetch('/api/subscriptions/plans', { 
            headers: {
              ...headers,
              'user-id': user?.id || '',
              'user-role': user?.role || ''
            } 
          });
          
          if (plansRes.ok) {
            const plansData = await plansRes.json();
            console.log('Subscription plans loaded:', plansData);
            if (plansData.plans && Array.isArray(plansData.plans)) {
              setSubscriptionPlans(plansData.plans);
            }
          } else {
            console.warn('Failed to fetch subscription plans from primary endpoint');
            failedEndpoints.add('/api/subscriptions/plans');
            
            // Fallback to the data API
            if (!failedEndpoints.has('/api/data/subscription-plans')) {
              try {
                const fallbackRes = await fetch('/api/data/subscription-plans', { headers });
                if (fallbackRes.ok) {
                  const fallbackData = await fallbackRes.json();
                  setSubscriptionPlans(fallbackData);
                } else {
                  console.error('Failed to fetch subscription plans from fallback:', fallbackRes.status, await fallbackRes.text());
                  failedEndpoints.add('/api/data/subscription-plans');
                }
              } catch (error) {
                console.error('Error fetching fallback subscription plans:', error);
                failedEndpoints.add('/api/data/subscription-plans');
              }
            }
          }
        } catch (err) {
          console.error('Error fetching subscription plans:', err);
          failedEndpoints.add('/api/subscriptions/plans');
        }
      }

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
      // Track the last time we fetched data to prevent excessive refreshes
      const lastFetchTime = Date.now();
      
      // Add tracking for failed endpoints to prevent unnecessary retries
      const failedEndpoints = new Set<string>();
      
      // Store if we have an in-progress fetch
      let isFetchInProgress = true;
      
      fetchData()
        .then((success) => {
          console.log('Initial data loading completed - success:', success);
          isFetchInProgress = false;
          
          // Only do the second fetch if the first one was successful,
          // and the component is still mounted
          if (success) {
            const secondFetchTimeout = setTimeout(() => {
              // Make sure we're not fetching too frequently (at least 500ms between fetches)
              const timeSinceLastFetch = Date.now() - lastFetchTime;
              if (timeSinceLastFetch < 500) {
                console.log('Skipping second fetch - too soon after initial fetch');
                return;
              }
              
              console.log('Running second refresh to ensure latest data');
              // Don't retry failed endpoints from the first attempt
              fetchData(failedEndpoints);
            }, 1000);
            
            // Clean up the timeout if the component unmounts
            return () => clearTimeout(secondFetchTimeout);
          }
        })
        .catch(err => {
          console.error('Error in initial data loading:', err);
          isFetchInProgress = false;
        });
      
      // Cleanup function to indicate the component unmounted
      return () => {
        isFetchInProgress = false;
      };
    }
  }, [user, fetchData]); // Don't add any other dependencies here to prevent excessive refreshes

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

  // Add a ref to track last refresh time instead of property on function
  const lastRefreshTimeRef = React.useRef<number>(0);
  
  // Modify refreshData to prevent frequent calls
  const refreshData = useCallback(async () => {
    // Add debounce - don't refresh if we've refreshed in the last 2 seconds
    const now = Date.now();
    if (lastRefreshTimeRef.current && now - lastRefreshTimeRef.current < 2000) {
      console.log('Skipping refresh - too soon since last refresh');
      return true; // Return success to prevent caller from retrying immediately
    }
    
    // Track that we're currently trying to refresh
    const isRefreshing = true;
    console.log('Starting data refresh');
    
    // Set last refresh time
    lastRefreshTimeRef.current = now;
    
    try {
      // Don't attempt to fetch data if user isn't available yet
      if (!user || !user.id) {
        console.log('Skipping data refresh - user not available yet');
        return false;
      }
      
      setIsLoading(true);
      setError(null);
      
      // Force direct API calls to get the most up-to-date data, bypassing cache
      try {
        // Set authentication headers for API requests
        const headers = {
          'Cache-Control': 'no-cache', 
          'user-id': user.id,
          'user-role': user.role || '',
          'user-profile-id': user.profileId || ''
        };
        
        console.log('Refreshing data with auth headers:', {
          userId: user.id,
          userRole: user.role,
          profileId: user.profileId
        });
        
        // Fetch user subscriptions with proper authentication
        try {
          console.log('Fetching user subscriptions in refreshData');
          // First try the official API endpoint
          const subscriptionsRes = await fetch('/api/subscriptions/users', { 
            cache: 'no-store',
            headers
          });
          
          if (subscriptionsRes.ok) {
            const subscriptionsData = await subscriptionsRes.json();
            console.log('User subscriptions loaded in refresh:', subscriptionsData);
            if (subscriptionsData.subscriptions && Array.isArray(subscriptionsData.subscriptions)) {
              setUserSubscriptions(subscriptionsData.subscriptions);
              
              // Log each subscription for debugging
              subscriptionsData.subscriptions.forEach((sub: any, idx: number) => {
                console.log(`Subscription ${idx+1}:`, {
                  id: sub.id,
                  userId: sub.userId,
                  status: sub.status,
                  startDate: sub.startDate,
                  endDate: sub.endDate,
                  planId: sub.planId
                });
              });
            }
          } else {
            console.warn('Failed to fetch from official API endpoint:', await subscriptionsRes.text());
            
            // Try the admin endpoint with admin-specific headers as a fallback
            console.log('Trying admin endpoint as fallback...');
            try {
              const adminRes = await fetch('/api/admin/subscriptions/users', {
                cache: 'no-store',
                headers: {
                  ...headers,
                  'admin-access': 'true'
                }
              });
              
              if (adminRes.ok) {
                const adminData = await adminRes.json();
                console.log('Admin subscription data:', adminData);
                if (adminData.subscriptions && Array.isArray(adminData.subscriptions)) {
                  setUserSubscriptions(adminData.subscriptions);
                }
              }
            } catch (adminErr) {
              console.warn('Admin fallback failed:', adminErr);
            }
            
            // Try data API as second fallback
            try {
              console.log('Trying data API fallback...');
              const dataRes = await fetch(`/api/data/subscriptions?userId=${user.id}`, { 
                cache: 'no-store',
                headers 
              });
              
              if (dataRes.ok) {
                const dataSubsData = await dataRes.json();
                console.log('Data API subscriptions:', dataSubsData);
                if (Array.isArray(dataSubsData)) {
                  setUserSubscriptions(dataSubsData);
                }
              }
            } catch (dataErr) {
              console.warn('Data API fallback failed:', dataErr);
            }
          }
        } catch (err) {
          console.error('Error fetching subscriptions during refresh:', err);
        }
        
        // Fetch dogs data
        try {
          const dogsResponse = await fetch('/api/data/dogs', { 
            cache: 'no-store', 
            headers 
          });
          
          if (dogsResponse.ok) {
            const freshDogs = await dogsResponse.json();
            setDogs(freshDogs);
          } else {
            console.warn('Failed to fetch dogs data:', await dogsResponse.text());
          }
        } catch (dogsErr) {
          console.warn('Error fetching dogs data:', dogsErr);
        }
        
        // Fetch assessments data - only if needed
        try {
          const assessmentsResponse = await fetch('/api/data/assessments', { 
            cache: 'no-store', 
            headers 
          });
          
          if (assessmentsResponse.ok) {
            const freshAssessments = await assessmentsResponse.json();
            setAssessments(freshAssessments);
          } else {
            console.warn('Failed to fetch assessments data:', await assessmentsResponse.text());
          }
        } catch (assessmentsErr) {
          console.warn('Error fetching assessments data:', assessmentsErr);
        }
        
        return true;
      } catch (apiError) {
        console.error('Error during direct API refresh:', apiError);
        // Don't fall back to general fetchData to avoid infinite refreshes
        return false;
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return false;
    } finally {
      setIsLoading(false);
      console.log('Data refresh completed');
    }
  }, [user]);

  // Set up the context value
  const value: DataContextType = {
    dogs,
    owners,
    walkers,
    users,
    walks,
    vets,
    assessments,
    subscriptionPlans,
    userSubscriptions,
    isLoading,
    error,
    messages: [],
    conversations: [],
    refreshData,
    getDogById,
    getOwnerById,
    getWalkerById,
    getWalkById,
    getAssessmentById,
    getUserById,
    updateDog,
    updateOwner: async (id: string, data: Partial<Owner>) => {
      console.warn('updateOwner is not implemented');
      return { id, ...data } as Owner;
    },
    updateWalker: async (id: string, data: Partial<Walker>) => {
      console.warn('updateWalker is not implemented');
      return { id, ...data } as Walker;
    },
    updateAssessment,
    updateWalk,
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