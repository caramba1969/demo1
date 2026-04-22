import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Otp } from "@/lib/models/Otp";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const normalised = email.toLowerCase().trim();

  // Always return success to prevent email enumeration
  await dbConnect();

  const user = await User.findOne({ email: normalised }).select("+passwordHash");

  // Only send a reset link for credential accounts (those with a passwordHash)
  if (user?.passwordHash) {
    // Delete any prior reset tokens before creating a new one (rate-limit via replacement)
    await Otp.deleteMany({ email: normalised, type: "reset-password" });

    const token = crypto.randomBytes(32).toString("hex");
    await Otp.create({
      email: normalised,
      code: token,
      type: "reset-password",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    try {
      await sendPasswordResetEmail(normalised, token);
    } catch (err) {
      console.error("Failed to send password reset email:", err);
      // Still return success to avoid leaking info
    }
  }

  return NextResponse.json({ sent: true });
}
