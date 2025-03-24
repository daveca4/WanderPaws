import { NextRequest, NextResponse } from 'next/server';
import * as dbOps from '@/lib/dbOperations';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET() {
  try {
    const conversations = await dbOps.getAllConversations();
    
    // Parse any JSON fields in the data
    const parsedConversations = conversations.map((conversation: any) => parseJsonFields(conversation));
    
    return NextResponse.json(parsedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const newConversation = await dbOps.createConversation(data);
    
    // Parse any JSON fields in the response
    const parsedConversation = parseJsonFields(newConversation);
    
    return NextResponse.json(parsedConversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
} 