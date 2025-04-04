import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import apiClient from '@/lib/api/client';
import { Assessment } from '@/lib/types';

// Query keys for assessment data
export const assessmentKeys = {
  all: ['assessments'] as const,
  lists: () => [...assessmentKeys.all, 'list'] as const,
  list: (filters: any) => [...assessmentKeys.lists(), { ...filters }] as const,
  details: () => [...assessmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...assessmentKeys.details(), id] as const,
  byOwner: (ownerId: string) => [...assessmentKeys.lists(), { owner: ownerId }] as const,
  byDog: (dogId: string) => [...assessmentKeys.lists(), { dog: dogId }] as const,
};

// Hook to fetch all assessments
export function useAssessments() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: assessmentKeys.lists(),
    queryFn: async () => {
      if (!user) return [];
      
      console.log('🔍 Fetching all assessments');
      const response = await apiClient.get('/data/assessments');
      
      if (!response.ok) {
        console.error('❌ Error fetching assessments:', response.error);
        return [];
      }
      
      console.log('✅ Fetched assessments:', response.data);
      return response.data || [];
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to fetch assessments for the current owner
export function useOwnerAssessments() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: assessmentKeys.byOwner(user?.profileId || ''),
    queryFn: async () => {
      if (!user || user.role !== 'owner' || !user.profileId) {
        console.error('Unauthorized: Only owners can access their assessments');
        return [];
      }
      
      console.log('🔍 Fetching assessments for owner:', user.profileId);
      
      try {
        // Try the owner-specific endpoint first
        try {
          const response = await apiClient.get(`/data/owners/${user.profileId}/assessments`);
          
          if (response.ok) {
            console.log('✅ Fetched owner assessments:', response.data);
            return response.data || [];
          }
        } catch (error) {
          console.warn('⚠️ Error with owner assessments endpoint:', error);
        }
        
        // Try the general assessments endpoint with owner filter
        try {
          const filterResponse = await apiClient.get(`/data/assessments?ownerId=${user.profileId}`);
          
          if (filterResponse.ok) {
            console.log('✅ Fetched assessments via filter:', filterResponse.data);
            return filterResponse.data || [];
          }
        } catch (filterError) {
          console.warn('⚠️ Error with filtered assessments:', filterError);
        }
        
        // Fall back to dogs as a last resort
        try {
          // Get owner's dogs
          const dogsResponse = await apiClient.get(`/data/owners/${user.profileId}/dogs`);
          
          if (dogsResponse.ok && Array.isArray(dogsResponse.data)) {
            const dogs = dogsResponse.data;
            console.log('✅ Found owner dogs for assessment lookup:', dogs.length);
            
            if (dogs.length === 0) return [];
            
            // Get assessments for each dog
            const allAssessments: Assessment[] = [];
            
            for (const dog of dogs) {
              try {
                const dogAssessResponse = await apiClient.get(`/data/dogs/${dog.id}/assessments`);
                
                if (dogAssessResponse.ok && Array.isArray(dogAssessResponse.data)) {
                  allAssessments.push(...dogAssessResponse.data);
                }
              } catch (dogError) {
                console.warn('⚠️ Error fetching assessments for dog:', dog.id, dogError);
              }
            }
            
            console.log('✅ Combined assessments from all dogs:', allAssessments.length);
            return allAssessments;
          }
        } catch (dogsError) {
          console.error('❌ Error with fallback assessment lookup:', dogsError);
        }
        
        return [];
      } catch (error) {
        console.error('❌ Error in useOwnerAssessments:', error);
        return [];
      }
    },
    enabled: !!user && user.role === 'owner' && !!user.profileId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to fetch a specific assessment
export function useAssessment(id?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: assessmentKeys.detail(id || ''),
    queryFn: async () => {
      if (!id || !user) return null;
      
      console.log('🔍 Fetching assessment details:', id);
      const response = await apiClient.get(`/data/assessments/${id}`);
      
      if (!response.ok) {
        console.error('❌ Error fetching assessment:', response.error);
        return null;
      }
      
      console.log('✅ Fetched assessment:', response.data);
      return response.data;
    },
    enabled: !!id && !!user,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to fetch assessments for a dog
export function useDogAssessments(dogId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: assessmentKeys.byDog(dogId || ''),
    queryFn: async () => {
      if (!dogId || !user) return [];
      
      console.log('🔍 Fetching assessments for dog:', dogId);
      const response = await apiClient.get(`/data/dogs/${dogId}/assessments`);
      
      if (!response.ok) {
        console.error('❌ Error fetching dog assessments:', response.error);
        return [];
      }
      
      console.log('✅ Fetched dog assessments:', response.data);
      return response.data || [];
    },
    enabled: !!dogId && !!user,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to create an assessment
export function useCreateAssessment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Omit<Assessment, 'id'>) => {
      console.log('🔍 Creating assessment:', data);
      const response = await apiClient.post('/data/assessments', data);
      
      if (!response.ok) {
        console.error('❌ Error creating assessment:', response.error);
        throw new Error(response.error || 'Failed to create assessment');
      }
      
      console.log('✅ Created assessment:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() });
      
      if (data.ownerId) {
        queryClient.invalidateQueries({ 
          queryKey: assessmentKeys.byOwner(data.ownerId)
        });
      }
      
      if (data.dogId) {
        queryClient.invalidateQueries({ 
          queryKey: assessmentKeys.byDog(data.dogId)
        });
      }
    },
  });
}

// Hook to update an assessment
export function useUpdateAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<Assessment> }) => {
      console.log('🔍 Updating assessment:', id, data);
      const response = await apiClient.patch(`/data/assessments/${id}`, data);
      
      if (!response.ok) {
        console.error('❌ Error updating assessment:', response.error);
        throw new Error(response.error || 'Failed to update assessment');
      }
      
      console.log('✅ Updated assessment:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() });
      
      if (data.ownerId) {
        queryClient.invalidateQueries({ 
          queryKey: assessmentKeys.byOwner(data.ownerId)
        });
      }
      
      if (data.dogId) {
        queryClient.invalidateQueries({ 
          queryKey: assessmentKeys.byDog(data.dogId)
        });
      }
    },
  });
} 