import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
  active: { type: Boolean, default: true },
  sourceProductionLineId: { type: String, required: false, default: null },
  targetProductionLineId: { type: String, required: false, default: null },
});

const FactoryImport = mongoose.models.FactoryImport || mongoose.model('FactoryImport', FactoryImportSchema);

// Create an import relationship between factories
export async function POST(
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
    const body = await request.json();
    const { sourceFactoryId, itemClassName, requiredAmount, sourceProductionLineId, targetProductionLineId } = body;    // Validate input
    if (!sourceFactoryId || !itemClassName || !requiredAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceFactoryId, itemClassName, requiredAmount' },
        { status: 400 }
      );
    }// Check if an import already exists for this item between these factories
    const existingImport = await FactoryImport.findOne({
      targetFactoryId: factoryId,
      sourceFactoryId,
      itemClassName,
      userId: session.user.id,
      active: true
    });

    let factoryImport;
    
    if (existingImport) {
      // Update existing import amount and PL routing if provided
      existingImport.requiredAmount = requiredAmount;
      if (sourceProductionLineId) existingImport.sourceProductionLineId = sourceProductionLineId;
      if (targetProductionLineId) existingImport.targetProductionLineId = targetProductionLineId;
      factoryImport = await existingImport.save();
    } else {
      // Create new import record
      factoryImport = new FactoryImport({
        targetFactoryId: factoryId,
        sourceFactoryId,
        itemClassName,
        requiredAmount,
        userId: session.user.id,
        active: true,
        ...(sourceProductionLineId && { sourceProductionLineId }),
        ...(targetProductionLineId && { targetProductionLineId }),
      });
      await factoryImport.save();
    }

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const factoryId = (await params).id;

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

// Update an import
export async function PATCH(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { importId, requiredAmount, sourceFactoryId } = body;

    if (!importId || requiredAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: importId, requiredAmount' },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = { requiredAmount };
    if (sourceFactoryId) update.sourceFactoryId = sourceFactoryId;

    const updated = await FactoryImport.findOneAndUpdate(
      { _id: importId, userId: session.user.id },
      update,
      { new: true }
    ).populate('sourceFactoryId', 'name').lean();

    if (!updated) {
      return NextResponse.json(
        { error: 'Import not found or not owned by user' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, import: updated });

  } catch (error) {
    console.error('Error updating factory import:', error);
    return NextResponse.json(
      { error: 'Failed to update import' },
      { status: 500 }
    );
  }
}

// Delete an import
export async function DELETE(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
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
