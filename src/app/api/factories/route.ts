import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/mongodb";
import { Location } from "@/lib/models/Location";
import { Factory } from "@/lib/models/Factory";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  await dbConnect();
  
  try {
    // Get factories without population first to avoid the Location model issue
    const factories = await Factory.find({ userId: session.user?.id })
      .sort({ order: 1, createdAt: -1 });
    
    // If there are factories with locationId, manually populate them
    const factoriesWithLocations = await Promise.all(
      factories.map(async (factory) => {
        if (factory.locationId) {
          try {
            const location = await Location.findById(factory.locationId)
              .select('name color icon');
            return {
              ...factory.toObject(),
              locationId: location
            };
          } catch (error) {
            console.error('Error fetching location:', error);
            return factory.toObject();
          }
        }
        return factory.toObject();
      })
    );
    
    return NextResponse.json(factoriesWithLocations);
  } catch (error) {
    console.error('Error fetching factories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch factories' },
      { status: 500 }
    );
  }
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
  const { name, locationId } = await req.json();
  
  // Get the highest order value to assign to the new factory for this user
  const lastFactory = await Factory.findOne({ userId: session.user.id }).sort({ order: -1 });
  const order = (lastFactory?.order || 0) + 1;
  
  const factoryData: any = { 
    name, 
    order, 
    userId: session.user.id 
  };
  
  // Add locationId if provided
  if (locationId) {
    factoryData.locationId = locationId;
  }
  
  try {
    const factory = await Factory.create(factoryData);
    const populatedFactory = await Factory.findById(factory._id).populate('locationId', 'name color icon');
    return NextResponse.json(populatedFactory, { status: 201 });
  } catch (error) {
    console.error('Error creating factory:', error);
    return NextResponse.json(
      { error: 'Failed to create factory', details: error },
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
  const { id, name, locationId } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "Factory ID is required" },
      { status: 400 }
    );
  }

  try {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (locationId !== undefined) updateData.locationId = locationId || null; // Allow clearing location

    const factory = await Factory.findOneAndUpdate(
      { _id: id, userId: session.user?.id },
      updateData,
      { new: true, runValidators: true }
    ).populate('locationId', 'name color icon');

    if (!factory) {
      return NextResponse.json(
        { error: "Factory not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json(factory);
  } catch (err) {
    console.error("Error updating factory:", err);
    return NextResponse.json(
      { error: "Failed to update factory" },
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
      { error: "Factory ID is required" },
      { status: 400 }
    );
  }

  try {
    const factory = await Factory.findOneAndDelete({ 
      _id: id, 
      userId: session.user?.id 
    });

    if (!factory) {
      return NextResponse.json(
        { error: "Factory not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedFactory: factory });
  } catch (err) {
    console.error("Error deleting factory:", err);
    return NextResponse.json(
      { error: "Failed to delete factory" },
      { status: 500 }
    );
  }
}
