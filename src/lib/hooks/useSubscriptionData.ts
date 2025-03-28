import { useState, useEffect } from 'react';
import { SubscriptionPlan, UserSubscription } from '@/lib/types';

export function useSubscriptionData() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching subscription plans');
        
        // API fetch with retry logic
        let attempts = 0;
        let success = false;
        let plansData: SubscriptionPlan[] = [];
        
        while (attempts < 3 && !success) {
          try {
            const response = await fetch('/api/subscriptions/plans');
            if (response.ok) {
              const data = await response.json();
              if (data.plans && Array.isArray(data.plans)) {
                console.log('Subscription plans loaded:', data.plans);
                plansData = data.plans;
                success = true;
              } else {
                console.warn('Unexpected structure for plans data:', data);
                // Try the API response directly if the expected structure wasn't found
                if (Array.isArray(data)) {
                  plansData = data;
                  success = true;
                }
              }
            } else {
              console.warn(`API response (attempt ${attempts + 1}):`, response.status, await response.text());
              // Try the data API as a fallback
              if (attempts === 1) {
                const dataResponse = await fetch('/api/data/subscription-plans');
                if (dataResponse.ok) {
                  plansData = await dataResponse.json();
                  if (Array.isArray(plansData)) {
                    success = true;
                  }
                }
              }
            }
          } catch (fetchError) {
            console.error(`Fetch attempt ${attempts + 1} failed:`, fetchError);
          }
          
          attempts++;
          if (!success && attempts < 3) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        if (success && plansData.length > 0) {
          setPlans(plansData);
        } else {
          setError('Failed to load subscription plans. Please try again later.');
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
        setError('Failed to load subscription plans. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return { plans, isLoading, error };
}

// React hook for user's subscriptions
export function useUserSubscriptions(userId?: string) {
  const [data, setData] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function loadData() {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Fetch user subscriptions from multiple sources with fallbacks
        console.log('Fetching user subscriptions for', userId);
        
        // Try primary endpoint
        const response = await fetch(`/api/subscriptions/users?userId=${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.subscriptions && Array.isArray(data.subscriptions)) {
            setData(data.subscriptions);
          } else if (Array.isArray(data)) {
            setData(data);
          }
        } else {
          // Try data API as fallback
          const fallbackResponse = await fetch(`/api/data/subscriptions?userId=${userId}`);
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (Array.isArray(fallbackData)) {
              setData(fallbackData);
            }
          }
        }
        
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('Error in useUserSubscriptions:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [userId]);
  
  return { data, isLoading, error };
}

// Find active subscription from a list
export function findActiveSubscription(subscriptions: UserSubscription[] = []): UserSubscription | undefined {
  const now = new Date();
  return subscriptions.find(sub => 
    sub.status === 'active' && new Date(sub.endDate) > now
  );
} 