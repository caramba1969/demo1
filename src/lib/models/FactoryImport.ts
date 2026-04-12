import mongoose from "mongoose";

export interface IFactoryImport {
  _id?: mongoose.Types.ObjectId;
  targetFactoryId: mongoose.Types.ObjectId;
  sourceFactoryId: mongoose.Types.ObjectId;
  itemClassName: string;
  requiredAmount: number;
  userId: string;
  active: boolean;
  sourceProductionLineId?: string | null;
  targetProductionLineId?: string | null;
  createdAt?: Date;
}

const FactoryImportSchema = new mongoose.Schema<IFactoryImport>({
  targetFactoryId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Factory" },
  sourceFactoryId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Factory" },
  itemClassName: { type: String, required: true },
  requiredAmount: { type: Number, required: true },
  userId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
  sourceProductionLineId: { type: String, default: null },
  targetProductionLineId: { type: String, default: null },
});

export const FactoryImport =
  mongoose.models.FactoryImport ||
  mongoose.model<IFactoryImport>("FactoryImport", FactoryImportSchema);
