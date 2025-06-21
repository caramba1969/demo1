import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from '@/lib/mongodb';
import { Factory } from '@/lib/models/Factory';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find factories without userId field
    const factoriesWithoutUserId = await Factory.find({ 
      userId: { $exists: false } 
    });

    if (factoriesWithoutUserId.length === 0) {
      return NextResponse.json({
        message: 'No factories found without userId. Migration not needed.',
        factoriesUpdated: 0
      });
    }

    // Update all factories without userId to belong to the current user
    const result = await Factory.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: session.user?.id } }
    );

    return NextResponse.json({
      message: `Successfully migrated ${result.modifiedCount} factories to user ${session.user?.email}`,
      factoriesFound: factoriesWithoutUserId.length,
      factoriesUpdated: result.modifiedCount,
      userId: session.user?.id
    });

  } catch (error: any) {
    console.error('Error during factory migration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to migrate factories',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
