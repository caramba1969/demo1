import { Schema, models, model } from "mongoose";

// Mirrors the `users` collection created by @auth/mongodb-adapter.
// We extend it with a `role` field for access control and password/MFA fields.
const UserSchema = new Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Date },
  image: { type: String },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  // Credentials auth — never returned in queries by default
  passwordHash: { type: String, select: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const User = models.User || model("User", UserSchema);
