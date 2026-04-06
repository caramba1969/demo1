export interface RecipeIngredient {
  item: string;
  amount: number;
  name: string;
}

export interface RecipeProduct {
  item: string;
  amount: number;
  name: string;
}

export interface ProductionLineData {
  [key: string]: unknown;
  _id: string;
  itemClassName: string;
  itemName: string;
  recipeClassName: string;
  recipeName?: string;
  targetQuantityPerMinute: number;
  actualQuantityPerMinute?: number;
  buildingCount?: number;
  buildingType?: string;
  powerConsumption?: number;
  active: boolean;
  recipeTime?: number;
  ingredients: RecipeIngredient[];
  products: RecipeProduct[];
}

export interface FlowFactoryData {
  [key: string]: unknown;
  factoryId: string;
  name: string;
  locationId?: { _id: string; name: string; color?: string; icon?: string } | null;
  productionLines: ProductionLineData[];
  isLoadingLines: boolean;
}

export interface FlowEdgeData {
  [key: string]: unknown;
  itemName: string;
  amount: number;
  itemClassName: string;
}

export interface PaletteItem {
  type: 'item' | 'recipe';
  itemClassName: string;
  recipeClassName?: string;
  name: string;
  description?: string;
}
