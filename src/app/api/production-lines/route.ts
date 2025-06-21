import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from '@/lib/mongodb';
import ProductionLine from '@/lib/models/ProductionLine';
import { Factory } from '@/lib/models/Factory';
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
    
    return {
      ...productionLine,
      buildingCount: requiredBuildings,
      actualQuantityPerMinute,
      powerConsumption: totalPowerConsumption,
      buildingType: recipe.producedIn[0] || 'Unknown',
      recipe: {
        name: recipe.name,
        time: recipe.time,
        ingredients: recipe.ingredients,
        products: recipe.products
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const factoryId = searchParams.get('factoryId');
    const active = searchParams.get('active');
    
    // First, get user's factories to ensure they only see their production lines
    const userFactories = await Factory.find({ userId: session.user?.id }).select('_id');
    const userFactoryIds = userFactories.map(f => f._id);
    
    let query: any = {
      factoryId: { $in: userFactoryIds }
    };
    
    if (factoryId) {
      // Verify this factory belongs to the user
      const factory = await Factory.findOne({ _id: factoryId, userId: session.user?.id });
      if (!factory) {
        return NextResponse.json(
          { error: "Factory not found or access denied" },
          { status: 403 }
        );
      }
      query.factoryId = factoryId;
    }
    
    if (active !== null) {
      query.active = active === 'true';
    }
    
    // Get production lines
    const productionLines = await ProductionLine.find(query)
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    
    // Verify the factory belongs to the authenticated user
    if (body.factoryId) {
      const factory = await Factory.findOne({ _id: body.factoryId, userId: session.user?.id });
      if (!factory) {
        return NextResponse.json(
          { error: "Factory not found or access denied" },
          { status: 403 }
        );
      }
    }
    
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
    const productionLine = await ProductionLine.create(body);
    
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
