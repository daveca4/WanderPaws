'use client';

import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { Dog, Owner, Walker, Walk, Assessment, Message, Conversation, User, UserSubscription, SubscriptionPlan } from './types';
import { useAuth } from './auth/AuthContext';
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
  createDog: (data: Omit<Dog, 'id'>) => Promise<Dog>;
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
      console.log('DataContext - Skipping data fetch - user not available yet:', user);
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
      
      console.log('DataContext - Fetching data with auth headers:', {
        userId: user.id,
        userRole: user.role,
        profileId: user.profileId
      });
      
      // TROUBLESHOOTING: Add owner profile check and ensure upfront
      if (user.role === 'owner' && !user.profileId) {
        console.log('DataContext - Attempting to ensure owner profile exists before fetching data');
        try {
          const ensureRes = await fetch('/api/data/owners/ensure', {
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
          
          if (ensureRes.ok) {
            const ensuredOwner = await ensureRes.json();
            console.log('DataContext - Created/found owner profile:', ensuredOwner);
            
            // Update headers with the new profileId
            headers['user-profile-id'] = ensuredOwner.id;
            
            // Update user in localStorage to avoid repeating this step
            try {
              const storedUser = JSON.parse(localStorage.getItem('wanderpaws_user') || '{}');
              storedUser.profileId = ensuredOwner.id;
              localStorage.setItem('wanderpaws_user', JSON.stringify(storedUser));
              console.log('DataContext - Updated user in localStorage with profileId');
            } catch (e) {
              console.error('DataContext - Error updating localStorage:', e);
            }
          } else {
            console.error('DataContext - Failed to ensure owner profile:', await ensureRes.text());
          }
        } catch (error) {
          console.error('DataContext - Error ensuring owner profile:', error);
        }
      }
      
      // Fetch owners first to ensure we have the owner profile
      if (!failedEndpoints.has('/api/data/owners')) {
        try {
          console.log('DataContext - Fetching owners...');
          const ownersRes = await fetch('/api/data/owners', { headers });
          if (ownersRes.ok) {
            const ownersData = await ownersRes.json();
            console.log('DataContext - Owners data:', ownersData);
            setOwners(ownersData);
            
            // If user is an owner, ensure we have their profile
            if (user.role === 'owner' && (!user.profileId || !ownersData.some((o: Owner) => o.id === user.profileId))) {
              console.log('DataContext - Owner profile not found, ensuring profile...');
              const ensureRes = await fetch('/api/data/owners/ensure', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  userId: user.id,
                  name: user.name || 'Dog Owner',
                  email: user.email
                })
              });
              
              if (ensureRes.ok) {
                const ensuredOwner = await ensureRes.json();
                console.log('DataContext - Ensured owner profile:', ensuredOwner);
                setOwners(prev => [...prev, ensuredOwner]);
              } else {
                console.error('DataContext - Failed to ensure owner profile:', await ensureRes.text());
              }
            }
          } else {
            console.error('DataContext - Failed to fetch owners:', ownersRes.status, await ownersRes.text());
            failedEndpoints.add('/api/data/owners');
          }
        } catch (error) {
          console.error('DataContext - Error fetching owners:', error);
          failedEndpoints.add('/api/data/owners');
        }
      }
      
      // IMPROVED: Update dog fetching logic to be more resilient
      if (!failedEndpoints.has('/api/data/dogs')) {
        try {
          console.log('DataContext - Fetching dogs...');
          let dogsResponse: Response | undefined;
          let dogsData: Dog[] = [];
          let skipFetching = false;
          
          if (user.role === 'walker' && user.profileId) {
            // For walkers, use the walker-specific endpoint
            dogsResponse = await fetch(`/api/walkers/${user.profileId}/dogs`, { headers });
          } else if (user.role === 'owner') {
            // For owners, first check if they have a profile
            const ownerProfile = owners.find((owner: Owner) => owner.userId === user.id);
            
            if (!ownerProfile) {
              console.log('DataContext - Owner profile not found in data, trying direct query');
              
              // Try to fetch owner profile directly - more reliable
              try {
                const ownerRes = await fetch('/api/data/owners/byUserId/' + user.id, { 
                  headers 
                });
                
                if (ownerRes.ok) {
                  const fetchedOwner = await ownerRes.json();
                  console.log('DataContext - Found owner profile via direct query:', fetchedOwner);
                  
                  if (fetchedOwner && fetchedOwner.id) {
                    // Try to fetch dogs with this owner ID
                    const ownerDogsRes = await fetch(`/api/data/owners/${fetchedOwner.id}/dogs`, { 
                      headers 
                    });
                    
                    if (ownerDogsRes.ok) {
                      dogsData = await ownerDogsRes.json();
                      console.log('DataContext - Successfully fetched dogs via owner ID:', 
                        dogsData.length, dogsData.map(d => d.name));
                      
                      setDogs(dogsData);
                      skipFetching = true;
                    } else {
                      console.error('Failed to fetch dogs via owner endpoint:', 
                        await ownerDogsRes.text());
                    }
                  }
                }
              } catch (e) {
                console.error('Error in direct owner profile query:', e);
              }
              
              // If we still don't have dogs, return empty array
              if (!dogsData.length) {
                console.log('DataContext - Owner profile not found, returning empty dogs array');
                setDogs([]);
                // Skip remaining dog fetching since we know there's no owner profile
                failedEndpoints.add('/api/data/dogs');
                skipFetching = true;
              }
            } else {
              console.log('DataContext - Using owner profile to fetch dogs:', ownerProfile.id);
              // Try owner-specific endpoint first for more reliable results
              try {
                const specificRes = await fetch(`/api/data/owners/${ownerProfile.id}/dogs`, { 
                  headers 
                });
                
                if (specificRes.ok) {
                  dogsData = await specificRes.json();
                  console.log('DataContext - Successfully fetched dogs via owner endpoint:', 
                    dogsData.length, dogsData.map(d => d.name));
                  
                  setDogs(dogsData);
                  skipFetching = true;
                } else {
                  // Fallback to main endpoint if owner-specific fails
                  console.log('DataContext - Owner endpoint failed, falling back to main dogs endpoint');
                  dogsResponse = await fetch('/api/data/dogs', { headers });
                }
              } catch (e) {
                console.error('Error fetching from owner endpoint:', e);
                // Fallback to main endpoint
                dogsResponse = await fetch('/api/data/dogs', { headers });
              }
            }
          } else {
            // For admins, use the main dogs endpoint
            dogsResponse = await fetch('/api/data/dogs', { headers });
          }
          
          // Only process response if we didn't skip due to missing owner profile
          if (!skipFetching && !failedEndpoints.has('/api/data/dogs') && dogsResponse) {
            if (dogsResponse.ok) {
              const dogsData = await dogsResponse.json();
              console.log('DataContext - Dogs data:', dogsData);
              
              // Log detailed information about the dogs
              if (Array.isArray(dogsData)) {
                console.log('DataContext - Number of dogs:', dogsData.length);
                console.log('DataContext - Dogs by owner:', 
                  dogsData.reduce((acc: any, dog: Dog) => {
                    acc[dog.ownerId] = acc[dog.ownerId] || [];
                    acc[dog.ownerId].push({
                      id: dog.id,
                      name: dog.name,
                      ownerId: dog.ownerId
                    });
                    return acc;
                  }, {})
                );
              }
              
              setDogs(dogsData);
            } else {
              // If error is specifically about missing owner profile, handle gracefully
              if (dogsResponse.status === 404) {
                const errorText = await dogsResponse.text();
                if (errorText.includes('Owner profile not found')) {
                  console.log('DataContext - Owner profile not found error, returning empty dogs array');
                  setDogs([]);
                } else {
                  console.error('DataContext - Failed to fetch dogs:', dogsResponse.status, errorText);
                  failedEndpoints.add('/api/data/dogs');
                }
              } else {
                console.error('DataContext - Failed to fetch dogs:', dogsResponse.status, await dogsResponse.text());
                failedEndpoints.add('/api/data/dogs');
              }
            }
          }
        } catch (error) {
          console.error('DataContext - Error fetching dogs:', error);
          failedEndpoints.add('/api/data/dogs');
        }
      }
      
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
          // First try the official API endpoint
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
            
            // Normalize subscription data structure
            const normalizedSubscriptions = subscriptionsData.subscriptions.map((sub: any) => ({
              id: sub.id,
              userId: sub.userId,
              ownerId: sub.ownerId || sub.userId, // Fallback to userId if ownerId not present
              planId: sub.planId,
              planName: sub.planName || sub.plan?.name, // Fallback to plan.name if planName not present
              status: sub.status,
              startDate: sub.startDate,
              endDate: sub.endDate,
              creditsRemaining: sub.creditsRemaining,
              walkCredits: sub.walkCredits || sub.totalCredits, // Handle both field names
              walkDuration: sub.walkDuration,
              purchaseAmount: sub.purchaseAmount,
              purchaseDate: sub.purchaseDate
            }));
            
            console.log('Normalized subscriptions:', normalizedSubscriptions);
            setUserSubscriptions(normalizedSubscriptions);
          } else {
            console.warn('Failed to fetch from official API endpoint:', await subscriptionsRes.text());
            
            // Try the data API as fallback
            try {
              console.log('Trying data API fallback...');
              const dataRes = await fetch(`/api/data/subscriptions?userId=${user.id}`, { 
                headers 
              });
              
              if (dataRes.ok) {
                const dataSubsData = await dataRes.json();
                console.log('Data API subscriptions:', dataSubsData);
                
                // Normalize subscription data structure
                const normalizedSubscriptions = dataSubsData.map((sub: any) => ({
                  id: sub.id,
                  userId: sub.userId,
                  ownerId: sub.ownerId || sub.userId,
                  planId: sub.planId,
                  planName: sub.planName,
                  status: sub.status,
                  startDate: sub.startDate,
                  endDate: sub.endDate,
                  creditsRemaining: sub.creditsRemaining,
                  walkCredits: sub.walkCredits,
                  walkDuration: sub.walkDuration,
                  purchaseAmount: sub.purchaseAmount,
                  purchaseDate: sub.purchaseDate
                }));
                
                setUserSubscriptions(normalizedSubscriptions);
              }
            } catch (dataErr) {
              console.warn('Data API fallback failed:', dataErr);
            }
          }
        } catch (err) {
          console.error('Error fetching subscriptions during refresh:', err);
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
    } catch (error) {
      console.error('DataContext - Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
      setIsLoading(false);
      return false;
    }
  }, [user, isLoading]);

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

  const createDog = async (data: Omit<Dog, 'id'>): Promise<Dog> => {
    try {
      // If user is an owner and missing profileId, create dog directly with the specialized API
      if (user?.role === 'owner' && !user.profileId) {
        console.log('Creating dog directly with API - will handle owner profile server-side');
        
        // Use direct fetch call with exact headers we need
        const response = await fetch('/api/data/dogs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': user.id,
            'user-role': user.role
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error creating dog:', errorText);
          throw new Error(errorText);
        }
        
        const newDog = await response.json();
        
        // After successful creation, refresh data to ensure we have latest state
        refreshData();
        
        return newDog;
      } else {
        // Normal flow with existing profileId
        const newDog = await DogAPI.create(data);
        setDogs(prev => [...prev, newDog]);
        return newDog;
      }
    } catch (error) {
      console.error('Error creating dog:', error);
      throw error;
    }
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
  
  // Modify refreshData to ensure it updates all necessary data
  const refreshData = useCallback(async () => {
    // Add debounce - don't refresh if we've refreshed in the last 2 seconds
    const now = Date.now();
    if (lastRefreshTimeRef.current && now - lastRefreshTimeRef.current < 2000) {
      console.log('Skipping refresh - too soon since last refresh');
      return true;
    }
    
    lastRefreshTimeRef.current = now;
    
    try {
      if (!user || !user.id) {
        console.log('Skipping data refresh - user not available yet');
        return false;
      }
      
      setIsLoading(true);
      setError(null);
      
      const headers = {
        'Cache-Control': 'no-cache',
        'user-id': user.id,
        'user-role': user.role || '',
        'user-profile-id': user.profileId || ''
      };
      
      // Fetch dogs with proper role-based endpoint
      try {
        let dogsResponse;
        
        if (user.role === 'walker' && user.profileId) {
          dogsResponse = await fetch(`/api/walkers/${user.profileId}/dogs`, { 
            cache: 'no-store',
            headers 
          });
        } else {
          dogsResponse = await fetch('/api/data/dogs', { 
            cache: 'no-store',
            headers 
          });
        }

        if (dogsResponse.ok) {
          const dogsData = await dogsResponse.json();
          console.log('DataContext: Refreshed dogs data:', dogsData);
          setDogs(dogsData);
        } else {
          console.error('Failed to refresh dogs:', dogsResponse.status);
        }
      } catch (error) {
        console.error('Error refreshing dogs:', error);
      }

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
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return false;
    } finally {
      setIsLoading(false);
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
    updateOwner,
    updateWalker,
    updateAssessment,
    updateWalk,
    deleteDog,
    createDog
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