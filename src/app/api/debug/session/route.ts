import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      authenticated: !!session,
      session: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          image: session.user?.image
        },
        expires: session.expires
      } : null,
      debug: {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasUserId: !!session?.user?.id,
        userIdType: typeof session?.user?.id,
        userIdValue: session?.user?.id
      }
    });

  } catch (error: any) {
    console.error('Error in session check:', error);
    return NextResponse.json(
      { 
        error: 'Session check failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
