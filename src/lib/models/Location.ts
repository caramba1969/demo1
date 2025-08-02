import { Schema, models, model } from "mongoose";

const LocationSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  userId: { type: String, required: true, index: true },
  order: { type: Number, default: 0 },
  color: { type: String, default: "#3b82f6" }, // Default blue color
  icon: { type: String, default: "🌍" }, // Default world icon
  createdAt: { type: Date, default: Date.now },
}, {
  strict: true,
  runValidators: true
});

// Create compound index for user + name uniqueness
LocationSchema.index({ userId: 1, name: 1 }, { unique: true });

export const Location = models.Location || model("Location", LocationSchema);
