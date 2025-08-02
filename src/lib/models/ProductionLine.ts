import mongoose from 'mongoose';

export interface IProductionLine {
  _id?: mongoose.Types.ObjectId;
  factoryId: mongoose.Types.ObjectId;
  itemClassName: string; // reference to Item
  recipeClassName: string; // reference to Recipe (or 'EXTRACTION' for extractions)
  targetQuantityPerMinute: number;
  actualQuantityPerMinute?: number;
  buildingCount?: number;
  buildingType?: string;
  powerConsumption?: number;
  efficiency?: number; // percentage (0-100)
  notes?: string;
  active: boolean;
  extractionData?: {
    type: 'ore' | 'fluid' | 'gas';
    extractorType: string;
    baseRate: number;
    powerConsumption?: number;
    description?: string;
  }; // For resource extraction production lines
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductionLineSchema = new mongoose.Schema<IProductionLine>({
  factoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Factory',
    required: true,
    index: true
  },
  itemClassName: {
    type: String,
    required: true,
    ref: 'Item',
    index: true
  },
  recipeClassName: {
    type: String,
    required: true,
    index: true
    // Note: For extractions, this will be 'EXTRACTION'
  },
  targetQuantityPerMinute: {
    type: Number,
    required: true,
    min: 0
  },
  actualQuantityPerMinute: {
    type: Number,
    min: 0
  },
  buildingCount: {
    type: Number,
    min: 0
  },
  buildingType: String,
  powerConsumption: {
    type: Number,
    min: 0
  },
  efficiency: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  notes: String,
  extractionData: {
    type: {
      type: String,
      enum: ['ore', 'fluid', 'gas']
    },
    extractorType: String,
    baseRate: Number,
    powerConsumption: Number,
    description: String
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for factory production lines
ProductionLineSchema.index({ factoryId: 1, itemClassName: 1 });
ProductionLineSchema.index({ factoryId: 1, active: 1 });

export default mongoose.models.ProductionLine || mongoose.model<IProductionLine>('ProductionLine', ProductionLineSchema);
