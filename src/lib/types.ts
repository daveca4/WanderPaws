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
  walkingPreferences: {
    frequency: number; // walks per week
    duration: number; // minutes per walk
    preferredTimes: string[]; // e.g., "morning", "afternoon", "evening"
    preferredRoutes?: string[];
  };
  assessmentStatus?: 'pending' | 'approved' | 'denied' | 'not_required'; // Dog assessment status
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
}

export interface TimeSlot {
  start: string; // In 24-hour format, e.g., "09:00"
  end: string; // In 24-hour format, e.g., "17:00"
}

export interface Walk {
  id: string;
  dogId: string;
  walkerId: string;
  date: string; // ISO date string
  startTime: string; // In 24-hour format, e.g., "14:30"
  timeSlot: 'AM' | 'PM'; // Morning or afternoon time slot
  duration: number; // In minutes
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  route?: {
    name: string;
    coordinates: [number, number][]; // Array of [longitude, latitude] coordinates
  };
  feedback?: {
    rating: number;
    comment: string;
    timestamp: string; // ISO date string
  };
  metrics?: {
    distanceCovered: number; // In kilometers
    totalTime: number; // In minutes (may differ from scheduled duration)
    poopCount: number;
    peeCount: number;
    moodRating: 1 | 2 | 3 | 4 | 5;
    behaviorsObserved: string[];
  };
  // Track if this walk is part of a subscription
  subscriptionId?: string;
}

export interface AIRecommendation {
  type: 'walker' | 'route' | 'schedule';
  reason: string;
  confidence: number; // 0-1 scale
  data: any;
}

// Role-based access control types
export type Role = 'admin' | 'walker' | 'owner';

export interface User {
  id: string;
  email: string;
  passwordHash: string; // In a real app, we would never expose this
  role: Role;
  emailVerified: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  lastLogin?: string; // ISO date string
  profileId?: string; // ID of the related profile (owner or walker)
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
  ownerId: string;        // Owner profile ID
  planId: string;         // Reference to subscription plan
  startDate: string;      // ISO date string
  endDate: string;        // ISO date string
  creditsRemaining: number; // Number of walk credits remaining
  status: 'active' | 'expired' | 'cancelled';
  purchaseAmount: number; // Amount paid in GBP (pence)
  purchaseDate: string;   // ISO date string
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

export interface Assessment {
  id: string;
  dogId: string;
  ownerId: string;
  createdDate: string; // ISO date string
  scheduledDate: string; // ISO date string
  assignedWalkerId?: string; // Walker assigned to conduct the assessment
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  result?: 'approved' | 'denied';
  adminNotes?: string; // Notes from admin for the walker
  resultNotes?: string; // Final notes from admin regarding assessment result
  feedback?: AssessmentFeedback;
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