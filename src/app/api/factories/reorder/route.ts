import { NextRequest, NextResponse } from 'next/server';
import { Factory } from '@/lib/models/Factory';
import { dbConnect } from '@/lib/mongodb';

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const { factories } = await request.json();
    
    if (!Array.isArray(factories)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Update the order for each factory
    const updatePromises = factories.map((factory: { id: string; order: number }) =>
      Factory.findByIdAndUpdate(
        factory.id,
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
