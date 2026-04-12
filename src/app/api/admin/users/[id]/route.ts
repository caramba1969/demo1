import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

// PATCH /api/admin/users/[id] — update a user's role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth("admin");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { role } = body as { role?: string };

  if (!role || !["admin", "user"].includes(role)) {
    return NextResponse.json(
      { error: 'Invalid role. Must be "admin" or "user".' },
      { status: 400 }
    );
  }

  // Prevent admin from downgrading themselves
  if (session.user.id === id && role !== "admin") {
    return NextResponse.json(
      { error: "You cannot remove your own admin role." },
      { status: 400 }
    );
  }

  await dbConnect();

  const user = await User.findByIdAndUpdate(
    id,
    { role, updatedAt: new Date() },
    { new: true, runValidators: true }
  ).select("name email image role");

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json(user);
}
