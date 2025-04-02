export interface Dog {
  id: string;
  name: string;
  breed: string;
  age: number;
  size: 'small' | 'medium' | 'large';
  temperament: string[];
  specialNeeds: string[];
  ownerId: string;
  imageUrl?: string;
  profileImage?: string; // Added for DogList component
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  assessmentStatus?: 'pending' | 'approved' | 'denied' | 'not_required' | 'scheduled' | 'in_progress' | 'pending_review'; // Updated dog assessment status
  weight?: number; // Dog's weight in kg for health assessment
  behavioralIssues?: string[]; // Any behavioral issues the dog has
  // Owner data when included from the API response
  owner?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: any;
    userId?: string;
  };
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  dogs: string[]; // Array of dog IDs
  userId: string; // Reference to user account
}

export interface Walker {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  rating: number;
  availability: {
    monday: TimeSlot[];
    tuesday: TimeSlot[];
    wednesday: TimeSlot[];
    thursday: TimeSlot[];
    friday: TimeSlot[];
    saturday: TimeSlot[];
    sunday: TimeSlot[];
  };
  specialties: string[];
  preferredDogSizes: ('small' | 'medium' | 'large')[];
  certificationsOrTraining: string[];
  imageUrl?: string;
  userId: string; // Reference to user account
  canHandleLargeDogs?: boolean; // Added for AI recommendations
  canHandleBehavioralIssues?: boolean; // Added for AI recommendations
}

export interface TimeSlot {
  start: string; // In 24-hour format, e.g., "09:00"
  end: string; // In 24-hour format, e.g., "17:00"
}

export interface Walk {
  id: string;
  date: string;
  timeSlot: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'pending' | 'confirmed';
  // Timing properties
  startTime: string;
  duration: number;
  // Optional relationship fields
  dogId: string;
  walkerId: string;
  ownerId?: string;
  // Optional display names
  dogName?: string;
  walkerName?: string;
  // Optional nested objects
  dog?: {
    id: string;
    name: string;
    breed?: string;
    profileImage?: string;
  };
  walker?: {
    id: string;
    name: string;
    profileImage?: string;
  };
  // Route information
  route?: {
    id: string;
    name: string;
    distance: number;
    coordinates: [number, number][];
  };
  // Notes for the walk
  notes?: string;
  // Feedback properties
  feedback?: {
    rating?: number;
    comment?: string;
    createdAt?: string;
    timestamp?: string;
  };
  // Metrics for completed walks
  metrics?: {
    distance?: number;
    duration?: number;
    steps?: number;
    // Enhanced metrics
    distanceCovered?: number;
    totalTime?: number;
    poopCount?: number;
    peeCount?: number;
    moodRating?: number;
    behaviorsObserved?: string[];
  };
}

export interface AIRecommendationData {
  // Walker recommendation data
  walker?: {
    id: string;
    name: string;
    compatibility: number;
    reasons: string[];
  };
  
  // Route recommendation data
  route?: {
    id: string;
    name: string;
    distance: number;
    estimatedTime: number;
    coordinates: [number, number][];
    highlights: string[];
  };
  
  // Schedule recommendation data
  schedule?: {
    suggestedTimes: {
      day: string;
      slots: string[];
    }[];
    reasons: string[];
  };
}

export interface AIRecommendation {
  type: 'walker' | 'route' | 'schedule';
  reason: string;
  confidence: number; // 0-1 scale
  data: AIRecommendationData;
}

// Define specific data types for each recommendation type
export interface AIRecommendationData {
  // Common fields that might be in all recommendations
  id?: string;
  name?: string;
  
  // Walker recommendation specific fields
  walkerId?: string;
  walkerName?: string;
  walkerRating?: number;
  walkCount?: number;
  
  // Route recommendation specific fields
  routeName?: string;
  distance?: number;
  estimatedDuration?: number;
  coordinates?: [number, number][];
  
  // Schedule recommendation specific fields
  suggestedDate?: string;
  suggestedTime?: string;
  timeSlot?: 'morning' | 'afternoon';
  availability?: boolean;
}

// Role-based access control types
export type Role = 'admin' | 'walker' | 'owner';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'owner' | 'walker' | 'admin';
  profileId?: string;
  createdAt?: string;
  profileImage?: string;
  emailVerified?: boolean;
  image?: string;
}

export interface Permission {
  action: string;  // e.g., 'create', 'read', 'update', 'delete'
  resource: string; // e.g., 'dogs', 'walks', 'walkers', 'owners'
}

export interface RolePermissions {
  [role: string]: Permission[];
}

// Subscription System Types

export interface SubscriptionPlan {
  id: string;
  name: string;           // e.g., "Basic", "Premium", "Ultimate"
  description: string;
  walkCredits: number;    // Number of walks included
  walkDuration: number;   // Duration of each walk in minutes
  price: number;          // Price in GBP (pence)
  validityPeriod: number; // Validity period in days
  isActive: boolean;      // Whether the plan is currently offered
  createdAt: string;      // ISO date string
  updatedAt: string;      // ISO date string
  discountPercentage?: number; // Optional discount percentage
}

