import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";

type AuthResult =
  | { session: Session; error: null }
  | { session: null; error: NextResponse };

/**
 * Validates the session and optionally enforces a minimum role.
 *
 * Usage in an API route:
 *   const { session, error } = await requireAuth('admin');
 *   if (error) return error;
 */
export async function requireAuth(
  role?: "admin" | "user"
): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
    };
  }

  if (role === "admin" && session.user.role !== "admin") {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Forbidden: admin access required" },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}
