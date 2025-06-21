import mongoose from 'mongoose';

export interface IRecipeIngredient {
  item: string; // className reference to Item
  amount: number;
}

export interface IRecipeProduct {
  item: string; // className reference to Item
  amount: number;
}

export interface IRecipe {
  _id?: mongoose.Types.ObjectId;
  className: string;
  slug: string;
  name: string;
  alternate: boolean;
  time: number; // production time in seconds
  inHand: boolean;
  forBuilding: boolean;
  inWorkshop: boolean;
  inMachine: boolean;
  manualTimeMultiplier: number;
  ingredients: IRecipeIngredient[];
  products: IRecipeProduct[];
  producedIn: string[]; // building classNames
  isVariablePower: boolean;
  minPower: number;
  maxPower: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const RecipeIngredientSchema = new mongoose.Schema<IRecipeIngredient>({
  item: {
    type: String,
    required: true,
    ref: 'Item'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const RecipeProductSchema = new mongoose.Schema<IRecipeProduct>({
  item: {
    type: String,
    required: true,
    ref: 'Item'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const RecipeSchema = new mongoose.Schema<IRecipe>({
  className: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  alternate: {
    type: Boolean,
    default: false,
    index: true
  },
  time: {
    type: Number,
    required: true,
    min: 0
  },
  inHand: {
    type: Boolean,
    default: false
  },
  forBuilding: {
    type: Boolean,
    default: false
  },
  inWorkshop: {
    type: Boolean,
    default: false
  },
  inMachine: {
    type: Boolean,
    default: false
  },
  manualTimeMultiplier: {
    type: Number,
    default: 1.0
  },
  ingredients: [RecipeIngredientSchema],
  products: [RecipeProductSchema],
  producedIn: [{
    type: String
  }],
  isVariablePower: {
    type: Boolean,
    default: false
  },
  minPower: {
    type: Number,
    default: 0
  },
  maxPower: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for finding recipes by product
RecipeSchema.index({ 'products.item': 1 });
// Index for finding recipes by ingredient
RecipeSchema.index({ 'ingredients.item': 1 });
// Text search index
RecipeSchema.index({ 
  name: 'text' 
});

export default mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', RecipeSchema);
