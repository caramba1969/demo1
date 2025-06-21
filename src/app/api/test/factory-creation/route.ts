import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from '@/lib/mongodb';
import { Factory } from '@/lib/models/Factory';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();
    
    console.log('=== TESTING FACTORY CREATION ===');
    console.log('User ID:', session.user.id);
    console.log('User ID type:', typeof session.user.id);
    console.log('User ID length:', session.user.id.length);

    // Test 1: Try to create without userId (should fail)
    try {
      const factoryWithoutUserId = await Factory.create({
        name: 'Test Factory Without UserID',
        order: 0
      });
      console.log('❌ ERROR: Factory created without userId:', factoryWithoutUserId._id);    } catch (error: any) {
      console.log('✅ GOOD: Factory creation without userId failed as expected:', error.message);
    }

    // Test 2: Create with userId (should succeed)
    try {
      const factoryWithUserId = await Factory.create({
        name: 'Test Factory With UserID',
        order: 0,
        userId: session.user.id
      });
      console.log('✅ GOOD: Factory created with userId:', {
        _id: factoryWithUserId._id,
        name: factoryWithUserId.name,
        userId: factoryWithUserId.userId
      });

      // Verify it's in the database
      const dbFactory = await Factory.findById(factoryWithUserId._id);
      console.log('✅ VERIFICATION: Factory in DB:', {
        _id: dbFactory?._id,
        name: dbFactory?.name,
        userId: dbFactory?.userId,
        hasUserId: !!dbFactory?.userId
      });

      // Clean up - delete the test factory
      await Factory.findByIdAndDelete(factoryWithUserId._id);
      console.log('✅ CLEANUP: Test factory deleted');

      return NextResponse.json({
        success: true,
        message: 'Factory creation test passed',
        userId: session.user.id,
        testResults: {
          creationWithoutUserIdFailed: true,
          creationWithUserIdSucceeded: true,
          dbVerificationPassed: !!dbFactory?.userId
        }
      });    } catch (error: any) {
      console.log('❌ ERROR: Factory creation with userId failed:', error);
      return NextResponse.json({
        error: 'Factory creation with userId failed',
        details: error.message
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Test failed:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
