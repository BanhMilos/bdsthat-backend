import prisma from '../src/utils/prisma';
import { Prisma } from '@prisma/client';

async function quickTest() {
  try {
    console.log('🔍 Finding your user...');
    
    // Get your user (update email if different)
    const user = await prisma.user.findUnique({
      where: { email: 'hungann426@gmail.com' }
    });

    if (!user) {
      console.log('❌ User not found. Update the email in the script.');
      return;
    }

    console.log(`✅ Found user: ${user.fullname} (ID: ${user.userId})`);

    // Create a test property
    console.log('\n📝 Creating test property...');
    const property = await prisma.property.create({
      data: {
        userId: user.userId,
        title: 'Test Apartment for Listing',
        address: '123 Test Street, District 1, HCMC',
        propertyType: 'APARTMENT',
        description: 'Beautiful test property',
        bedrooms: 2,
        toilets: 2,
        landArea: new Prisma.Decimal(80),
        floorArea: new Prisma.Decimal(80),
        direction: 'SOUTH',
        furniture: 'FULL',
        status: 'APPROVED', // ✅ Important!
      }
    });

    console.log(`✅ Property created: ID ${property.propertyId}`);

    // Create a listing for this property
    console.log('\n📋 Creating test listing...');
    const listing = await prisma.listing.create({
      data: {
        userId: user.userId,
        propertyId: property.propertyId,
        title: 'Cozy 2BR near park',
        description: 'Quiet area, ready to move in.',
        price: new Prisma.Decimal(2500000000),
        listingType: 'FOR_SALE',
        priority: 0,
        currency: 'VND',
        pushedDate: new Date(),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
      },
      include: {
        Property: true,
        User: {
          select: {
            userId: true,
            fullname: true,
            email: true,
          }
        }
      }
    });

    console.log(`✅ Listing created successfully!`);
    console.log('\n📊 Test Data Summary:');
    console.log(`   User ID: ${user.userId}`);
    console.log(`   Property ID: ${property.propertyId}`);
    console.log(`   Listing ID: ${listing.listingId}`);
    console.log(`   Status: ${listing.status}`);
    
    console.log('\n🧪 Now you can test:');
    console.log(`   GET http://localhost:3000/listing/${listing.listingId}`);
    console.log(`   PUT http://localhost:3000/listing/${listing.listingId}`);
    console.log('\n📝 For next POST request, use:');
    console.log(`   "propertyId": "${property.propertyId}"`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickTest();
