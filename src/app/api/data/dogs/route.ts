import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { parseJsonFields } from '@/lib/dbOperations';

export async function GET() {
  try {
    const dogs = await prisma.dog.findMany({
      include: {
        owner: true
      }
    });
    
    // Parse any JSON fields in the data
    const parsedDogs = dogs.map(dog => parseJsonFields(dog));
    
    return NextResponse.json(parsedDogs);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    return NextResponse.json({ error: 'Failed to fetch dogs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json({ error: 'Dog name is required' }, { status: 400 });
    }
    
    if (!data.ownerId) {
      return NextResponse.json({ error: 'Owner ID is required' }, { status: 400 });
    }
    
    if (!data.breed) {
      return NextResponse.json({ error: 'Dog breed is required' }, { status: 400 });
    }
    
    if (!data.age) {
      return NextResponse.json({ error: 'Dog age is required' }, { status: 400 });
    }
    
    if (!data.size) {
      return NextResponse.json({ error: 'Dog size is required' }, { status: 400 });
    }
    
    // Validate size is one of the allowed values
    const validSizes = ['small', 'medium', 'large'];
    if (!validSizes.includes(data.size)) {
      return NextResponse.json({ 
        error: 'Invalid dog size. Must be one of: small, medium, large' 
      }, { status: 400 });
    }
    
    // Validate temperament and specialNeeds are arrays
    if (data.temperament && !Array.isArray(data.temperament)) {
      return NextResponse.json({ 
        error: 'Temperament must be an array of strings' 
      }, { status: 400 });
    }
    
    if (data.specialNeeds && !Array.isArray(data.specialNeeds)) {
      return NextResponse.json({ 
        error: 'Special needs must be an array of strings' 
      }, { status: 400 });
    }
    
    // Check if owner exists
    const owner = await prisma.owner.findUnique({
      where: { id: data.ownerId }
    });
    
    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }
    
    // Create dog with validated data
    const newDog = await prisma.dog.create({
      data: {
        name: data.name,
        breed: data.breed,
        age: data.age,
        size: data.size,
        temperament: data.temperament || [],
        specialNeeds: data.specialNeeds || [],
        ownerId: data.ownerId,
        address: data.address || owner.address,
        assessmentStatus: 'pending'
      }
    });
    
    // Parse any JSON fields in the response
    const parsedDog = parseJsonFields(newDog);
    
    return NextResponse.json(parsedDog, { status: 201 });
  } catch (error) {
    console.error('Error creating dog:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({ 
      error: `Failed to create dog: ${errorMessage}`,
      details: error instanceof Error ? error.toString() : undefined
    }, { status: 500 });
  }
} 