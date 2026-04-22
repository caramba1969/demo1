import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Otp } from "@/lib/models/Otp";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/signin?error=missing-token", req.url));
  }

  await dbConnect();

  const otp = await Otp.findOne({
    code: token,
    type: "verify-email",
    expiresAt: { $gt: new Date() },
  });

  if (!otp) {
    return NextResponse.redirect(new URL("/auth/signin?error=invalid-token", req.url));
  }

  await User.findOneAndUpdate(
    { email: otp.email },
    { emailVerified: new Date() }
  );

  // Consume the token
  await Otp.deleteOne({ _id: otp._id });

  return NextResponse.redirect(new URL("/auth/signin?verified=1", req.url));
}
