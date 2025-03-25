import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';

/**
 * This endpoint ensures that an Owner record exists for a given User
 * It either returns the existing Owner or creates a new one
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, name, email, phone, address } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    console.log('Ensuring owner exists for user:', userId);
    
    // Check if owner record already exists for this user
    let owner = await prisma.owner.findUnique({
      where: { userId }
    });
    
    if (owner) {
      console.log('Found existing owner:', owner.id);
      return NextResponse.json(parseJsonFields(owner));
    }
    
    // No owner record exists, create one
    if (!name || !email) {
      return NextResponse.json({ 
        error: 'Name and email are required to create an owner profile' 
      }, { status: 400 });
    }
    
    // Create a new owner record
    owner = await prisma.owner.create({
      data: {
        name: name,
        email: email,
        phone: phone || '',
        address: address || { street: '', city: '', state: '', zip: '' },
        userId: userId
      }
    });
    
    console.log('Created new owner:', owner.id);
    return NextResponse.json(parseJsonFields(owner), { status: 201 });
  } catch (error) {
    console.error('Error ensuring owner exists:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      error: `Failed to ensure owner exists: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
} 