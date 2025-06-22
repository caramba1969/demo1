import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { dbConnect } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define the FactoryImport schema and model
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

// Create an import relationship between factories
export async function POST(
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
    const body = await request.json();
    const { sourceFactoryId, itemClassName, requiredAmount } = body;

    // Validate input
    if (!sourceFactoryId || !itemClassName || !requiredAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceFactoryId, itemClassName, requiredAmount' },
        { status: 400 }
      );
    }

    // Create import record
    const factoryImport = new FactoryImport({
      targetFactoryId: factoryId,
      sourceFactoryId,
      itemClassName,
      requiredAmount,
      userId: session.user.id,
      active: true
    });

    await factoryImport.save();

    return NextResponse.json({
      success: true,
      import: factoryImport
    });

  } catch (error) {
    console.error('Error creating factory import:', error);
    return NextResponse.json(
      { error: 'Failed to create import' },
      { status: 500 }
    );
  }
}

// Get all imports for a factory
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

    // Get all imports for this factory with source factory details
    const imports = await FactoryImport.find({
      targetFactoryId: factoryId,
      userId: session.user.id,
      active: true
    }).populate('sourceFactoryId', 'name').lean();

    return NextResponse.json({ imports });

  } catch (error) {
    console.error('Error fetching factory imports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch imports' },
      { status: 500 }
    );
  }
}

// Delete an import
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const importId = searchParams.get('importId');

    if (!importId) {
      return NextResponse.json(
        { error: 'Missing importId parameter' },
        { status: 400 }
      );
    }

    await dbConnect();

    const result = await FactoryImport.deleteOne({
      _id: importId,
      userId: session.user.id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Import not found or not owned by user' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting factory import:', error);
    return NextResponse.json(
      { error: 'Failed to delete import' },
      { status: 500 }
    );
  }
}
