import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

// GET /api/admin/users — list all users
export async function GET() {
  const { error } = await requireAuth("admin");
  if (error) return error;

  await dbConnect();

  const users = await User.find({})
    .select("name email image role createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(users);
}
