import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dbConnect } from '@/lib/mongodb';
import { FactoryImport } from '@/lib/models/FactoryImport';

// Get all exports from this factory (imports where this factory is the source)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const factoryId = (await params).id;
    const { searchParams } = new URL(request.url);
    const itemClassName = searchParams.get('itemClassName');

    // Build query: find all imports where this factory is the source
    const query: any = {
      sourceFactoryId: factoryId,
      userId: session.user.id,
      active: true
    };

    // If itemClassName is specified, filter by that item
    if (itemClassName) {
      query.itemClassName = itemClassName;
    }

    // Get all exports from this factory with target factory details
    const exports = await FactoryImport.find(query)
      .populate('targetFactoryId', 'name')
      .lean();

    return NextResponse.json({ exports });

  } catch (error) {
    console.error('Error fetching factory exports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exports' },
      { status: 500 }
    );
  }
}
