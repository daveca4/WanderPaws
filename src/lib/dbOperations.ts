import prisma from './db';
import { Dog, Owner, Walker, Walk, TimeSlot, Assessment, Conversation, Message } from './types';

// Dog operations
export async function getAllDogs() {
  try {
    return await prisma.dog.findMany({
      include: {
        owner: true,
      },
    });
  } catch (error) {
    console.error('Error getting all dogs:', error);
    return [];
  }
}

export async function getDogById(id: string) {
  try {
    return await prisma.dog.findUnique({
      where: { id },
      include: {
        owner: true,
      },
    });
  } catch (error) {
    console.error(`Error getting dog with ID ${id}:`, error);
    return null;
  }
}

export async function getDogsByOwnerId(ownerId: string) {
  try {
    return await prisma.dog.findMany({
      where: { ownerId },
    });
  } catch (error) {
    console.error(`Error getting dogs for owner ${ownerId}:`, error);
    return [];
  }
}

export async function createDog(dogData: any) {
  try {
    // First verify that the owner exists
    const ownerExists = await prisma.owner.findUnique({
      where: { id: dogData.ownerId }
    });
    
    if (!ownerExists) {
      throw new Error(`Owner with ID ${dogData.ownerId} not found. Cannot create dog without valid owner.`);
    }
    
    return await prisma.dog.create({
      data: dogData,
    });
  } catch (error) {
    console.error('Error creating dog:', error);
    throw error;
  }
}

export async function updateDog(id: string, dogData: any) {
  try {
    return await prisma.dog.update({
      where: { id },
      data: dogData,
    });
  } catch (error) {
    console.error(`Error updating dog with ID ${id}:`, error);
    throw error;
  }
}

export async function deleteDog(id: string) {
  try {
    return await prisma.dog.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Error deleting dog with ID ${id}:`, error);
    throw error;
  }
}

// Owner operations
export async function getAllOwners() {
  try {
    return await prisma.owner.findMany({
      include: {
        dogs: true,
      },
    });
  } catch (error) {
    console.error('Error getting all owners:', error);
    return [];
  }
}

export async function getOwnerById(id: string) {
  try {
    return await prisma.owner.findUnique({
      where: { id },
      include: {
        dogs: true,
      },
    });
  } catch (error) {
    console.error(`Error getting owner with ID ${id}:`, error);
    return null;
  }
}

export async function getOwnerByUserId(userId: string) {
  try {
    return await prisma.owner.findUnique({
      where: { userId },
      include: {
        dogs: true,
      },
    });
  } catch (error) {
    console.error(`Error getting owner for user ${userId}:`, error);
    return null;
  }
}

export async function createOwner(ownerData: any) {
  try {
    return await prisma.owner.create({
      data: ownerData,
    });
  } catch (error) {
    console.error('Error creating owner:', error);
    throw error;
  }
}

export async function updateOwner(id: string, ownerData: any) {
  try {
    return await prisma.owner.update({
      where: { id },
      data: ownerData,
    });
  } catch (error) {
    console.error(`Error updating owner with ID ${id}:`, error);
    throw error;
  }
}

// Walker operations
export async function getAllWalkers() {
  try {
    return await prisma.walker.findMany();
  } catch (error) {
    console.error('Error getting all walkers:', error);
    return [];
  }
}

export async function getWalkerById(id: string) {
  try {
    return await prisma.walker.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error(`Error getting walker with ID ${id}:`, error);
    return null;
  }
}

export async function getWalkerByUserId(userId: string) {
  try {
    return await prisma.walker.findUnique({
      where: { userId },
    });
  } catch (error) {
    console.error(`Error getting walker for user ${userId}:`, error);
    return null;
  }
}

export async function createWalker(walkerData: any) {
  try {
    return await prisma.walker.create({
      data: walkerData,
    });
  } catch (error) {
    console.error('Error creating walker:', error);
    throw error;
  }
}

export async function updateWalker(id: string, walkerData: any) {
  try {
    return await prisma.walker.update({
      where: { id },
      data: walkerData,
    });
  } catch (error) {
    console.error(`Error updating walker with ID ${id}:`, error);
    throw error;
  }
}

// Walk operations
export async function getAllWalks() {
  try {
    return await prisma.walk.findMany({
      include: {
        dog: true,
        walker: true,
      },
    });
  } catch (error) {
    console.error('Error getting all walks:', error);
    return [];
  }
}

export async function getWalkById(id: string) {
  try {
    return await prisma.walk.findUnique({
      where: { id },
      include: {
        dog: true,
        walker: true,
      },
    });
  } catch (error) {
    console.error(`Error getting walk with ID ${id}:`, error);
    return null;
  }
}

export async function getWalksByDogId(dogId: string) {
  try {
    return await prisma.walk.findMany({
      where: { dogId },
      include: {
        walker: true,
      },
    });
  } catch (error) {
    console.error(`Error getting walks for dog ${dogId}:`, error);
    return [];
  }
}

export async function getWalksByWalkerId(walkerId: string) {
  try {
    return await prisma.walk.findMany({
      where: { walkerId },
      include: {
        dog: true,
      },
    });
  } catch (error) {
    console.error(`Error getting walks for walker ${walkerId}:`, error);
    return [];
  }
}

export async function createWalk(walkData: any) {
  try {
    return await prisma.walk.create({
      data: walkData,
    });
  } catch (error) {
    console.error('Error creating walk:', error);
    throw error;
  }
}

export async function updateWalk(id: string, walkData: any) {
  try {
    return await prisma.walk.update({
      where: { id },
      data: walkData,
    });
  } catch (error) {
    console.error(`Error updating walk with ID ${id}:`, error);
    throw error;
  }
}

export async function deleteWalk(id: string) {
  try {
    return await prisma.walk.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Error deleting walk with ID ${id}:`, error);
    throw error;
  }
}

