import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Factory } from "@/lib/models/Factory";

export async function GET() {
  await dbConnect();
  const factories = await Factory.find().sort({ order: 1, createdAt: -1 });
  return NextResponse.json(factories);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const { name } = await req.json();
  
  // Get the highest order value to assign to the new factory
  const lastFactory = await Factory.findOne().sort({ order: -1 });
  const order = (lastFactory?.order || 0) + 1;
  
  const factory = await Factory.create({ name, order });
  return NextResponse.json(factory, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  await dbConnect();
  const { id, name } = await req.json();

  if (!id || !name) {
    return NextResponse.json(
      { error: "Factory ID and name are required" },
      { status: 400 }
    );
  }

  try {
    const factory = await Factory.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!factory) {
      return NextResponse.json(
        { error: "Factory not found" },
        { status: 404 }
      );
    }    return NextResponse.json(factory);
  } catch (err) {
    console.error("Error updating factory:", err);
    return NextResponse.json(
      { error: "Failed to update factory" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  await dbConnect();
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "Factory ID is required" },
      { status: 400 }
    );
  }

  try {
    const factory = await Factory.findByIdAndDelete(id);

    if (!factory) {
      return NextResponse.json(
        { error: "Factory not found" },
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
