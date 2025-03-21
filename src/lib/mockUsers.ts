import { User, RolePermissions } from './types';
import { mockOwners, mockWalkers } from './mockData';

// Define role-based permissions
export const permissions: RolePermissions = {
  admin: [
    // Full access to everything
    { action: 'create', resource: 'dogs' },
    { action: 'read', resource: 'dogs' },
    { action: 'update', resource: 'dogs' },
    { action: 'delete', resource: 'dogs' },
    
    { action: 'create', resource: 'owners' },
    { action: 'read', resource: 'owners' },
    { action: 'update', resource: 'owners' },
    { action: 'delete', resource: 'owners' },
    
    { action: 'create', resource: 'walkers' },
    { action: 'read', resource: 'walkers' },
    { action: 'update', resource: 'walkers' },
    { action: 'delete', resource: 'walkers' },
    
    { action: 'create', resource: 'walks' },
    { action: 'read', resource: 'walks' },
    { action: 'update', resource: 'walks' },
    { action: 'delete', resource: 'walks' },
    
    { action: 'create', resource: 'users' },
    { action: 'read', resource: 'users' },
    { action: 'update', resource: 'users' },
    { action: 'delete', resource: 'users' },
    
    // Subscription management permissions for admin
    { action: 'create', resource: 'subscription_plans' },
    { action: 'read', resource: 'subscription_plans' },
    { action: 'update', resource: 'subscription_plans' },
    { action: 'delete', resource: 'subscription_plans' },
    
    { action: 'create', resource: 'user_subscriptions' },
    { action: 'read', resource: 'user_subscriptions' },
    { action: 'update', resource: 'user_subscriptions' },
    { action: 'delete', resource: 'user_subscriptions' },
    
    { action: 'read', resource: 'subscription_transactions' },
    
    { action: 'access', resource: 'analytics' },
    { action: 'access', resource: 'admin-dashboard' },
    { action: 'access', resource: 'subscription-dashboard' },

    // Messaging permissions
    { action: 'access', resource: 'messages' },
    { action: 'create', resource: 'messages' },
    { action: 'read', resource: 'messages' },
    { action: 'update', resource: 'messages' },
    { action: 'delete', resource: 'messages' },
  ],
  
  owner: [
    // Owners can manage their own dogs
    { action: 'create', resource: 'dogs' }, // Add pets
    { action: 'read', resource: 'dogs' }, // View their own dogs
    { action: 'update', resource: 'dogs' }, // Update their own dogs
    { action: 'delete', resource: 'dogs' }, // Remove their own dogs
    
    // Owners can view and update their own profile
    { action: 'read', resource: 'owners' }, // View their own profile
    { action: 'update', resource: 'owners' }, // Update their own profile
    
    // Owners can create and manage walks for their dogs
    { action: 'create', resource: 'walks' }, // Create bookings
    { action: 'read', resource: 'walks' }, // View bookings
    { action: 'update', resource: 'walks' }, // Update bookings
    { action: 'delete', resource: 'walks' }, // Cancel bookings
    
    // Subscription permissions for owners
    { action: 'read', resource: 'subscription_plans' }, // View available plans
    { action: 'read', resource: 'user_subscriptions' }, // View their subscriptions
    { action: 'create', resource: 'user_subscriptions' }, // Purchase subscriptions
    
    // Access to owner dashboard features
    { action: 'access', resource: 'owner-dashboard' },

    // Messaging permissions
    { action: 'access', resource: 'messages' },
    { action: 'create', resource: 'messages' },
    { action: 'read', resource: 'messages' },
    { action: 'update', resource: 'messages' },
  ],
  
  walker: [
    // Walkers can manage their profile and assigned walks
    { action: 'read', resource: 'dogs' }, // Dogs they are walking
    
    { action: 'read', resource: 'owners' }, // Owners of dogs they walk
    
    { action: 'read', resource: 'walkers' }, // Their own profile
    { action: 'update', resource: 'walkers' }, // Their own profile
    
    { action: 'read', resource: 'walks' }, // Their assigned walks
    { action: 'update', resource: 'walks' }, // Their assigned walks (to update status, add metrics)
    
    { action: 'access', resource: 'walker-dashboard' },

    // Messaging permissions
    { action: 'access', resource: 'messages' },
    { action: 'create', resource: 'messages' },
    { action: 'read', resource: 'messages' },
    { action: 'update', resource: 'messages' },
  ],
};

