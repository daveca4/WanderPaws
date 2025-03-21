import { Message, Conversation, MessageAttachment } from './types';
import { v4 as uuidv4 } from 'uuid';

// Sample message attachments
export const mockMessageAttachments: MessageAttachment[] = [
  {
    id: uuidv4(),
    url: '/attachments/walk_report.pdf',
    type: 'document',
    name: 'Walk Report.pdf',
    size: 245000,
  },
  {
    id: uuidv4(),
    url: '/attachments/dog_photo1.jpg',
    type: 'image',
    name: 'Max at the park.jpg',
    size: 1200000,
  },
  {
    id: uuidv4(),
    url: '/attachments/voice_note.mp3',
    type: 'audio',
    name: 'Walk instructions.mp3',
    size: 500000,
  },
];

// Sample conversations
export const mockConversations: Conversation[] = [
  {
    id: '1',
    participants: ['user1', 'user2'], // Owner and walker
    createdAt: '2023-05-15T10:00:00Z',
    updatedAt: '2023-05-20T14:30:00Z',
    lastMessageId: '5',
    unreadCount: { user1: 0, user2: 1 },
    type: 'direct',
  },
  {
    id: '2',
    participants: ['user1', 'user3'], // Owner and another walker
    createdAt: '2023-05-10T09:15:00Z',
    updatedAt: '2023-05-19T16:45:00Z',
    lastMessageId: '9',
    unreadCount: { user1: 2, user3: 0 },
    type: 'direct',
  },
  {
    id: '3',
    participants: ['user2', 'user3', 'user4'], // Group conversation with admin
    title: 'Walker Team Chat',
    createdAt: '2023-05-05T13:20:00Z',
    updatedAt: '2023-05-18T11:10:00Z',
    lastMessageId: '15',
    unreadCount: { user2: 0, user3: 3, user4: 0 },
    type: 'group',
  },
  {
    id: '4',
    participants: ['user1', 'user4'], // Owner and admin
    createdAt: '2023-05-01T08:30:00Z',
    updatedAt: '2023-05-17T15:20:00Z',
    lastMessageId: '20',
    unreadCount: { user1: 0, user4: 0 },
    type: 'direct',
  },
];

// Sample messages
export const mockMessages: Message[] = [
  // Conversation 1 (Owner and Walker)
  {
    id: '1',
    conversationId: '1',
    senderId: 'user1',
    content: 'Hi, I was wondering if you could walk Max a bit earlier tomorrow?',
    timestamp: '2023-05-20T10:00:00Z',
    readStatus: 'read',
  },
  {
    id: '2',
    conversationId: '1',
    senderId: 'user2',
    content: 'Good morning! Sure, what time were you thinking?',
    timestamp: '2023-05-20T10:15:00Z',
    readStatus: 'read',
  },
  {
    id: '3',
    conversationId: '1',
    senderId: 'user1',
    content: 'Would 9am work instead of 11am?',
    timestamp: '2023-05-20T10:20:00Z',
    readStatus: 'read',
  },
  {
    id: '4',
    conversationId: '1',
    senderId: 'user2',
    content: "That works for me. I'll see you and Max at 9am then!",
    timestamp: '2023-05-20T10:25:00Z',
    readStatus: 'read',
  },
  {
    id: '5',
    conversationId: '1',
    senderId: 'user1',
    content: 'Perfect, thank you so much! Max will be excited for his earlier walk.',
    timestamp: '2023-05-20T14:30:00Z',
    readStatus: 'unread',
  },
  
  // Conversation 2 (Owner and another Walker)
  {
    id: '6',
    conversationId: '2',
    senderId: 'user3',
    content: 'Hello! I wanted to let you know that I noticed Bella was limping slightly during our walk today.',
    timestamp: '2023-05-19T15:30:00Z',
    readStatus: 'read',
  },
  {
    id: '7',
    conversationId: '2',
    senderId: 'user3',
    content: "It wasn't severe, but I thought you should know. She was still very energetic overall.",
    timestamp: '2023-05-19T15:32:00Z',
    readStatus: 'read',
  },
  {
    id: '8',
    conversationId: '2',
    senderId: 'user1',
    content: 'Oh, thank you for letting me know! She was playing pretty hard at the dog park yesterday.',
    timestamp: '2023-05-19T16:00:00Z',
    readStatus: 'read',
  },
  {
    id: '9',
    conversationId: '2',
    senderId: 'user3',
    content: "I've attached a short video of her walking so you can see what I mean. Let me know if you need anything else!",
    timestamp: '2023-05-19T16:45:00Z',
    readStatus: 'unread',
    attachments: [
      {
        id: uuidv4(),
        url: '/attachments/bella_walking.mp4',
        type: 'document',
        name: 'Bella walking.mp4',
        size: 3500000,
      }
    ],
  },
  
  // Conversation 3 (Group chat)
  {
    id: '10',
    conversationId: '3',
    senderId: 'user4',
    content: "Team, we have a new route available in the Central Park area. It's perfect for midday walks.",
    timestamp: '2023-05-18T09:00:00Z',
    readStatus: 'read',
  },
  {
    id: '11',
    conversationId: '3',
    senderId: 'user4',
    content: "I've attached the map and details about the route. Please check it out when you have a chance.",
    timestamp: '2023-05-18T09:02:00Z',
    readStatus: 'read',
    attachments: [
      {
        id: uuidv4(),
        url: '/attachments/central_park_route.pdf',
        type: 'document',
        name: 'Central Park Route.pdf',
        size: 1500000,
      }
    ],
  },
  {
    id: '12',
    conversationId: '3',
    senderId: 'user2',
    content: 'Thanks for sharing! This looks like a great route with plenty of shade.',
    timestamp: '2023-05-18T09:30:00Z',
    readStatus: 'read',
  },
  {
    id: '13',
    conversationId: '3',
    senderId: 'user3',
    content: 'Has anyone tried this route yet? I have a few clients with larger dogs who might enjoy it.',
    timestamp: '2023-05-18T10:15:00Z',
    readStatus: 'unread',
  },
  {
    id: '14',
    conversationId: '3',
    senderId: 'user2',
    content: "I'm planning to try it tomorrow with Max. I'll let you know how it goes!",
    timestamp: '2023-05-18T10:45:00Z',
    readStatus: 'unread',
  },
  {
    id: '15',
    conversationId: '3',
    senderId: 'user4',
    content: 'Great, looking forward to hearing your feedback. Remember we have a team meeting this Friday at 3pm.',
    timestamp: '2023-05-18T11:10:00Z',
    readStatus: 'unread',
  },
  
  // Conversation 4 (Owner and Admin)
  {
    id: '16',
    conversationId: '4',
    senderId: 'user1',
    content: "Hello, I'd like to inquire about adding another dog to my account. What's the process?",
    timestamp: '2023-05-17T14:00:00Z',
    readStatus: 'read',
  },
  {
    id: '17',
    conversationId: '4',
    senderId: 'user4',
    content: 'Hi there! Adding another dog is simple. Just go to your dashboard and click "Add New Dog" under the My Dogs section.',
    timestamp: '2023-05-17T14:30:00Z',
    readStatus: 'read',
  },
  {
    id: '18',
    conversationId: '4',
    senderId: 'user1',
    content: 'Perfect, I just found it. Do I need to schedule an assessment for my new puppy?',
    timestamp: '2023-05-17T14:45:00Z',
    readStatus: 'read',
  },
  {
    id: '19',
    conversationId: '4',
    senderId: 'user4',
    content: "Yes, all new dogs require a quick assessment. After you add your puppy's details, you'll be prompted to schedule the assessment.",
    timestamp: '2023-05-17T15:00:00Z',
    readStatus: 'read',
  },
  {
    id: '20',
    conversationId: '4',
    senderId: 'user1',
    content: "Great, thank you for your help! I've completed the registration and scheduled the assessment.",
    timestamp: '2023-05-17T15:20:00Z',
    readStatus: 'read',
  },
];

