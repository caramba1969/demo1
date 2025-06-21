import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/mongodb';
import ProductionLine from '@/lib/models/ProductionLine';
import Recipe, { IRecipe } from '@/lib/models/Recipe';
import Item, { IItem } from '@/lib/models/Item';

// Helper function to calculate production metrics
async function calculateProductionMetrics(productionLine: any) {
  try {
    const recipe = await Recipe.findOne({ className: productionLine.recipeClassName }).lean() as IRecipe | null;
    if (!recipe) return productionLine;
    
    const item = await Item.findOne({ className: productionLine.itemClassName }).lean() as IItem | null;
    if (!item) return productionLine;
    
    // Find the product amount from recipe
    const productInfo = recipe.products.find((p: any) => p.item === productionLine.itemClassName);
    if (!productInfo) return productionLine;
    
    // Calculate items per minute for the recipe
    const itemsPerCycle = productInfo.amount;
    const cycleTimeInMinutes = recipe.time / 60;
    const itemsPerMinute = itemsPerCycle / cycleTimeInMinutes;
    
    // Calculate required buildings to meet target
    const requiredBuildings = Math.ceil(productionLine.targetQuantityPerMinute / itemsPerMinute);
    const actualQuantityPerMinute = requiredBuildings * itemsPerMinute;
    
    // Estimate power consumption (basic calculation)
    const powerPerBuilding = recipe.maxPower || 1;
    const totalPowerConsumption = requiredBuildings * powerPerBuilding;
      // Populate ingredient names
    const enrichedIngredients = await Promise.all(
      recipe.ingredients.map(async (ingredient: any) => {
        const ingredientItem = await Item.findOne({ className: ingredient.item }).lean() as IItem | null;
        return {
          item: ingredient.item,
          amount: ingredient.amount,
          name: ingredientItem?.name || ingredient.item
        };
      })
    );
    
    // Populate product names
    const enrichedProducts = await Promise.all(
      recipe.products.map(async (product: any) => {
        const productItem = await Item.findOne({ className: product.item }).lean() as IItem | null;
        return {
          item: product.item,
          amount: product.amount,
          name: productItem?.name || product.item
        };
      })
    );
    
    return {
      ...productionLine,
      buildingCount: requiredBuildings,
      actualQuantityPerMinute,
      powerConsumption: totalPowerConsumption,
      buildingType: recipe.producedIn[0] || 'Unknown',
      recipe: {
        name: recipe.name,
        time: recipe.time,
        ingredients: enrichedIngredients,
        products: enrichedProducts
      },
      item: {
        name: item.name,
        icon: item.icon,
        slug: item.slug
      }
    };
  } catch (error) {
    console.error('Error calculating production metrics:', error);
    return productionLine;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id: factoryId } = await params;
    
    // Get production lines for this factory
    const productionLines = await ProductionLine.find({ factoryId })
      .sort({ createdAt: -1 })
      .lean();
    
    // Calculate metrics for each production line
    const productionLinesWithMetrics = await Promise.all(
      productionLines.map(line => calculateProductionMetrics(line))
    );
    
    return NextResponse.json({
      productionLines: productionLinesWithMetrics
    });
  } catch (error) {
    console.error('Error fetching production lines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch production lines' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id: factoryId } = await params;
    const body = await request.json();
    
    // Validate that the item and recipe exist
    const [item, recipe] = await Promise.all([
      Item.findOne({ className: body.itemClassName }),
      Recipe.findOne({ className: body.recipeClassName })
    ]);
    
    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }
    
    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }
    
    // Verify that the recipe actually produces the specified item
    const producesItem = recipe.products.some((p: any) => p.item === body.itemClassName);
    if (!producesItem) {
      return NextResponse.json(
        { error: 'Recipe does not produce the specified item' },
        { status: 400 }
      );
    }
    
    // Create new production line
    const productionLine = await ProductionLine.create({
      ...body,
      factoryId
    });
    
    // Return with calculated metrics
    const productionLineWithMetrics = await calculateProductionMetrics(productionLine.toObject());
    
    return NextResponse.json(productionLineWithMetrics, { status: 201 });
  } catch (error: any) {
    console.error('Error creating production line:', error);
    
    return NextResponse.json(
      { error: 'Failed to create production line' },
      { status: 500 }
    );
  }
}
