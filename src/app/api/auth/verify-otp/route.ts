import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/mongodb";
import { Otp } from "@/lib/models/Otp";

export async function POST(req: NextRequest) {
  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
  }

  await dbConnect();

  const otp = await Otp.findOne({
    email: email.toLowerCase(),
    type: "login",
    expiresAt: { $gt: new Date() },
  });

  if (!otp || otp.code !== code.trim()) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
  }

  // Consume the OTP immediately (single-use)
  await Otp.deleteOne({ _id: otp._id });

  // Issue a short-lived verified token (2 minutes) so the client can complete signIn()
  const verifiedToken = crypto.randomBytes(32).toString("hex");
  await Otp.create({
    email: email.toLowerCase(),
    code: verifiedToken,
    type: "credential-token",
    expiresAt: new Date(Date.now() + 2 * 60 * 1000),
  });

  return NextResponse.json({ verifiedToken });
}
