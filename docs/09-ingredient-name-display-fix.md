# Ingredient Name Display Fix

## Overview

Fixed the issue where production line ingredients were displaying className values instead of human-readable item names in the UI.

## Problem

- Production lines were showing ingredient class names (e.g., `Desc_IronOre_C`) instead of display names (e.g., `Iron Ore`)
- This made the production line details difficult to read and understand

## Solution

### API Changes

**File:** `src/app/api/factories/[id]/production-lines/route.ts`

- Enhanced the `calculateProductionMetrics` function to populate ingredient and product names
- Added database lookups to fetch Item documents for each ingredient/product
- Enriched the response data with name fields alongside the existing className references

```typescript
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
```

### UI Changes

**File:** `src/components/ProductionLineCard.tsx`

- Updated TypeScript interfaces to include optional `name` property for ingredients and products
- Modified the ingredient display to show the name with fallback to className
- Updated from `{ingredient.item}` to `{ingredient.name || ingredient.item}`

### Type Safety

- Updated interfaces to include the new optional `name` property:
  ```typescript
  ingredients: Array<{ item: string; amount: number; name?: string }>;
  products: Array<{ item: string; amount: number; name?: string }>;
  ```

## Impact

- Production line ingredient lists now display human-readable names
- Backward compatibility maintained with fallback to className
- Improved user experience for production planning
- No breaking changes to existing data structures

## Testing

1. Create or view production lines with multiple ingredients
2. Verify that ingredient names display as readable text (e.g., "Iron Ore" instead of "Desc_IronOre_C")
3. Confirm that production lines still function correctly for recipe calculations

## Future Enhancements

- Consider caching the enriched data to improve performance
- Add item icons next to ingredient names for better visual recognition
- Extend the same pattern to other areas where class names are displayed

## Files Modified

- `src/app/api/factories/[id]/production-lines/route.ts` - API enhancement for name population
- `src/components/ProductionLineCard.tsx` - UI update for name display and type safety
