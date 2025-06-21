import { Schema, models, model } from "mongoose";

const FactorySchema = new Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true, index: true },
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
}, {
  // Add strict mode to ensure schema validation
  strict: true,
  // Add validation options
  runValidators: true
});

// Force deletion of existing model to ensure recompilation
if (models.Factory) {
  delete models.Factory;
}

export const Factory = model("Factory", FactorySchema);
