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
export function parseJsonFields(data: any) {
  if (!data) return null;
  
  const clonedData = { ...data };
  
  // Handle JSON fields in Dog
  if ('walkingPreferences' in clonedData && clonedData.walkingPreferences) {
    clonedData.walkingPreferences = typeof clonedData.walkingPreferences === 'string' 
      ? JSON.parse(clonedData.walkingPreferences) 
      : clonedData.walkingPreferences;
  }
  
  // Handle JSON fields in Owner
  if ('address' in clonedData && clonedData.address) {
    clonedData.address = typeof clonedData.address === 'string' 
      ? JSON.parse(clonedData.address) 
      : clonedData.address;
  }
  
  // Handle JSON fields in Walker
  if ('availability' in clonedData && clonedData.availability) {
    clonedData.availability = typeof clonedData.availability === 'string' 
      ? JSON.parse(clonedData.availability) 
      : clonedData.availability;
  }
  
  // Handle JSON fields in Walk
  if ('route' in clonedData && clonedData.route) {
    clonedData.route = typeof clonedData.route === 'string' 
      ? JSON.parse(clonedData.route) 
      : clonedData.route;
  }
  
  if ('feedback' in clonedData && clonedData.feedback) {
    clonedData.feedback = typeof clonedData.feedback === 'string' 
      ? JSON.parse(clonedData.feedback) 
      : clonedData.feedback;
  }
  
  if ('metrics' in clonedData && clonedData.metrics) {
    clonedData.metrics = typeof clonedData.metrics === 'string' 
      ? JSON.parse(clonedData.metrics) 
      : clonedData.metrics;
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