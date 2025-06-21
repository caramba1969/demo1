import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Factory } from "@/lib/models/Factory";

export async function GET() {
  await dbConnect();
  const factories = await Factory.find().sort({ createdAt: -1 });
  return NextResponse.json(factories);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const { name } = await req.json();
  const factory = await Factory.create({ name });
  return NextResponse.json(factory, { status: 201 });
}
