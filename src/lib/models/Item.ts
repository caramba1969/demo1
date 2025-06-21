import mongoose from 'mongoose';

export interface IItem {
  _id?: mongoose.Types.ObjectId;
  className: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  sinkPoints: number;
  stackSize: number;
  energyValue: number;
  radioactiveDecay: number;
  liquid: boolean;
  fluidColor?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const ItemSchema = new mongoose.Schema<IItem>({
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
  description: String,
  icon: String,
  sinkPoints: {
    type: Number,
    default: 0
  },
  stackSize: {
    type: Number,
    required: true
  },
  energyValue: {
    type: Number,
    default: 0
  },
  radioactiveDecay: {
    type: Number,
    default: 0
  },
  liquid: {
    type: Boolean,
    default: false
  },
  fluidColor: {
    r: { type: Number, default: 255 },
    g: { type: Number, default: 255 },
    b: { type: Number, default: 255 },
    a: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Text search index for item names and descriptions
ItemSchema.index({ 
  name: 'text', 
  description: 'text' 
});

export default mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);
