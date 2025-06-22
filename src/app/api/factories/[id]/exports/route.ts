import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Use the same FactoryImport model since exports are just imports from another perspective
const FactoryImportSchema = new mongoose.Schema({
  targetFactoryId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Factory' },
  sourceFactoryId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Factory' },
  itemClassName: { type: String, required: true },
  requiredAmount: { type: Number, required: true },
  userId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true }
});

const FactoryImport = mongoose.models.FactoryImport || mongoose.model('FactoryImport', FactoryImportSchema);

// Get all exports from this factory (imports where this factory is the source)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const factoryId = params.id;
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