// Helper function to get messages for a conversation
export function getConversationMessages(conversationId: string): Message[] {
  return mockMessages.filter(message => message.conversationId === conversationId);
}

// Helper function to get conversations for a user
export function getUserConversations(userId: string): Conversation[] {
  return mockConversations.filter(conversation => 
    conversation.participants.includes(userId)
  );
}

// Helper function to get the conversation between two users
export function getDirectConversation(userId1: string, userId2: string): Conversation | undefined {
  return mockConversations.find(conversation => 
    conversation.type === 'direct' && 
    conversation.participants.includes(userId1) && 
    conversation.participants.includes(userId2)
  );
}

// Helper function to create a new message
export function createMessage(conversationId: string, senderId: string, content: string, attachments?: MessageAttachment[]): Message {
  const newMessage: Message = {
    id: uuidv4(),
    conversationId,
    senderId,
    content,
    timestamp: new Date().toISOString(),
    readStatus: 'unread',
    attachments
  };
  
  // In a real app, this would be an API call
  mockMessages.push(newMessage);
  
  // Update the conversation's last message and timestamp
  const conversation = mockConversations.find(conv => conv.id === conversationId);
  if (conversation) {
    conversation.lastMessageId = newMessage.id;
    conversation.updatedAt = newMessage.timestamp;
    
    // Update unread counts for all participants except sender
    if (!conversation.unreadCount) {
      conversation.unreadCount = {};
    }
    
    conversation.participants.forEach(participant => {
      if (participant !== senderId) {
        conversation.unreadCount![participant] = (conversation.unreadCount![participant] || 0) + 1;
      }
    });
  }
  
  return newMessage;
}

// Helper function to mark messages as read
export function markMessagesAsRead(conversationId: string, userId: string): void {
  // Mark all messages in the conversation as read for this user
  mockMessages.forEach(message => {
    if (message.conversationId === conversationId && message.senderId !== userId && message.readStatus === 'unread') {
      message.readStatus = 'read';
    }
  });
  
  // Update unread count for this user
  const conversation = mockConversations.find(conv => conv.id === conversationId);
  if (conversation && conversation.unreadCount) {
    conversation.unreadCount[userId] = 0;
  }
}

// Helper function to create a new conversation
export function createConversation(participants: string[], title?: string): Conversation {
  const newConversation: Conversation = {
    id: uuidv4(),
    participants,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unreadCount: {},
    type: participants.length > 2 ? 'group' : 'direct'
  };
  
  // In a real app, this would be an API call
  mockConversations.push(newConversation);
  
  return newConversation;
}

// Helper function to get total unread messages for a user
export function getTotalUnreadMessages(userId: string): number {
  return mockConversations.reduce((total, conversation) => {
    return total + (conversation.unreadCount?.[userId] || 0);
  }, 0);
} 