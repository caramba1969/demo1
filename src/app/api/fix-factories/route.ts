import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from '@/lib/mongodb';
import { Factory } from '@/lib/models/Factory';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get all factories to see what's happening
    const allFactories = await Factory.find({});
    const factoriesWithUserId = await Factory.find({ userId: { $exists: true } });
    const factoriesWithoutUserId = await Factory.find({ userId: { $exists: false } });
    const userFactories = await Factory.find({ userId: session.user?.id });

    return NextResponse.json({
      session: {
        userId: session.user?.id,
        email: session.user?.email,
        name: session.user?.name
      },
      database: {
        totalFactories: allFactories.length,
        factoriesWithUserId: factoriesWithUserId.length,
        factoriesWithoutUserId: factoriesWithoutUserId.length,
        userFactories: userFactories.length
      },
      factories: {
        all: allFactories.map(f => ({
          _id: f._id.toString(),
          name: f.name,
          userId: f.userId || 'MISSING',
          hasUserId: !!f.userId,
          createdAt: f.createdAt
        })),
        withoutUserId: factoriesWithoutUserId.map(f => ({
          _id: f._id.toString(),
          name: f.name,
          createdAt: f.createdAt
        }))
      }
    });

  } catch (error: any) {
    console.error('Error in factory debug:', error);
    return NextResponse.json(
      { 
        error: 'Debug failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

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

    // First, let's see what we have
    const factoriesWithoutUserId = await Factory.find({ userId: { $exists: false } });
    
    if (factoriesWithoutUserId.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No factories need migration',
        factoriesUpdated: 0
      });
    }

    // Update all factories without userId to belong to current user
    const updateResult = await Factory.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: session.user.id } }
    );

    // Verify the update worked
    const verifyFactories = await Factory.find({ userId: session.user.id });

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${updateResult.modifiedCount} factories to your account`,
      details: {
        factoriesFound: factoriesWithoutUserId.length,
        factoriesUpdated: updateResult.modifiedCount,
        userFactoriesAfterUpdate: verifyFactories.length,
        userId: session.user.id
      }
    });

  } catch (error: any) {
    console.error('Error in factory migration:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
