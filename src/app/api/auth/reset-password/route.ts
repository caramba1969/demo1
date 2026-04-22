import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Otp } from "@/lib/models/Otp";

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json();

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
  }
  if (!newPassword || typeof newPassword !== "string") {
    return NextResponse.json({ error: "New password is required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  await dbConnect();

  const otp = await Otp.findOne({
    code: token,
    type: "reset-password",
    expiresAt: { $gt: new Date() },
  });

  if (!otp) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const user = await User.findOne({ email: otp.email });
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await User.updateOne({ _id: user._id }, { passwordHash, updatedAt: new Date() });

  // Single-use — consume immediately
  await Otp.deleteOne({ _id: otp._id });

  return NextResponse.json({ ok: true });
}
