import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import Recipe from '@/lib/models/Recipe';
import Item from '@/lib/models/Item';

// Utility function to get item image path
function getItemImagePath(className: string): string {
  if (!className) return '/images/items/default.svg';
  
  // Convert className to expected file format
  // className format: "Desc_ItemName_C" -> "desc-itemname-c_64.png"
  // Also handles: "BP_EquipmentDescriptorName_C" -> "bp-equipmentdescriptorname-c_64.png"
  
  const lowerClassName = className.toLowerCase();
  
  // Remove the trailing "_C" and convert underscores to hyphens
  let imageName = lowerClassName.replace(/_c$/, '').replace(/_/g, '-');
  
  // Add the standard suffix
  imageName += '-c_64.png';
  
  return `/images/items/${imageName}`;
}

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
      .select('className slug name alternate time ingredients products producedIn inMachine inHand maxPower')
      .sort({ alternate: 1, name: 1 }) // Regular recipes first, then alternates
      .skip(skip)
      .limit(limit)
      .lean();

    // Enrich recipes with ingredient and product names
    const enrichedRecipes = await Promise.all(
      recipes.map(async (recipe) => {        // Populate ingredient names and images
        const enrichedIngredients = await Promise.all(
          recipe.ingredients.map(async (ingredient: any) => {
            const item = await Item.findOne({ className: ingredient.item }).lean() as any;
            return {
              ...ingredient,
              name: item?.name || ingredient.item,
              image: getItemImagePath(ingredient.item)
            };
          })
        );

        // Populate product names and images
        const enrichedProducts = await Promise.all(
          recipe.products.map(async (product: any) => {
            const item = await Item.findOne({ className: product.item }).lean() as any;
            return {
              ...product,
              name: item?.name || product.item,
              image: getItemImagePath(product.item)
            };
          })
        );

        return {
          ...recipe,
          ingredients: enrichedIngredients,
          products: enrichedProducts
        };
      })
    );
    
    // Get total count for pagination
    const totalCount = await Recipe.countDocuments(query);
      return NextResponse.json({
      recipes: enrichedRecipes,
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
