import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Otp } from "@/lib/models/Otp";
import { sendOtpEmail } from "@/lib/email";

function generateCode(): string {
  // Cryptographically random 6-digit code
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, "0");
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  await dbConnect();

  // Always do a bcrypt compare (even against a dummy hash) to prevent timing attacks
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  const dummyHash = "$2b$12$invalidhashforenumerationprotection000000000000000000000";
  const hashToCompare = user?.passwordHash ?? dummyHash;
  const valid = await bcrypt.compare(password, hashToCompare);

  if (!valid || !user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!user.emailVerified) {
    return NextResponse.json({ error: "Please verify your email before signing in." }, { status: 403 });
  }

  // Delete any existing login OTPs for this email before creating a new one
  await Otp.deleteMany({ email: email.toLowerCase(), type: "login" });

  const code = generateCode();
  await Otp.create({
    email: email.toLowerCase(),
    code,
    type: "login",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  });

  try {
    await sendOtpEmail(email.toLowerCase(), code);
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return NextResponse.json({ error: "Failed to send verification code. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ sent: true });
}
