import { Dog, Owner, Walker, Walk } from './types';

export const mockDogs: Dog[] = [
  {
    id: 'd1',
    name: 'Buddy',
    breed: 'Golden Retriever',
    age: 3,
    size: 'large',
    temperament: ['friendly', 'energetic', 'social'],
    specialNeeds: [],
    ownerId: 'o1',
    imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=500',
    walkingPreferences: {
      frequency: 5,
      duration: 45,
      preferredTimes: ['morning', 'evening'],
    },
  },
  {
    id: 'd2',
    name: 'Max',
    breed: 'German Shepherd',
    age: 5,
    size: 'large',
    temperament: ['protective', 'intelligent', 'loyal'],
    specialNeeds: ['hip issues - avoid stairs'],
    ownerId: 'o2',
    imageUrl: 'https://images.unsplash.com/photo-1589941013453-ec89f98c5116?q=80&w=500',
    walkingPreferences: {
      frequency: 3,
      duration: 30,
      preferredTimes: ['afternoon'],
    },
  },
  {
    id: 'd3',
    name: 'Daisy',
    breed: 'Beagle',
    age: 2,
    size: 'medium',
    temperament: ['curious', 'friendly', 'playful'],
    specialNeeds: [],
    ownerId: 'o1',
    imageUrl: 'https://images.unsplash.com/photo-1593134257782-e89567b7718a?q=80&w=500',
    walkingPreferences: {
      frequency: 7,
      duration: 60,
      preferredTimes: ['morning', 'afternoon', 'evening'],
    },
  },
  {
    id: 'd4',
    name: 'Luna',
    breed: 'Poodle',
    age: 4,
    size: 'small',
    temperament: ['intelligent', 'active', 'alert'],
    specialNeeds: ['anxiety - needs quiet areas'],
    ownerId: 'o3',
    imageUrl: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?q=80&w=500',
    walkingPreferences: {
      frequency: 4,
      duration: 20,
      preferredTimes: ['morning'],
    },
  },
];

export const mockOwners: Owner[] = [
  {
    id: 'o1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '(555) 123-4567',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
    },
    dogs: ['d1', 'd3'],
    userId: 'user_o1',
  },
  {
    id: 'o2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '(555) 987-6543',
    address: {
      street: '456 Oak Ave',
      city: 'Somecity',
      state: 'NY',
      zip: '67890',
    },
    dogs: ['d2'],
    userId: 'user_o2',
  },
  {
    id: 'o3',
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    phone: '(555) 456-7890',
    address: {
      street: '789 Pine Rd',
      city: 'Otherville',
      state: 'TX',
      zip: '54321',
    },
    dogs: ['d4'],
    userId: 'user_o3',
  },
];

export const mockWalkers: Walker[] = [
  {
    id: 'w1',
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    phone: '(555) 111-2222',
    bio: 'Dog lover with 5 years of professional experience. Certified in pet first aid.',
    rating: 4.9,
    availability: {
      monday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
      tuesday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
      wednesday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
      thursday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
      friday: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }],
      saturday: [{ start: '10:00', end: '15:00' }],
      sunday: [],
    },
    specialties: ['anxious dogs', 'puppy training', 'senior dogs'],
    preferredDogSizes: ['small', 'medium', 'large'],
    certificationsOrTraining: ['Pet First Aid', 'Canine Good Citizen Evaluator'],
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500',
    userId: 'user_w1',
  },
  {
    id: 'w2',
    name: 'Alex Martinez',
    email: 'alex.martinez@example.com',
    phone: '(555) 333-4444',
    bio: 'Former vet tech with a passion for helping dogs stay active and healthy.',
    rating: 4.7,
    availability: {
      monday: [{ start: '07:00', end: '12:00' }],
      tuesday: [{ start: '07:00', end: '12:00' }],
      wednesday: [{ start: '07:00', end: '12:00' }],
      thursday: [{ start: '07:00', end: '12:00' }],
      friday: [{ start: '07:00', end: '12:00' }],
      saturday: [],
      sunday: [],
    },
    specialties: ['medical needs', 'high energy dogs'],
    preferredDogSizes: ['medium', 'large'],
    certificationsOrTraining: ['Veterinary Technician', 'Dog Behavior Specialist'],
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=500',
    userId: 'user_w2',
  },
  {
    id: 'w3',
    name: 'Taylor Wilson',
    email: 'taylor.wilson@example.com',
    phone: '(555) 555-6666',
    bio: 'Experienced with all dog breeds and sizes. Specializes in positive reinforcement techniques.',
    rating: 4.8,
    availability: {
      monday: [{ start: '12:00', end: '20:00' }],
      tuesday: [{ start: '12:00', end: '20:00' }],
      wednesday: [{ start: '12:00', end: '20:00' }],
      thursday: [{ start: '12:00', end: '20:00' }],
      friday: [{ start: '12:00', end: '20:00' }],
      saturday: [{ start: '12:00', end: '18:00' }],
      sunday: [{ start: '12:00', end: '18:00' }],
    },
    specialties: ['training during walks', 'reactive dogs'],
    preferredDogSizes: ['small', 'medium'],
    certificationsOrTraining: ['Professional Dog Trainer Certification', 'Reactive Dog Handler'],
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=500',
    userId: 'user_w3',
  },
];

