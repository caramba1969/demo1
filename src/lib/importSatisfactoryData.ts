import fs from 'fs';
import path from 'path';
import { dbConnect } from '@/lib/mongodb';
import Item from '@/lib/models/Item';
import Recipe from '@/lib/models/Recipe';

interface SatisfactoryData {
  items: Record<string, any>;
  recipes: Record<string, any>;
}

export async function importSatisfactoryData(dataFilePath: string) {
  try {
    console.log('Starting Satisfactory data import...');
    
    // Connect to database
    await dbConnect();
    
    // Read the data file
    const rawData = fs.readFileSync(dataFilePath, 'utf8');
    const data: SatisfactoryData = JSON.parse(rawData);
    
    console.log(`Found ${Object.keys(data.items).length} items and ${Object.keys(data.recipes).length} recipes`);
    
    // Import Items
    console.log('Importing items...');
    const itemEntries = Object.entries(data.items);
    const itemBatch = [];
    
    for (const [className, itemData] of itemEntries) {
      const item = {
        className,
        slug: itemData.slug || className.toLowerCase(),
        name: itemData.name || className,
        description: itemData.description || '',
        icon: itemData.icon || '',
        sinkPoints: itemData.sinkPoints || 0,
        stackSize: itemData.stackSize || 1,
        energyValue: itemData.energyValue || 0,
        radioactiveDecay: itemData.radioactiveDecay || 0,
        liquid: itemData.liquid || false,
        fluidColor: itemData.fluidColor || { r: 255, g: 255, b: 255, a: 0 }
      };
      
      itemBatch.push(item);
    }
    
    // Clear existing items and insert new ones
    await Item.deleteMany({});
    await Item.insertMany(itemBatch);
    console.log(`Imported ${itemBatch.length} items`);
    
    // Import Recipes
    console.log('Importing recipes...');
    const recipeEntries = Object.entries(data.recipes);
    const recipeBatch = [];
    
    for (const [className, recipeData] of recipeEntries) {
      const recipe = {
        className,
        slug: recipeData.slug || className.toLowerCase(),
        name: recipeData.name || className,
        alternate: recipeData.alternate || false,
        time: recipeData.time || 1,
        inHand: recipeData.inHand || false,
        forBuilding: recipeData.forBuilding || false,
        inWorkshop: recipeData.inWorkshop || false,
        inMachine: recipeData.inMachine || false,
        manualTimeMultiplier: recipeData.manualTimeMultiplier || 1,
        ingredients: recipeData.ingredients || [],
        products: recipeData.products || [],
        producedIn: recipeData.producedIn || [],
        isVariablePower: recipeData.isVariablePower || false,
        minPower: recipeData.minPower || 0,
        maxPower: recipeData.maxPower || 1
      };
      
      recipeBatch.push(recipe);
    }
    
    // Clear existing recipes and insert new ones
    await Recipe.deleteMany({});
    await Recipe.insertMany(recipeBatch);
    console.log(`Imported ${recipeBatch.length} recipes`);
    
    console.log('Satisfactory data import completed successfully!');
    
    return {
      success: true,
      itemsImported: itemBatch.length,
      recipesImported: recipeBatch.length
    };
    
  } catch (error) {
    console.error('Error importing Satisfactory data:', error);
    throw error;
  }
}

// CLI script functionality
if (require.main === module) {
  const dataFilePath = process.argv[2] || './data1.0.json';
  
  if (!fs.existsSync(dataFilePath)) {
    console.error(`Data file not found: ${dataFilePath}`);
    process.exit(1);
  }
  
  importSatisfactoryData(dataFilePath)
    .then((result) => {
      console.log('Import completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}
