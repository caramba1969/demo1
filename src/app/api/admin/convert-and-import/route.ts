import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { convertRawSatisfactoryData } from '@/lib/convertRawSatisfactoryData';
import { dbConnect } from '@/lib/mongodb';
import Item from '@/lib/models/Item';
import Recipe from '@/lib/models/Recipe';

export const maxDuration = 60; // Allow up to 60s for large files

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read uploaded file as a buffer, detect and decode encoding
    const buffer = Buffer.from(await file.arrayBuffer());

    let text: string;
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      // UTF-16 LE BOM
      text = buffer.toString('utf16le');
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
      // UTF-16 BE BOM
      text = buffer.swap16().toString('utf16le');
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    } else {
      text = buffer.toString('utf8');
      if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    }

    // Convert raw game data → intermediate format
    const { items, recipes } = convertRawSatisfactoryData(text);

    const itemCount = Object.keys(items).length;

    if (itemCount === 0) {
      return NextResponse.json(
        { error: 'No items found in file. Make sure this is a valid Satisfactory Docs.json / en-GB.json export.' },
        { status: 422 }
      );
    }

    // Write to MongoDB
    await dbConnect();

    const itemBatch = Object.values(items);
    const recipeBatch = Object.values(recipes);

    await Item.deleteMany({});
    await Item.insertMany(itemBatch);

    await Recipe.deleteMany({});
    await Recipe.insertMany(recipeBatch);

    return NextResponse.json({
      success: true,
      message: 'Satisfactory data converted and imported successfully',
      itemsImported: itemBatch.length,
      recipesImported: recipeBatch.length,
    });
  } catch (error: any) {
    console.error('Error in convert-and-import:', error);
    return NextResponse.json(
      { error: 'Failed to convert/import data', details: error.message },
      { status: 500 }
    );
  }
}