// Assessment operations
export async function getAllAssessments() {
  try {
    return await prisma.assessment.findMany();
  } catch (error) {
    console.error('Error getting all assessments:', error);
    return [];
  }
}

export async function getAssessmentById(id: string) {
  try {
    return await prisma.assessment.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error(`Error getting assessment with ID ${id}:`, error);
    return null;
  }
}

export async function getAssessmentsByWalkerId(walkerId: string) {
  try {
    console.log('Searching for assessments with walkerId:', walkerId);
    
    // First try direct match with the provided ID
    let assessments = await prisma.assessment.findMany({
      where: { assignedWalkerId: walkerId },
    });
    
    console.log('Found assessments by direct match:', assessments.length);
    console.log('Assessment objects:', JSON.stringify(assessments, null, 2));
    
    // If no assessments found, try to find the walker in case profileId is userId or another ID
    if (assessments.length === 0) {
      // Check if we can find a walker with this ID
      const walkerByDirectId = await prisma.walker.findUnique({
        where: { id: walkerId },
        include: { user: true }
      });
      
      if (walkerByDirectId) {
        console.log('Found walker by direct ID:', walkerByDirectId.id);
        console.log('Walker object:', JSON.stringify(walkerByDirectId, null, 2));
        // Use the Prisma API directly instead of raw SQL
        const directCheck = await prisma.assessment.findMany({
          where: { 
            assignedWalkerId: walkerByDirectId.id 
          }
        });
        console.log('Direct check for assessments:', JSON.stringify(directCheck, null, 2));
      }
      
      // Try to find walker by userId
      const walkerByUserId = await prisma.walker.findUnique({
        where: { userId: walkerId },
        include: { user: true }
      });
      
      if (walkerByUserId) {
        console.log('Found walker by userId:', walkerByUserId.id);
        console.log('Walker object by userId:', JSON.stringify(walkerByUserId, null, 2));
        // Search assessments again with the walker's actual ID
        assessments = await prisma.assessment.findMany({
          where: { assignedWalkerId: walkerByUserId.id },
        });
        console.log('Found assessments using walker.id from userId:', assessments.length);
        console.log('Assessment objects from userId lookup:', JSON.stringify(assessments, null, 2));
        
        // If we found a walker by userId but no assessments, try a direct query
        if (assessments.length === 0) {
          const directCheck = await prisma.assessment.findMany({
            where: { 
              assignedWalkerId: walkerByUserId.id 
            }
          });
          console.log('Direct check for assessments by walker ID from userId:', JSON.stringify(directCheck, null, 2));
        }
      }
      
      // If still no assessments, try one more approach - list all assessments and filter
      if (assessments.length === 0) {
        console.log('No assessments found with specific queries, listing all assessments to check manually');
        
        const allAssessments = await prisma.assessment.findMany({
          where: {
            assignedWalkerId: { not: null } // Only get assessments with an assigned walker
          }
        });
        
        console.log('Total assessments with assigned walkers:', allAssessments.length);
        console.log('All assignedWalkerIds:', allAssessments.map(a => a.assignedWalkerId));
        console.log('All assessments:', JSON.stringify(allAssessments, null, 2));
        
        // Try to find assessments where ownerId or dogId might match the walkerId 
        // (in case fields were mixed up)
        const possibleMixups = await prisma.assessment.findMany({
          where: {
            OR: [
              { ownerId: walkerId },
              { dogId: walkerId }
            ]
          }
        });
        
        if (possibleMixups.length > 0) {
          console.log('Warning: Found assessments where ownerId or dogId matches the walkerId:', JSON.stringify(possibleMixups, null, 2));
        }
      }
    }
    
    // Map the database result to the Assessment type with string dates
    return assessments.map(assessment => ({
      ...assessment,
      createdDate: assessment.createdDate.toISOString(),
      scheduledDate: assessment.scheduledDate.toISOString(),
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString()
    }));
  } catch (error) {
    console.error(`Error getting assessments for walker ${walkerId}:`, error);
    return [];
  }
}

