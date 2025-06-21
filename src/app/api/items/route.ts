import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Item from '@/lib/models/Item';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const liquid = searchParams.get('liquid');
    const category = searchParams.get('category');
    
    let query: any = {};
    
    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by liquid/solid
    if (liquid !== null) {
      query.liquid = liquid === 'true';
    }
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Get items with pagination
    const items = await Item.find(query)
      .select('className slug name description icon sinkPoints stackSize liquid energyValue')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const totalCount = await Item.countDocuments(query);
    
    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Create new item
    const item = await Item.create(body);
    
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    console.error('Error creating item:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Item with this className or slug already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}
