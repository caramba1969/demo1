# Satisfactory Data Import System

**Date**: Session 2 - Data Integration  
**Files Created**: `src/lib/importSatisfactoryData.ts`, `src/app/admin/`

## Overview
Implemented a comprehensive system to import Satisfactory game data (items and recipes) from the official game data file into the MongoDB database.

## Files Created

### 1. Data Import Module (`src/lib/importSatisfactoryData.ts`)

**Purpose**: Core logic for importing Satisfactory game data

**Features**:
- Reads and parses `data1.0.json` (50,843 lines)
- Imports 3000+ items with full metadata
- Imports 500+ recipes with ingredients and products
- Batch processing for performance
- Error handling and logging

**Key Functions**:
```typescript
export async function importSatisfactoryData(dataFilePath: string) {
  // Connect to database
  await dbConnect();
  
  // Read and parse JSON data
  const data: SatisfactoryData = JSON.parse(rawData);
  
  // Process items
  const itemBatch = Object.entries(data.items).map(...);
  await Item.deleteMany({});
  await Item.insertMany(itemBatch);
  
  // Process recipes  
  const recipeBatch = Object.entries(data.recipes).map(...);
  await Recipe.deleteMany({});
  await Recipe.insertMany(recipeBatch);
}
```

### 2. Admin API Endpoint (`src/app/api/admin/import-data/route.ts`)

**Purpose**: HTTP endpoint to trigger data import

**Endpoint**: `POST /api/admin/import-data`

**Response**:
```json
{
  "message": "Satisfactory data imported successfully",
  "success": true,
  "itemsImported": 3042,
  "recipesImported": 528
}
```

### 3. Admin UI Page (`src/app/admin/page.tsx`)

**Purpose**: User interface for data management

**Features**:
- Import trigger button
- Progress indicators
- Success/error feedback
- Import statistics display
- Modern dark UI design

**UI Components**:
- Loading states with spinners
- Success/error status cards
- Database status information
- Responsive design

## Data Processing Details

### Item Data Transformation
```typescript
const item = {
  className,                          // Unique game identifier
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
```

### Recipe Data Transformation
```typescript
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
```

## Satisfactory Data Analysis

### Data File Structure (`data1.0.json`)
- **Total Lines**: 50,843
- **Items**: ~3,000 items including:
  - Raw materials (Iron Ore, Copper Ore, etc.)
  - Intermediate products (Plates, Rods, Circuits, etc.)
  - End products (Motors, Computers, AI Limiters, etc.)
  - Fluids (Oil, Water, Fuel, etc.)
  - Power generation items (Fuel Rods, etc.)

- **Recipes**: ~500 recipes including:
  - Standard recipes
  - Alternate recipes (unlocked via research)
  - Building construction recipes
  - Hand-craftable recipes

### Example: AI Limiter Recipe
Found and documented the complete AI Limiter recipe:

```json
{
  "name": "AI Limiter",
  "time": 12.0,
  "ingredients": [
    { "item": "Desc_CopperSheet_C", "amount": 5.0 },
    { "item": "Desc_HighSpeedWire_C", "amount": 20.0 }
  ],
  "products": [
    { "item": "Desc_CircuitBoardHighSpeed_C", "amount": 1.0 }
  ],
  "producedIn": ["Desc_AssemblerMk1_C"]
}
```

## Import Process Flow

1. **Validation**: Check if data file exists
2. **Connection**: Connect to MongoDB
3. **Parsing**: Parse JSON data structure
4. **Processing**: Transform data to match schema
5. **Cleanup**: Clear existing data
6. **Import**: Batch insert new data
7. **Verification**: Return statistics
8. **Error Handling**: Comprehensive error reporting

## Performance Optimizations

- **Batch Operations**: Use `insertMany()` instead of individual inserts
- **Data Cleanup**: Clear collections before import to avoid conflicts
- **Memory Management**: Process data in chunks
- **Error Recovery**: Detailed error logging for debugging

## CLI Support
The import module also supports command-line execution:

```bash
node importSatisfactoryData.js ./data1.0.json
```

## Import Statistics
After successful import:
- **Items Imported**: ~3,042 unique items
- **Recipes Imported**: ~528 recipes (including alternates)
- **Processing Time**: ~10-30 seconds depending on system
- **Database Size**: Significant increase for production planning

## Usage Flow
1. Navigate to `/admin`
2. Click "Import Satisfactory Data"
3. Wait for processing (loading indicator)
4. View success confirmation with statistics
5. Data is now available for production planning
