import { AIRecommendation, Dog, Walker, Walk } from './types';
import { mockDogs, mockWalkers, mockWalks } from './mockData';

// In a production environment, this would use OpenAI's API
// For now, we'll use mock recommendations based on our data

export async function getWalkerRecommendation(dogId: string): Promise<AIRecommendation> {
  // Get the dog information
  const dog = mockDogs.find(d => d.id === dogId);
  if (!dog) {
    throw new Error('Dog not found');
  }

  // Get past walks for this dog to analyze patterns
  const dogWalks = mockWalks.filter(w => w.dogId === dogId);
  
  // Find walkers who have walked this dog before and their ratings
  const walkerRatings: Record<string, { count: number, totalRating: number }> = {};
  
  dogWalks.forEach(walk => {
    if (walk.status === 'completed' && walk.feedback) {
      if (!walkerRatings[walk.walkerId]) {
        walkerRatings[walk.walkerId] = { count: 0, totalRating: 0 };
      }
      walkerRatings[walk.walkerId].count += 1;
      walkerRatings[walk.walkerId].totalRating += walk.feedback.rating;
    }
  });
  
  // Calculate average ratings for each walker
  const walkerAvgRatings: Record<string, number> = {};
  Object.entries(walkerRatings).forEach(([walkerId, data]) => {
    walkerAvgRatings[walkerId] = data.totalRating / data.count;
  });
  
  // Score each walker based on factors like:
  // - Previous experience with this dog
  // - Specialties match dog's needs
  // - Availability matches dog's walking preferences
  // - Overall ratings
  
  const walkerScores: { walkerId: string; score: number; reason: string }[] = [];
  
  mockWalkers.forEach(walker => {
    let score = 0;
    let reasons: string[] = [];
    
    // Previous experience with this dog
    if (walkerAvgRatings[walker.id]) {
      const experienceBonus = walkerAvgRatings[walker.id] * 10;
      score += experienceBonus;
      if (walkerAvgRatings[walker.id] >= 4.5) {
        reasons.push(`Great past experience with ${dog.name}`);
      } else if (walkerAvgRatings[walker.id] >= 4.0) {
        reasons.push(`Good past experience with ${dog.name}`);
      }
    }
    
    // Size preference match
    if (walker.preferredDogSizes.includes(dog.size)) {
      score += 20;
      reasons.push(`Prefers ${dog.size} dogs like ${dog.name}`);
    }
    
    // Special needs match
    if (dog.specialNeeds.length > 0) {
      const needsMatch = dog.specialNeeds.some(need => 
        walker.specialties.some(specialty => need.toLowerCase().includes(specialty.toLowerCase()))
      );
      
      if (needsMatch) {
        score += 30;
        reasons.push(`Has experience with ${dog.name}'s special needs`);
      }
    }
    
    // Temperament match
    const temperamentMatch = dog.temperament.some(temp => 
      walker.specialties.some(specialty => specialty.toLowerCase().includes(temp.toLowerCase()))
    );
    
    if (temperamentMatch) {
      score += 15;
      reasons.push(`Has experience with ${dog.temperament.join('/')} dogs`);
    }
    
    // Overall rating
    score += walker.rating * 5;
    
    walkerScores.push({
      walkerId: walker.id,
      score,
      reason: reasons.length > 0 ? reasons[0] : `Good overall match for ${dog.name}`
    });
  });
  
  // Sort by score and get the top recommendation
  walkerScores.sort((a, b) => b.score - a.score);
  const topRecommendation = walkerScores[0];
  
  const recommendedWalker = mockWalkers.find(w => w.id === topRecommendation.walkerId);
  if (!recommendedWalker) {
    throw new Error('Walker not found');
  }
  
  return {
    type: 'walker',
    reason: topRecommendation.reason,
    confidence: Math.min(topRecommendation.score / 100, 0.99),
    data: recommendedWalker
  };
}

export async function getScheduleRecommendation(dogId: string): Promise<AIRecommendation> {
  // Get the dog information
  const dog = mockDogs.find(d => d.id === dogId);
  if (!dog) {
    throw new Error('Dog not found');
  }
  
  // Analyze past walks, dog preferences, and other factors
  const { frequency, duration, preferredTimes } = dog.walkingPreferences;
  
  // Calculate recommended schedule
  const recommendedSchedule = {
    frequency,
    duration,
    weeklySchedule: generateWeeklySchedule(dog)
  };
  
  return {
    type: 'schedule',
    reason: `Based on ${dog.name}'s age, size, breed, and walking preferences`,
    confidence: 0.85,
    data: recommendedSchedule
  };
}

