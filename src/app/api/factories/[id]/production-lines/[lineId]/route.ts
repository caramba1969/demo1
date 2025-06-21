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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; lineId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const { id: factoryId, lineId } = await params;
    const body = await request.json();
    
    // Verify the factory belongs to the authenticated user
    const factory = await Factory.findOne({ _id: factoryId, userId: session.user?.id });
    if (!factory) {
      return NextResponse.json(
        { error: "Factory not found or access denied" },
        { status: 403 }
      );
    }
    
    // Update production line, but only if it belongs to the user's factory
    const productionLine = await ProductionLine.findOneAndUpdate(
      { _id: lineId, factoryId },
      body,
      { new: true }
    );
    
    if (!productionLine) {
      return NextResponse.json(
        { error: 'Production line not found or access denied' },
        { status: 404 }
      );
    }
    
    // Return with calculated metrics
    const productionLineWithMetrics = await calculateProductionMetrics(productionLine.toObject());
    
    return NextResponse.json(productionLineWithMetrics);
  } catch (error: any) {
    console.error('Error updating production line:', error);
    
    return NextResponse.json(
      { error: 'Failed to update production line' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; lineId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const { id: factoryId, lineId } = await params;
    
    // Verify the factory belongs to the authenticated user
    const factory = await Factory.findOne({ _id: factoryId, userId: session.user?.id });
    if (!factory) {
      return NextResponse.json(
        { error: "Factory not found or access denied" },
        { status: 403 }
      );
    }
    
    // Delete production line, but only if it belongs to the user's factory
    const productionLine = await ProductionLine.findOneAndDelete({ 
      _id: lineId, 
      factoryId 
    });
    
    if (!productionLine) {
      return NextResponse.json(
        { error: 'Production line not found or access denied' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting production line:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete production line' },
      { status: 500 }
    );
  }
}
