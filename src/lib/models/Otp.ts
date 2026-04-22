import { Schema, models, model } from "mongoose";

export type OtpType = "login" | "verify-email" | "reset-password" | "credential-token";

const OtpSchema = new Schema({
  email: { type: String, required: true, index: true },
  code: { type: String, required: true },
  type: {
    type: String,
    enum: ["login", "verify-email", "reset-password", "credential-token"],
    required: true,
  },
  // MongoDB will auto-delete documents when expiresAt is reached (TTL index)
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export const Otp = models.Otp || model("Otp", OtpSchema);