export const mockWalks: Walk[] = [
  {
    id: 'walk1',
    dogId: 'd1',
    walkerId: 'w1',
    date: '2024-06-15',
    startTime: '10:00',
    timeSlot: 'AM',
    duration: 45,
    status: 'completed',
    notes: 'Buddy was very energetic today',
    feedback: {
      rating: 5,
      comment: 'Emily was amazing with Buddy!',
      timestamp: '2024-06-15T11:00:00Z',
    },
    metrics: {
      distanceCovered: 2.5,
      totalTime: 48,
      poopCount: 1,
      peeCount: 3,
      moodRating: 5,
      behaviorsObserved: ['playful', 'friendly with other dogs'],
    },
  },
  {
    id: 'walk2',
    dogId: 'd2',
    walkerId: 'w2',
    date: '2024-06-16',
    startTime: '08:00',
    timeSlot: 'AM',
    duration: 30,
    status: 'completed',
    notes: 'Max did well avoiding stairs',
    feedback: {
      rating: 4,
      comment: 'Alex was attentive to Max\'s needs',
      timestamp: '2024-06-16T09:00:00Z',
    },
    metrics: {
      distanceCovered: 1.8,
      totalTime: 32,
      poopCount: 1,
      peeCount: 2,
      moodRating: 4,
      behaviorsObserved: ['alert', 'cautious around other dogs'],
    },
  },
  {
    id: 'walk3',
    dogId: 'd3',
    walkerId: 'w3',
    date: '2024-06-17',
    startTime: '14:00',
    timeSlot: 'PM',
    duration: 60,
    status: 'completed',
    notes: 'Daisy enjoyed the park',
    feedback: {
      rating: 5,
      comment: 'Taylor is the best! Daisy loves her walks.',
      timestamp: '2024-06-17T15:30:00Z',
    },
    metrics: {
      distanceCovered: 3.2,
      totalTime: 65,
      poopCount: 2,
      peeCount: 4,
      moodRating: 5,
      behaviorsObserved: ['curious', 'sniffed everything'],
    },
  },
  {
    id: 'walk4',
    dogId: 'd4',
    walkerId: 'w1',
    date: '2024-06-18',
    startTime: '09:30',
    timeSlot: 'AM',
    duration: 20,
    status: 'completed',
    notes: 'Luna stayed calm in quiet areas',
    feedback: {
      rating: 5,
      comment: 'Emily understood Luna\'s anxiety well',
      timestamp: '2024-06-18T10:00:00Z',
    },
    metrics: {
      distanceCovered: 0.8,
      totalTime: 22,
      poopCount: 1,
      peeCount: 2,
      moodRating: 3,
      behaviorsObserved: ['skittish', 'relaxed in quiet areas'],
    },
  },
  {
    id: 'walk5',
    dogId: 'd1',
    walkerId: 'w1',
    date: '2024-06-20',
    startTime: '10:00',
    timeSlot: 'AM',
    duration: 45,
    status: 'scheduled',
  },
  {
    id: 'walk6',
    dogId: 'd2',
    walkerId: 'w2',
    date: '2024-06-21',
    startTime: '08:00',
    timeSlot: 'AM',
    duration: 30,
    status: 'scheduled',
  },
  {
    id: 'walk4',
    dogId: 'd4',
    walkerId: 'w3',
    date: '2024-06-20',
    startTime: '15:00',
    timeSlot: 'PM',
    duration: 20,
    status: 'scheduled',
  },
  {
    id: 'walk5',
    dogId: 'd1',
    walkerId: 'w1',
    date: '2024-06-22',
    startTime: '10:30',
    timeSlot: 'AM',
    duration: 45,
    status: 'scheduled',
  },
]; 