import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testHolidayRequestModel() {
  try {
    console.log('Testing HolidayRequest model...');
    
    // Test 1: Count all HolidayRequest records
    console.log('Test 1: Counting all records...');
    const totalCount = await prisma.holidayRequest.count();
    console.log(`Total HolidayRequest records: ${totalCount}`);
    
    // Test 2: Find pending holiday requests
    console.log('\nTest 2: Finding pending holiday requests...');
    try {
      const pendingRequests = await prisma.holidayRequest.findMany({
        where: { status: 'pending' },
        orderBy: { date: 'asc' }
      });
      console.log(`Found ${pendingRequests.length} pending requests`);
      console.log('First few pending requests:', pendingRequests.slice(0, 3));
    } catch (error) {
      console.error('Error finding pending requests:', error);
    }
    
    // Test 3: Create a test holiday request
    console.log('\nTest 3: Creating a test holiday request...');
    try {
      const testRequest = await prisma.holidayRequest.create({
        data: {
          walkerId: 'test-walker-id',
          date: new Date().toISOString().split('T')[0], // today's date in YYYY-MM-DD
          reason: 'Test request',
          status: 'pending'
        }
      });
      console.log('Created test request:', testRequest);
      
      // Clean up: Delete the test request
      await prisma.holidayRequest.delete({
        where: { id: testRequest.id }
      });
      console.log('Deleted test request');
    } catch (error) {
      console.error('Error with create/delete test:', error);
    }
    
    console.log('\nTests completed.');
  } catch (error) {
    console.error('Error testing HolidayRequest model:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
testHolidayRequestModel()
  .catch(e => {
    console.error('Test script error:', e);
    process.exit(1);
  }); 