// Mock user data
export const mockUsers: User[] = [
  {
    id: 'user1',
    email: 'admin@wanderpaws.com',
    passwordHash: 'hashed_password_1', // In a real app, this would be properly hashed
    role: 'admin',
    emailVerified: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    lastLogin: '2023-06-01T08:30:00Z',
  },
  {
    id: 'user2',
    email: 'john.smith@example.com',
    passwordHash: 'hashed_password_2',
    role: 'owner',
    emailVerified: true,
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-01-15T00:00:00Z',
    lastLogin: '2023-06-05T14:20:00Z',
    profileId: 'o1', // John Smith from mockOwners
  },
  {
    id: 'user3',
    email: 'sarah.johnson@example.com',
    passwordHash: 'hashed_password_3',
    role: 'owner',
    emailVerified: true,
    createdAt: '2023-02-01T00:00:00Z',
    updatedAt: '2023-02-01T00:00:00Z',
    lastLogin: '2023-06-04T10:15:00Z',
    profileId: 'o2', // Sarah Johnson from mockOwners
  },
  {
    id: 'user4',
    email: 'michael.brown@example.com',
    passwordHash: 'hashed_password_4',
    role: 'owner',
    emailVerified: true,
    createdAt: '2023-02-10T00:00:00Z',
    updatedAt: '2023-02-10T00:00:00Z',
    lastLogin: '2023-06-06T16:45:00Z',
    profileId: 'o3', // Michael Brown from mockOwners
  },
  {
    id: 'user5',
    email: 'emily.davis@example.com',
    passwordHash: 'hashed_password_5',
    role: 'walker',
    emailVerified: true,
    createdAt: '2023-01-20T00:00:00Z',
    updatedAt: '2023-01-20T00:00:00Z',
    lastLogin: '2023-06-06T07:30:00Z',
    profileId: 'w1', // Emily Davis from mockWalkers
  },
  {
    id: 'user6',
    email: 'alex.martinez@example.com',
    passwordHash: 'hashed_password_6',
    role: 'walker',
    emailVerified: true,
    createdAt: '2023-02-05T00:00:00Z',
    updatedAt: '2023-02-05T00:00:00Z',
    lastLogin: '2023-06-05T06:45:00Z',
    profileId: 'w2', // Alex Martinez from mockWalkers
  },
  {
    id: 'user7',
    email: 'taylor.wilson@example.com',
    passwordHash: 'hashed_password_7',
    role: 'walker',
    emailVerified: true,
    createdAt: '2023-02-15T00:00:00Z',
    updatedAt: '2023-02-15T00:00:00Z',
    lastLogin: '2023-06-06T12:10:00Z',
    profileId: 'w3', // Taylor Wilson from mockWalkers
  },
];

// Connect our mock owners/walkers to their user accounts
export const connectOwnersToUsers = () => {
  mockOwners.forEach(owner => {
    const user = mockUsers.find(user => user.profileId === owner.id);
    if (user) {
      // In a real app, we would actually modify the database
      // Here we're just conceptually establishing the link
      // owner.userId = user.id is handled during initialization
    }
  });
};

export const connectWalkersToUsers = () => {
  mockWalkers.forEach(walker => {
    const user = mockUsers.find(user => user.profileId === walker.id);
    if (user) {
      // In a real app, we would actually modify the database
      // walker.userId = user.id is handled during initialization
    }
  });
}; 