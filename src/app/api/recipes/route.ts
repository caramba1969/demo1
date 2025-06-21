import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Recipe from '@/lib/models/Recipe';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const productItem = searchParams.get('productItem'); // Find recipes that produce this item
    const ingredientItem = searchParams.get('ingredientItem'); // Find recipes that use this item
    const alternate = searchParams.get('alternate');
    const inMachine = searchParams.get('inMachine');
    
    let query: any = {};
    
    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by product item
    if (productItem) {
      query['products.item'] = productItem;
    }
    
    // Filter by ingredient item
    if (ingredientItem) {
      query['ingredients.item'] = ingredientItem;
    }
    
    // Filter by alternate recipes
    if (alternate !== null) {
      query.alternate = alternate === 'true';
    }
    
    // Filter by machine production
    if (inMachine !== null) {
      query.inMachine = inMachine === 'true';
    }
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Get recipes with pagination
    const recipes = await Recipe.find(query)
      .select('className slug name alternate time ingredients products producedIn inMachine inHand')
      .sort({ alternate: 1, name: 1 }) // Regular recipes first, then alternates
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const totalCount = await Recipe.countDocuments(query);
    
    return NextResponse.json({
      recipes,
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
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Create new recipe
    const recipe = await Recipe.create(body);
    
    return NextResponse.json(recipe, { status: 201 });
  } catch (error: any) {
    console.error('Error creating recipe:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Recipe with this className or slug already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create recipe' },
      { status: 500 }
    );
  }
}
