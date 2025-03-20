import { mockDogs } from './mockData';
import { Dog } from './types';

/**
 * Get all dogs belonging to a specific owner
 * @param ownerId The ID of the owner
 * @returns Array of dogs that belong to the specified owner
 */
export function getDogsByOwnerId(ownerId: string): Dog[] {
  return mockDogs.filter(dog => dog.ownerId === ownerId);
}

/**
 * Get a dog by its ID
 * @param dogId The ID of the dog to find
 * @returns The dog if found, or undefined if not found
 */
export function getDogById(dogId: string): Dog | undefined {
  return mockDogs.find(dog => dog.id === dogId);
}

/**
 * Get all dogs with a specific assessment status
 * @param status The status to filter by
 * @returns Array of dogs with the specified status
 */
export function getDogsByAssessmentStatus(status: NonNullable<Dog['assessmentStatus']>): Dog[] {
  return mockDogs.filter(dog => dog.assessmentStatus === status);
}

/**
 * Calculate average age of dogs by breed
 * @returns Map of breed to average age
 */
export function getAverageAgeByBreed(): Map<string, number> {
  const breedAges = new Map<string, { total: number; count: number }>();
  
  mockDogs.forEach(dog => {
    const breed = dog.breed;
    const current = breedAges.get(breed) || { total: 0, count: 0 };
    breedAges.set(breed, {
      total: current.total + dog.age,
      count: current.count + 1
    });
  });
  
  const averages = new Map<string, number>();
  breedAges.forEach((value, key) => {
    averages.set(key, value.total / value.count);
  });
  
  return averages;
}

/**
 * Get the most common breed in the system
 * @returns The most common breed name and count
 */
export function getMostCommonBreed(): { breed: string; count: number } | null {
  if (mockDogs.length === 0) return null;
  
  const breedCounts = new Map<string, number>();
  mockDogs.forEach(dog => {
    const breed = dog.breed;
    const current = breedCounts.get(breed) || 0;
    breedCounts.set(breed, current + 1);
  });
  
  let mostCommonBreed = '';
  let highestCount = 0;
  
  breedCounts.forEach((count, breed) => {
    if (count > highestCount) {
      mostCommonBreed = breed;
      highestCount = count;
    }
  });
  
  return { breed: mostCommonBreed, count: highestCount };
} 