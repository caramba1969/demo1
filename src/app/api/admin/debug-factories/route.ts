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

    // Get all factories to debug
    const allFactories = await Factory.find({}).lean();
    const userFactories = await Factory.find({ userId: session.user?.id }).lean();
    const factoriesWithoutUserId = await Factory.find({ userId: { $exists: false } }).lean();

    return NextResponse.json({
      currentUser: {
        id: session.user?.id,
        email: session.user?.email,
        name: session.user?.name
      },
      stats: {
        totalFactories: allFactories.length,
        userFactories: userFactories.length,
        factoriesWithoutUserId: factoriesWithoutUserId.length
      },
      allFactories: allFactories.map(f => ({
        _id: f._id,
        name: f.name,
        userId: f.userId || 'MISSING',
        createdAt: f.createdAt
      })),
      userFactories: userFactories.map(f => ({
        _id: f._id,
        name: f.name,
        userId: f.userId,
        createdAt: f.createdAt
      }))
    });

  } catch (error: any) {
    console.error('Error during factory debug:', error);
    return NextResponse.json(
      { 
        error: 'Failed to debug factories',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
