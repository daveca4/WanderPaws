/**
 * Helper functions for user-related operations
 */
import { Dog, User } from '@/lib/types';

/**
 * Gets dogs belonging to a user based on ownership
 * @param dogs Array of all dogs
 * @param user Current user
 * @returns Array of dogs that belong to the user
 */
export function getDogsForUser(dogs: Dog[], user: User | null): Dog[] {
  if (!user || !dogs || !Array.isArray(dogs)) {
    console.log('getDogsForUser: Invalid input, returning empty array');
    return [];
  }

  // Get user identifiers
  const profileId = user.profileId || '';
  const userId = user.id || '';
  
  console.log('getDogsForUser: Looking for dogs with these user IDs:', { userId, profileId });
  console.log('getDogsForUser: Total dogs to search through:', dogs.length);
  
  // Create a map to deduplicate dogs by ID
  const dogMap = new Map<string, Dog>();

  // Strategy 1: Direct match using user.id
  const directMatches = dogs.filter(dog => dog.ownerId === userId);
  console.log('getDogsForUser: Direct matches by user.id:', directMatches.length);
  directMatches.forEach(dog => dogMap.set(dog.id, dog));
  
  // Strategy 2: Match using profileId if available
  if (profileId) {
    const profileMatches = dogs.filter(dog => dog.ownerId === profileId);
    console.log('getDogsForUser: Profile matches by profileId:', profileMatches.length);
    profileMatches.forEach(dog => dogMap.set(dog.id, dog));
  }

  // Convert map back to array
  const result = Array.from(dogMap.values());
  console.log('getDogsForUser: Final result count:', result.length);
  if (result.length > 0) {
    console.log('getDogsForUser: Found dogs:', result.map(d => d.name).join(', '));
  }
  
  return result;
} 