import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Location } from "@/lib/models/Location";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  await dbConnect();
  const locations = await Location.find({ userId: session.user?.id }).sort({ order: 1, createdAt: -1 });
  return NextResponse.json(locations);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  
  if (!session.user?.id) {
    console.error('Session user ID is missing:', session.user);
    return NextResponse.json(
      { error: "User ID not found in session" },
      { status: 400 }
    );
  }

  await dbConnect();
  const { name, description, color, icon } = await req.json();
  
  if (!name) {
    return NextResponse.json(
      { error: "Location name is required" },
      { status: 400 }
    );
  }
  
  // Get the highest order value to assign to the new location for this user
  const lastLocation = await Location.findOne({ userId: session.user.id }).sort({ order: -1 });
  const order = (lastLocation?.order || 0) + 1;
  
  const locationData = { 
    name, 
    description: description || "",
    color: color || "#3b82f6",
    icon: icon || "🌍",
    order, 
    userId: session.user.id 
  };
  
  try {
    const location = await Location.create(locationData);
    return NextResponse.json(location, { status: 201 });
  } catch (error: any) {
    console.error('Error creating location:', error);
    
    // Handle duplicate key error (unique constraint violation)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A location with this name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create location', details: error },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  await dbConnect();
  const { id, name, description, color, icon } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "Location ID is required" },
      { status: 400 }
    );
  }

  try {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;

    const location = await Location.findOneAndUpdate(
      { _id: id, userId: session.user?.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!location) {
      return NextResponse.json(
        { error: "Location not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(location);
  } catch (error: any) {
    console.error("Error updating location:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A location with this name already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  await dbConnect();
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "Location ID is required" },
      { status: 400 }
    );
  }

  try {
    // First check if there are any factories using this location
    const { Factory } = await import("@/lib/models/Factory");
    const factoriesCount = await Factory.countDocuments({ locationId: id, userId: session.user?.id });
    
    if (factoriesCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete location. ${factoriesCount} factories are still assigned to this location.` },
        { status: 409 }
      );
    }

    const location = await Location.findOneAndDelete({ 
      _id: id, 
      userId: session.user?.id 
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedLocation: location });
  } catch (err) {
    console.error("Error deleting location:", err);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 }
    );
  }
}
