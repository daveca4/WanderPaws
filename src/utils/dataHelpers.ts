import { Dog, Owner, Walker, Walk, User, UserSubscription, SubscriptionPlan, Assessment, Message, Conversation, RevenueReport, SubscriptionActivity, SubscriptionPlanData, MarketingCampaign, AIInsight } from '@/lib/types';
import { parseISO } from 'date-fns';

// Dog related helpers
export const getDogById = (dogs: Dog[], id: string): Dog | undefined => {
  return dogs.find(dog => dog.id === id);
};

export const getDogsByOwnerId = (dogs: Dog[], ownerId: string): Dog[] => {
  return dogs.filter(dog => dog.ownerId === ownerId);
};

// Owner related helpers
export const getOwnerById = (owners: Owner[], id: string): Owner | undefined => {
  return owners.find(owner => owner.id === id);
};

export const getOwnerByDogId = (dogs: Dog[], owners: Owner[], dogId: string): Owner | undefined => {
  const dog = getDogById(dogs, dogId);
  if (!dog) return undefined;
  return getOwnerById(owners, dog.ownerId);
};

// Walker related helpers
export const getWalkerById = (walkers: Walker[], id: string): Walker | undefined => {
  return walkers.find(walker => walker.id === id);
};

export const getWalkersByAvailability = (walkers: Walker[], dayOfWeek: string, timeOfDay: string): Walker[] => {
  return walkers.filter(walker => {
    const day = dayOfWeek.toLowerCase();
    if (day in walker.availability) {
      const timeSlots = walker.availability[day as keyof typeof walker.availability];
      
      // For simplicity, we're checking if the walker has any availability on that day
      return timeSlots.length > 0;
    }
    return false;
  });
};

// Walk related helpers
export const getWalkById = (walks: Walk[], id: string): Walk | undefined => {
  return walks.find(walk => walk.id === id);
};

export const getWalksByDogId = (walks: Walk[], dogId: string): Walk[] => {
  return walks.filter(walk => walk.dogId === dogId);
};

export const getWalksByWalkerId = (walks: Walk[], walkerId: string): Walk[] => {
  return walks.filter(walk => walk.walkerId === walkerId);
};

export const getWalksByOwnerId = (walks: Walk[], dogs: Dog[], ownerId: string): Walk[] => {
  const ownerDogIds = dogs
    .filter(dog => dog.ownerId === ownerId)
    .map(dog => dog.id);
  
  return walks.filter(walk => ownerDogIds.includes(walk.dogId));
};

export const getUpcomingWalks = (walks: Walk[]): Walk[] => {
  const now = new Date();
  return walks
    .filter(walk => {
      const walkDate = parseISO(walk.date);
      return walkDate >= now && walk.status === 'scheduled';
    })
    .sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    });
};

export const getPastWalks = (walks: Walk[]): Walk[] => {
  const now = new Date();
  return walks
    .filter(walk => {
      const walkDate = parseISO(walk.date);
      return walkDate < now || walk.status === 'completed';
    })
    .sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
};

// Assessment related helpers
export const getAssessmentById = (assessments: Assessment[], id: string): Assessment | undefined => {
  return assessments.find(assessment => assessment.id === id);
};

export const getAssessmentsByWalkerId = (assessments: Assessment[], walkerId: string): Assessment[] => {
  return assessments.filter(assessment => assessment.assignedWalkerId === walkerId);
};

export const getAssessmentsByDogId = (assessments: Assessment[], dogId: string): Assessment[] => {
  return assessments.filter(assessment => assessment.dogId === dogId);
};

export const getAssessmentsByOwnerId = (assessments: Assessment[], ownerId: string): Assessment[] => {
  return assessments.filter(assessment => assessment.ownerId === ownerId);
};

// Subscription related helpers
export const getSubscriptionPlanById = (plans: SubscriptionPlan[], id: string): SubscriptionPlan | undefined => {
  return plans.find(plan => plan.id === id);
};

export const getActiveSubscriptionPlans = (plans: SubscriptionPlan[]): SubscriptionPlan[] => {
  return plans.filter(plan => plan.isActive);
};

export const getUserSubscriptions = (subscriptions: UserSubscription[], userId: string): UserSubscription[] => {
  return subscriptions.filter(sub => sub.userId === userId);
};

export const getUserActiveSubscription = (subscriptions: UserSubscription[], userId: string): UserSubscription | undefined => {
  const now = new Date();
  return subscriptions.find(sub => {
    const endDate = parseISO(sub.endDate);
    return sub.userId === userId && sub.status === 'active' && endDate >= now;
  });
};

