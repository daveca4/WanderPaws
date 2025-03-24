import { NextRequest, NextResponse } from 'next/server';
import * as dbOps from '@/lib/dbOperations';
import { parseJsonFields } from '@/lib/dbOperations';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  
  try {
    const conversation = await dbOps.getConversationById(id);
    
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    
    // Parse any JSON fields in the data
    const parsedConversation = parseJsonFields(conversation);
    
    return NextResponse.json(parsedConversation);
  } catch (error) {
    console.error(`Error fetching conversation with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  
  try {
    const data = await request.json();
    const updatedConversation = await dbOps.updateConversation(id, data);
    
    // Parse any JSON fields in the response
    const parsedConversation = parseJsonFields(updatedConversation);
    
    return NextResponse.json(parsedConversation);
  } catch (error) {
    console.error(`Error updating conversation with ID ${id}:`, error);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
} 