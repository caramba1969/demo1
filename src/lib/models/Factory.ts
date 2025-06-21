import mongoose, { Schema, models, model } from "mongoose";

const FactorySchema = new Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  // Add more fields as needed
});

export const Factory = models.Factory || model("Factory", FactorySchema);
