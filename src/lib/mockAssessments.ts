import { generateId } from '@/utils/helpers';
import { Assessment, AssessmentFeedback } from './types';
import { mockDogs, mockOwners, mockWalkers } from './mockData';

// Create mock assessments
export const mockAssessments: Assessment[] = [
  {
    id: 'assess1',
    dogId: 'dog1',
    ownerId: 'o1',
    assignedWalkerId: 'w1',
    createdDate: '2025-04-01T00:00:00Z',
    scheduledDate: '2025-04-12T10:00:00Z',
    status: 'completed',
    result: 'approved',
    adminNotes: 'Dog is friendly and well-behaved',
    resultNotes: 'Excellent dog, very well-behaved and responds well to commands.',
    feedback: {
      id: 'feedback1',
      assessmentId: 'assess1',
      walkerId: 'w1',
      submittedDate: '2025-04-12T11:00:00Z',
      behaviorRatings: {
        socialization: 5,
        leashManners: 4,
        aggression: 1,
        obedience: 4,
        energyLevel: 3
      },
      concerns: [],
      strengths: ['Friendly with other dogs', 'Follows commands well'],
      recommendations: 'Great dog for group walks',
      suitableForGroupWalks: true,
      walkerNotes: 'Excellent temperament and behavior',
      recommendedWalkerExperience: 'beginner'
    }
  },
  {
    id: 'assess2',
    dogId: 'dog2',
    ownerId: 'o2',
    createdDate: '2025-04-05T00:00:00Z',
    scheduledDate: '2025-04-15T14:00:00Z',
    status: 'pending',
    adminNotes: 'Scheduling in progress'
  },
  {
    id: 'assess3',
    dogId: 'dog3',
    ownerId: 'o3',
    assignedWalkerId: 'w2',
    createdDate: '2025-04-08T00:00:00Z',
    scheduledDate: '2025-04-18T11:00:00Z',
    status: 'scheduled',
    adminNotes: 'Will assess at owner\'s home'
  }
];

// Get assessments by owner ID
export function getAssessmentsByOwnerId(ownerId: string): Assessment[] {
  return mockAssessments.filter(assessment => assessment.ownerId === ownerId);
}

// Get assessments by dog ID
export function getAssessmentsByDogId(dogId: string): Assessment[] {
  return mockAssessments.filter(assessment => assessment.dogId === dogId);
}

// Get assessments by walker ID
export function getAssessmentsByWalkerId(walkerId: string): Assessment[] {
  return mockAssessments.filter(assessment => assessment.assignedWalkerId === walkerId);
}

// Get assessment by ID
export function getAssessmentById(assessmentId: string): Assessment | undefined {
  return mockAssessments.find(assessment => assessment.id === assessmentId);
}

// Create a new assessment
export function createAssessment(dogId: string, ownerId: string): Assessment {
  const now = new Date().toISOString();
  const assessment: Assessment = {
    id: generateId('assess'),
    dogId,
    ownerId,
    createdDate: now,
    scheduledDate: now,
    status: 'pending'
  };
  
  // In a real app, this would save to a database
  // For demo, we simulate adding to the mock data
  // mockAssessments.push(assessment);
  
  return assessment;
}

// Update an assessment
export function updateAssessment(assessmentId: string, updates: Partial<Assessment>): Assessment | undefined {
  const assessment = getAssessmentById(assessmentId);
  if (!assessment) return undefined;
  
  // In a real app, this would update the database
  // For demo, just return the updated assessment
  return {
    ...assessment,
    ...updates
  };
}

// Helper functions

// Get pending assessments (for admin dashboard)
export function getPendingAssessments(): Assessment[] {
  return mockAssessments.filter(assessment => assessment.status === 'pending');
}

// Get scheduled assessments (for walker dashboard)
export function getScheduledAssessments(): Assessment[] {
  return mockAssessments.filter(assessment => assessment.status === 'scheduled');
}

// Get completed assessments (for reporting)
export function getCompletedAssessments(): Assessment[] {
  return mockAssessments.filter(assessment => assessment.status === 'completed');
}

// Submit feedback for an assessment (simulating API call)
export function submitAssessmentFeedback(assessmentId: string, feedback: Omit<AssessmentFeedback, 'id' | 'assessmentId' | 'submittedDate'>): AssessmentFeedback {
  const newFeedback: AssessmentFeedback = {
    id: generateId('feedback'),
    assessmentId,
    submittedDate: new Date().toISOString(),
    ...feedback
  };
  
  // In a real app this would save to the database and update the assessment
  // For now, we'll just return the feedback
  return newFeedback;
} 