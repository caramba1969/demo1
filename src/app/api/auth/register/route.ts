import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Otp } from "@/lib/models/Otp";
import { sendVerifyEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  await dbConnect();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    // Always return 201 to prevent email enumeration
    return NextResponse.json({ message: "If that email is new, a verification link has been sent." }, { status: 201 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    email: email.toLowerCase(),
    name: name ?? email.split("@")[0],
    passwordHash,
    emailVerified: null,
    role: "user",
  });

  // Store a 24h verify token in the Otp collection (reusing infrastructure)
  const token = crypto.randomBytes(32).toString("hex");
  await Otp.create({
    email: email.toLowerCase(),
    code: token,
    type: "verify-email",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  try {
    await sendVerifyEmail(email.toLowerCase(), token);
  } catch (err) {
    console.error("Failed to send verification email:", err);
    // Don't fail registration if email fails — user can request resend later
  }

  // Clean up passwordHash from response
  const safeUser = { id: user._id.toString(), email: user.email, name: user.name };
  return NextResponse.json({ message: "Account created. Please check your email to verify.", user: safeUser }, { status: 201 });
}
