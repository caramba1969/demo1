import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongodb";
import { Location } from "@/lib/models/Location";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  await dbConnect();
  const { locations } = await req.json();

  if (!Array.isArray(locations)) {
    return NextResponse.json(
      { error: "Locations array is required" },
      { status: 400 }
    );
  }

  try {
    // Update the order for each location
    const updatePromises = locations.map((location: { id: string; order: number }) =>
      Location.findOneAndUpdate(
        { _id: location.id, userId: session.user?.id },
        { order: location.order },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error reordering locations:", err);
    return NextResponse.json(
      { error: "Failed to reorder locations" },
      { status: 500 }
    );
  }
}
