import { NextRequest, NextResponse } from 'next/server';
import * as dbOps from '@/lib/dbOperations';
import { parseJsonFields } from '@/lib/dbOperations';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Since getAllMessages doesn't exist, we'll use Prisma directly
    const messages = await prisma.message.findMany();
    
    // Parse any JSON fields in the data
    const parsedMessages = messages.map((message: any) => parseJsonFields(message));
    
    return NextResponse.json(parsedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const newMessage = await dbOps.createMessage(data);
    
    // Parse any JSON fields in the response
    const parsedMessage = parseJsonFields(newMessage);
    
    return NextResponse.json(parsedMessage, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
} 