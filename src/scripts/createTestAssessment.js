// Script to create a test pending assessment
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for existing pending assessments...');
  
  // Check for existing pending assessments
  const existingAssessments = await prisma.assessment.findMany({
    where: {
      status: 'pending'
    },
    take: 5,
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  if (existingAssessments.length > 0) {
    console.log('✅ Found existing pending assessments:');
    existingAssessments.forEach((assessment, index) => {
      console.log(`${index + 1}. ID: ${assessment.id}, Dog: ${assessment.dogId}, Status: ${assessment.status}`);
    });
    return;
  }
  
  console.log('❌ No pending assessments found. Creating a test assessment...');
  
  // Get a random dog and owner
  const randomDog = await prisma.dog.findFirst({
    include: {
      owner: true
    }
  });
  
  if (!randomDog) {
    console.error('❌ No dogs found in the database. Please create a dog first.');
    return;
  }
  
  console.log(`Found dog: ${randomDog.name} (${randomDog.id}), Owner: ${randomDog.owner.name} (${randomDog.owner.id})`);
  
  // Create a test assessment
  const newAssessment = await prisma.assessment.create({
    data: {
      dogId: randomDog.id,
      ownerId: randomDog.owner.id,
      status: 'pending',
      createdDate: new Date(),
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      adminNotes: 'Test assessment created via script',
      resultNotes: '',
    }
  });
  
  console.log('✅ Test assessment created successfully:');
  console.log(`ID: ${newAssessment.id}`);
  console.log(`Dog: ${newAssessment.dogId}`);
  console.log(`Owner: ${newAssessment.ownerId}`);
  console.log(`Status: ${newAssessment.status}`);
  console.log(`Created: ${newAssessment.createdDate.toISOString()}`);
  console.log(`Scheduled: ${newAssessment.scheduledDate.toISOString()}`);
}

main()
  .catch((e) => {
    console.error('Error in script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 