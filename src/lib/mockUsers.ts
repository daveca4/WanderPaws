import { User } from './types';
import * as userService from './userService';

// Empty mock data array for backward compatibility
export const mockUsers: User[] = [];

// Re-export all functions from the user service
export const {
  getUsers,
  getUserById,
  getUsersByIds,
  createUser,
  updateUser
} = userService; 