export async function createAssessment(assessmentData: any) {
  try {
    return await prisma.assessment.create({
      data: assessmentData,
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    throw error;
  }
}

export async function updateAssessment(id: string, assessmentData: any) {
  try {
    return await prisma.assessment.update({
      where: { id },
      data: assessmentData,
    });
  } catch (error) {
    console.error(`Error updating assessment with ID ${id}:`, error);
    throw error;
  }
}

// Conversation and message operations
export async function getAllConversations() {
  try {
    return await prisma.conversation.findMany({
      include: {
        messages: true,
      },
    });
  } catch (error) {
    console.error('Error getting all conversations:', error);
    return [];
  }
}

export async function getConversationById(id: string) {
  try {
    return await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: true,
      },
    });
  } catch (error) {
    console.error(`Error getting conversation with ID ${id}:`, error);
    return null;
  }
}

export async function createConversation(conversationData: any) {
  try {
    return await prisma.conversation.create({
      data: conversationData,
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

export async function createMessage(messageData: any) {
  try {
    return await prisma.message.create({
      data: messageData,
    });
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
}

export async function updateMessage(id: string, messageData: any) {
  try {
    return await prisma.message.update({
      where: { id },
      data: messageData,
    });
  } catch (error) {
    console.error(`Error updating message with ID ${id}:`, error);
    throw error;
  }
}

export async function deleteMessage(id: string) {
  try {
    return await prisma.message.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Error deleting message with ID ${id}:`, error);
    throw error;
  }
}

export async function updateConversation(id: string, conversationData: any) {
  try {
    return await prisma.conversation.update({
      where: { id },
      data: conversationData,
    });
  } catch (error) {
    console.error(`Error updating conversation with ID ${id}:`, error);
    throw error;
  }
}

// Helper function to handle JSON data when querying from DB
export function parseJsonFields(data: any): any {
  if (!data) return data;
  
  // If it's an array, map over each item
  if (Array.isArray(data)) {
    return data.map(item => parseJsonFields(item));
  }
  
  // Only process objects
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  // Create a clone of the object to avoid modifying the original
  const clonedData = { ...data };
  
  // Process all potential JSON string fields
  const jsonFields = [
    'walkingPreferences', 'address', 'availability', 
    'route', 'feedback', 'metrics'
  ];
  
  for (const field of jsonFields) {
    if (field in clonedData && clonedData[field] && typeof clonedData[field] === 'string') {
      try {
        clonedData[field] = JSON.parse(clonedData[field]);
      } catch (e) {
        // If parsing fails, keep original value
        console.warn(`Failed to parse JSON for field ${field}`, e);
      }
    }
  }
  
  return clonedData;
}

// User operations
export async function getAllUsers() {
  try {
    return await prisma.user.findMany();
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

export async function getUserById(id: string) {
  try {
    return await prisma.user.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error(`Error getting user with ID ${id}:`, error);
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    return await prisma.user.findUnique({
      where: { email },
    });
  } catch (error) {
    console.error(`Error getting user with email ${email}:`, error);
    return null;
  }
}

export async function createUser(userData: any) {
  try {
    return await prisma.user.create({
      data: userData,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function updateUser(id: string, userData: any) {
  try {
    return await prisma.user.update({
      where: { id },
      data: userData,
    });
  } catch (error) {
    console.error(`Error updating user with ID ${id}:`, error);
    throw error;
  }
}

export async function deleteUser(id: string) {
  try {
    return await prisma.user.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Error deleting user with ID ${id}:`, error);
    throw error;
  }
} 