export interface UserSubscription {
  id: string;
  userId: string;         // User who owns this subscription
  planId: string;         // Reference to subscription plan
  planName: string;       // Name of the subscription plan
  walkCredits?: number;    // Total walk credits for this subscription - make optional to match SubscriptionPlan
  walkDuration?: number;   // Duration of each walk in minutes - make optional to match SubscriptionPlan
  creditsRemaining: number; // Number of walk credits remaining
  startDate: string;      // ISO date string
  endDate: string;        // ISO date string
  status: 'active' | 'expired' | 'cancelled';
  purchaseAmount: number; // Amount paid in GBP (pence)
  purchaseDate: string;   // ISO date string
  createdAt: string;      // ISO date string
  updatedAt: string;      // ISO date string
}

export interface SubscriptionTransaction {
  id: string;
  userSubscriptionId: string;
  amount: number;         // Amount in GBP (pence)
  type: 'purchase' | 'refund' | 'credit_adjustment';
  status: 'successful' | 'pending' | 'failed';
  date: string;           // ISO date string
  paymentMethod?: string;
  notes?: string;
}

// Dog Assessment System Types

export type AssessmentStatus = 
  | 'pending' 
  | 'scheduled' 
  | 'assigned'
  | 'in_progress'
  | 'completed' 
  | 'feedback_submitted'
  | 'ready_for_review'
  | 'approved' 
  | 'denied'
  | 'cancelled';

export interface Assessment {
  id: string;
  // References
  walkerId: string;
  dogId: string; 
  ownerId: string;
  assignedWalkerId?: string;
  // Properties
  dogTypes: string[];
  experience: number;
  notes?: string;
  adminNotes?: string;
  // Dates
  createdAt: string;
  scheduledDate?: string;
  createdDate?: string; // For backward compatibility, use createdAt instead
  // Status and results
  status: 'pending' | 'approved' | 'denied' | 'scheduled' | 'completed' | 'feedback_submitted' | 'ready_for_review';
  result?: 'approved' | 'denied';
  // Feedback details
  feedback?: {
    id: string;
    strengths: string[];
    concerns: string[];
    recommendations?: string;
    submittedDate?: string;
  };
  // Relationships
  walker?: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

export interface AssessmentFeedback {
  id: string;
  assessmentId: string;
  walkerId: string;
  submittedDate: string; // ISO date string
  behaviorRatings: {
    socialization: 1 | 2 | 3 | 4 | 5; // Rating from 1-5
    leashManners: 1 | 2 | 3 | 4 | 5;
    aggression: 1 | 2 | 3 | 4 | 5;
    obedience: 1 | 2 | 3 | 4 | 5;
    energyLevel: 1 | 2 | 3 | 4 | 5;
  };
  concerns: string[]; // Array of specific concerns
  strengths: string[]; // Array of dog's strengths
  recommendations: string; // Detailed recommendations
  suitableForGroupWalks: boolean;
  walkerNotes: string; // Additional notes from walker
  photosOrVideos?: string[]; // URLs to any photos or videos taken
  recommendedWalkerExperience: 'beginner' | 'intermediate' | 'expert';
}

// Messaging System Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string; // ISO date string
  readStatus: 'read' | 'unread';
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  url: string;
  type: 'image' | 'document' | 'audio';
  name: string;
  size: number; // in bytes
}

export interface Conversation {
  id: string;
  participants: string[]; // Array of user IDs
  title?: string; // Optional title for group conversations
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  lastMessageId?: string; // ID of the last message
  unreadCount?: {[userId: string]: number}; // Count of unread messages per user
  type: 'direct' | 'group';
}

// User authentication context
export interface AuthContext {
  user: User | null;
  loading: boolean;
  error?: string;
}

// Reports System Types
export interface RevenueReport {
  month: string;
  subscriptions: number;
  oneTimeBookings: number;
  refunds: number;
  total: number;
}

export interface SubscriptionActivity {
  month: string;
  newSubscriptions: number;
  renewals: number;
  cancellations: number;
  revenue: number;
}

export interface SubscriptionPlanData {
  name: string;
  value: number;
  subscribers: number;
}

// Marketing System Types
export interface MarketingCampaign {
  id: string;
  name: string;
  type: 'email' | 'in-app' | 'sms';
  status: 'active' | 'completed' | 'draft' | 'scheduled';
  audience: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  conversionRate: number;
  revenue: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  creator: string;
  description: string;
}

// AI Insights System Types
export interface AIInsight {
  id: string;
  type: 'walker_recommendation' | 'route_optimization' | 'customer_behavior' | 'scheduling';
  title: string;
  description: string;
  confidenceScore: number;
  impact: 'high' | 'medium' | 'low';
  status: 'new' | 'acknowledged' | 'implemented' | 'dismissed';
  createdAt: string;
  category: 'revenue' | 'customer_satisfaction' | 'operational_efficiency';
  relatedEntities?: {
    type: string;
    id: string;
    name: string;
  }[];
  recommendations?: string[];
}

// Add HolidayRequest type
export interface HolidayRequest {
  id: string;
  walkerId: string;
  date: string;
  status: 'pending' | 'approved' | 'denied';
  reason: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Location {
  id: string;
  walkId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

// Add DogWalkStatus interface used in group walks
export interface DogWalkStatus {
  id: string;
  dogId: string;
  walkerId: string;
  date: string;
  startTime: string;
  timeSlot: 'AM' | 'PM';
  duration: number;
  dog: Dog;
  walkStatus: 'pending' | 'picked_up' | 'dropped_off' | 'absent';
  notes?: string;
} 