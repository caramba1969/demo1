import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Factory } from '@/lib/models/Factory';
import { dbConnect } from '@/lib/mongodb';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const { factories } = await request.json();
    
    if (!Array.isArray(factories)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Update the order for each factory, but only for the authenticated user's factories
    const updatePromises = factories.map((factory: { id: string; order: number }) =>
      Factory.findOneAndUpdate(
        { _id: factory.id, userId: session.user?.id },
        { order: factory.order },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering factories:', error);
    return NextResponse.json(
      { error: 'Failed to reorder factories' },
      { status: 500 }
    );
  }
}
