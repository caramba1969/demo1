import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongodb";
import { Factory } from "@/lib/models/Factory";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );  }

  await dbConnect();
  const factories = await Factory.find({ userId: session.user?.id }).sort({ order: 1, createdAt: -1 });
  return NextResponse.json(factories);
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
  const { name } = await req.json();
  
  // Get the highest order value to assign to the new factory for this user
  const lastFactory = await Factory.findOne({ userId: session.user.id }).sort({ order: -1 });
  const order = (lastFactory?.order || 0) + 1;
  
  const factoryData = { 
    name, 
    order, 
    userId: session.user.id 
  };
  
  try {
    const factory = await Factory.create(factoryData);
    return NextResponse.json(factory, { status: 201 });
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
  const { id, name } = await req.json();

  if (!id || !name) {
    return NextResponse.json(
      { error: "Factory ID and name are required" },
      { status: 400 }
    );
  }

  try {
    const factory = await Factory.findOneAndUpdate(
      { _id: id, userId: session.user?.id },
      { name },
      { new: true, runValidators: true }
    );

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