// Helper function to generate a weekly schedule
function generateWeeklySchedule(dog: Dog) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const schedule: Record<string, string[]> = {};
  
  // Calculate how many days per week to walk based on frequency
  const walksPerWeek = Math.min(dog.walkingPreferences.frequency, 7);
  
  // Distribute walks evenly through the week
  const selectedDays = [...days].sort(() => 0.5 - Math.random()).slice(0, walksPerWeek);
  
  days.forEach(day => {
    if (selectedDays.includes(day)) {
      const preferredTime = dog.walkingPreferences.preferredTimes[
        Math.floor(Math.random() * dog.walkingPreferences.preferredTimes.length)
      ];
      
      let timeSlot: string;
      switch (preferredTime) {
        case 'morning':
          timeSlot = '09:00';
          break;
        case 'afternoon':
          timeSlot = '13:00';
          break;
        case 'evening':
          timeSlot = '17:00';
          break;
        default:
          timeSlot = '12:00';
      }
      
      schedule[day] = [timeSlot];
    } else {
      schedule[day] = [];
    }
  });
  
  return schedule;
}

export async function getDogHealthInsights(dogId: string): Promise<any> {
  // Get past walks for this dog
  const dogWalks = mockWalks.filter(w => w.dogId === dogId && w.status === 'completed' && w.metrics);
  
  if (dogWalks.length === 0) {
    return {
      message: 'Not enough walk data to generate insights',
      hasInsights: false
    };
  }
  
  // Process walk metrics
  const totalDistance = dogWalks.reduce((sum, walk) => sum + (walk.metrics?.distanceCovered || 0), 0);
  const avgDistance = totalDistance / dogWalks.length;
  
  const totalWalkTime = dogWalks.reduce((sum, walk) => sum + (walk.metrics?.totalTime || 0), 0);
  const avgWalkTime = totalWalkTime / dogWalks.length;
  
  const totalMoodRating = dogWalks.reduce((sum, walk) => sum + (walk.metrics?.moodRating || 3), 0);
  const avgMoodRating = totalMoodRating / dogWalks.length;
  
  // Calculate frequency of behaviors
  const behaviorCounts: Record<string, number> = {};
  dogWalks.forEach(walk => {
    walk.metrics?.behaviorsObserved.forEach(behavior => {
      behaviorCounts[behavior] = (behaviorCounts[behavior] || 0) + 1;
    });
  });
  
  const topBehaviors = Object.entries(behaviorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([behavior]) => behavior);
  
  return {
    hasInsights: true,
    averageDistance: avgDistance.toFixed(1),
    averageWalkTime: Math.round(avgWalkTime),
    averageMoodRating: avgMoodRating.toFixed(1),
    topBehaviors,
    walkCount: dogWalks.length,
    recommendations: generateHealthRecommendations(dogWalks, mockDogs.find(d => d.id === dogId))
  };
}

function generateHealthRecommendations(walks: Walk[], dog?: Dog): string[] {
  if (!dog) return [];
  
  const recommendations: string[] = [];
  
  const avgWalkTime = walks.reduce((sum, walk) => sum + (walk.metrics?.totalTime || 0), 0) / walks.length;
  const recentWalks = walks.slice(-3);
  const recentMoodAvg = recentWalks.reduce((sum, walk) => sum + (walk.metrics?.moodRating || 3), 0) / recentWalks.length;
  
  // Based on dog's age
  if (dog.age < 2) {
    recommendations.push("Young dogs need consistent exercise for proper development. Consider adding mental stimulation activities during walks.");
  } else if (dog.age > 7) {
    recommendations.push("Senior dogs may need shorter, more frequent walks rather than fewer long walks. Monitor for signs of fatigue.");
  }
  
  // Based on recent mood
  if (recentMoodAvg < 3.5) {
    recommendations.push("Dog's mood has been lower than usual lately. Consider changing walking routes or adding enrichment activities.");
  }
  
  // Based on walk duration
  if (avgWalkTime < 20 && dog.size !== 'small') {
    recommendations.push("Walk duration may be too short based on dog's size and energy needs. Consider gradually increasing walk length.");
  } else if (avgWalkTime > 60 && dog.age > 8) {
    recommendations.push("Walk duration may be too long for your senior dog. Consider breaking into multiple shorter walks.");
  }
  
  // Based on breed and size
  if (dog.size === 'large' && dog.breed.toLowerCase().includes('retriever')) {
    recommendations.push("Retrievers generally benefit from activities that combine swimming and retrieval games along with regular walks.");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Your current walking routine is well-matched to your dog's needs. Keep it up!");
  }
  
  return recommendations.slice(0, 3); // Return top 3 recommendations
} 