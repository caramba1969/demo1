import { Schema, models, model } from "mongoose";

const FactorySchema = new Schema({
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
  tasks: [{ 
    id: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  notes: [{ 
    id: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  // Add more fields as needed
});

export const Factory = models.Factory || model("Factory", FactorySchema);
