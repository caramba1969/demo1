# Database Models and Schema Design

**Date**: Session 1 - Initial Implementation  
**Files Modified**: `src/lib/models/`

## Overview
Created comprehensive MongoDB schemas for the Satisfactory Factory Planner, including models for items, recipes, production lines, and enhanced factory structure.

## Files Created

### 1. Item Model (`src/lib/models/Item.ts`)
**Purpose**: Store all Satisfactory game items with their properties

```typescript
interface IItem {
  _id?: mongoose.Types.ObjectId;
  className: string;        // Unique Satisfactory class identifier
  slug: string;            // URL-friendly identifier
  name: string;           // Display name
  description?: string;   // Item description
  icon?: string;         // Icon identifier
  sinkPoints: number;    // AWESOME Sink value
  stackSize: number;     // Inventory stack size
  energyValue: number;   // Energy content (for fuel items)
  radioactiveDecay: number; // Radioactivity level
  liquid: boolean;       // Is this a liquid/gas?
  fluidColor?: {...};    // Color for fluids
}
```

**Key Features**:
- Unique indexes on `className` and `slug`
- Text search index on `name` and `description`
- Support for both solid items and fluids
- Comprehensive item metadata from Satisfactory

### 2. Recipe Model (`src/lib/models/Recipe.ts`)
**Purpose**: Store all Satisfactory recipes with ingredients, products, and production requirements

```typescript
interface IRecipe {
  _id?: mongoose.Types.ObjectId;
  className: string;
  slug: string;
  name: string;
  alternate: boolean;           // Is this an alternate recipe?
  time: number;                // Production time in seconds
  inHand: boolean;             // Can craft by hand?
  forBuilding: boolean;        // Is this for building construction?
  inWorkshop: boolean;         // Craft in Equipment Workshop?
  inMachine: boolean;          // Requires machine production?
  manualTimeMultiplier: number;
  ingredients: IRecipeIngredient[];
  products: IRecipeProduct[];
  producedIn: string[];        // Required buildings
  isVariablePower: boolean;
  minPower: number;
  maxPower: number;
}
```

**Key Features**:
- Separate schemas for ingredients and products
- Indexes for finding recipes by product or ingredient
- Support for alternate recipes
- Power consumption tracking
- Building requirements

### 3. Production Line Model (`src/lib/models/ProductionLine.ts`)
**Purpose**: Link factories to specific item production with targets and calculations

```typescript
interface IProductionLine {
  _id?: mongoose.Types.ObjectId;
  factoryId: mongoose.Types.ObjectId;  // Reference to Factory
  itemClassName: string;               // What to produce
  recipeClassName: string;             // How to produce it
  targetQuantityPerMinute: number;     // Production target
  actualQuantityPerMinute?: number;    // Calculated actual output
  buildingCount?: number;              // Required buildings
  buildingType?: string;               // Type of building needed
  powerConsumption?: number;           // Total power required
  efficiency?: number;                 // Production efficiency %
  notes?: string;                      // User notes
  active: boolean;                     // Is line active?
}
```

**Key Features**:
- Links to factories via foreign key
- Production planning calculations
- User-configurable targets and notes
- Active/inactive state management

## Database Indexes Created

### Item Indexes
- `className` (unique)
- `slug` (unique) 
- `name` (for sorting)
- Text search on `name` and `description`

### Recipe Indexes
- `className` (unique)
- `slug` (unique)
- `name` (for sorting)
- `alternate` (for filtering)
- `products.item` (for finding recipes that produce specific items)
- `ingredients.item` (for finding recipes that use specific items)
- Text search on `name`

### Production Line Indexes
- `factoryId` + `itemClassName` (compound)
- `factoryId` + `active` (for filtering active lines)

## Schema Design Decisions

1. **String References vs ObjectId**: Used string references for items and recipes in production lines to match Satisfactory's className system
2. **Embedded vs Referenced**: Used embedded schemas for ingredients/products to improve query performance
3. **Flexible Metadata**: Added optional fields for future extensibility
4. **Performance Optimization**: Strategic indexing for common query patterns

## Integration with Existing Models
- Enhanced existing Factory model to work with new production line system
- Maintained backward compatibility with existing factory tasks and notes
- Used consistent naming conventions across all models