// User related helpers
export const getUsersByRole = (users: User[], role: string): User[] => {
  return users.filter(user => user.role === role);
};

// Generate a unique ID for new records
export const generateId = (prefix: string = ''): string => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}${timestamp}${random}`;
};

// Generic fetch function to handle errors consistently
async function fetchData<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Create data through API
async function createData<T>(url: string, data: any): Promise<T> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Error creating data: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Create error:', error);
    throw error;
  }
}

// Dogs API functions
export const fetchDogs = (): Promise<Dog[]> => fetchData('/api/data/dogs');
export const fetchDogById = (id: string): Promise<Dog> => fetchData(`/api/data/dogs/${id}`);
export const createDog = (dog: Partial<Dog>): Promise<Dog> => createData('/api/data/dogs', dog);

// Owners API functions
export const fetchOwners = (): Promise<Owner[]> => fetchData('/api/data/owners');
export const fetchOwnerById = (id: string): Promise<Owner> => fetchData(`/api/data/owners/${id}`);
export const createOwner = (owner: Partial<Owner>): Promise<Owner> => createData('/api/data/owners', owner);

// Walkers API functions
export const fetchWalkers = (): Promise<Walker[]> => fetchData('/api/data/walkers');
export const fetchWalkerById = (id: string): Promise<Walker> => fetchData(`/api/data/walkers/${id}`);
export const createWalker = (walker: Partial<Walker>): Promise<Walker> => createData('/api/data/walkers', walker);

// Walks API functions
export const fetchWalks = (): Promise<Walk[]> => fetchData('/api/data/walks');
export const fetchWalkById = (id: string): Promise<Walk> => fetchData(`/api/data/walks/${id}`);
export const createWalk = (walk: Partial<Walk>): Promise<Walk> => createData('/api/data/walks', walk);

// Assessments API functions
export const fetchAssessments = (): Promise<Assessment[]> => fetchData('/api/data/assessments');
export const fetchAssessmentById = (id: string): Promise<Assessment> => fetchData(`/api/data/assessments/${id}`);
export const createAssessment = (assessment: Partial<Assessment>): Promise<Assessment> => createData('/api/data/assessments', assessment);

// Messages API functions
export const fetchMessages = (): Promise<Message[]> => fetchData('/api/data/messages');
export const fetchMessageById = (id: string): Promise<Message> => fetchData(`/api/data/messages/${id}`);
export const createMessage = (message: Partial<Message>): Promise<Message> => createData('/api/data/messages', message);

// Conversations API functions
export const fetchConversations = (): Promise<Conversation[]> => fetchData('/api/data/conversations');
export const fetchConversationById = (id: string): Promise<Conversation> => fetchData(`/api/data/conversations/${id}`);
export const createConversation = (conversation: Partial<Conversation>): Promise<Conversation> => createData('/api/data/conversations', conversation);

// Reports API functions
export interface ReportData {
  revenue: RevenueReport[];
  subscriptionActivity: SubscriptionActivity[];
  subscriptionPlan: SubscriptionPlanData[];
}

export const fetchReports = (reportType?: string): Promise<ReportData | RevenueReport[] | SubscriptionActivity[] | SubscriptionPlanData[]> => {
  const url = reportType ? `/api/data/reports?type=${reportType}` : '/api/data/reports';
  return fetchData(url);
};

// Marketing API functions
export const fetchMarketingCampaigns = (): Promise<MarketingCampaign[]> => fetchData('/api/data/marketing');
export const fetchMarketingCampaignById = (id: string): Promise<MarketingCampaign> => fetchData(`/api/data/marketing?id=${id}`);
export const createMarketingCampaign = (campaign: Partial<MarketingCampaign>): Promise<MarketingCampaign> => createData('/api/data/marketing', campaign);

// AI Insights API functions
export interface InsightFilters {
  category?: 'revenue' | 'customer_satisfaction' | 'operational_efficiency';
  status?: 'new' | 'acknowledged' | 'implemented' | 'dismissed';
}

export const fetchInsights = (filters?: InsightFilters): Promise<AIInsight[]> => {
  let url = '/api/data/insights';
  
  if (filters) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  }
  
  return fetchData(url);
};

export const fetchInsightById = (id: string): Promise<AIInsight> => fetchData(`/api/data/insights?id=${id}`);
export const updateInsightStatus = (id: string, status: 'new' | 'acknowledged' | 'implemented' | 'dismissed'): Promise<{ success: boolean; id: string; status: string }> => {
  return fetch('/api/data/insights', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, status }),
  }).then(res => {
    if (!res.ok) throw new Error(`Error updating insight: ${res.status}`);
    return res.json();
  });
}; 