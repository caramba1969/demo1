import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { dbConnect } from "@/lib/mongodb";
import { Factory } from "@/lib/models/Factory";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  await dbConnect();
  const { text } = await req.json();
  const { id } = await params;

  if (!text?.trim()) {
    return NextResponse.json(
      { error: "Note text is required" },
      { status: 400 }
    );
  }

  try {
    const noteId = Date.now().toString();
    const factory = await Factory.findOneAndUpdate(
      { _id: id, userId: session.user?.id },
      {
        $push: {
          notes: {
            id: noteId,
            text: text.trim(),
            createdAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!factory) {
      return NextResponse.json(
        { error: "Factory not found or access denied" },
        { status: 404 }
      );
    }

    const newNote = factory.notes.find((note: { id: string }) => note.id === noteId);
    return NextResponse.json(newNote, { status: 201 });
  } catch (err) {
    console.error("Error adding note:", err);
    return NextResponse.json(
      { error: "Failed to add note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  await dbConnect();
  const { noteId } = await req.json();
  const { id } = await params;

  try {
    const factory = await Factory.findOneAndUpdate(
      { _id: id, userId: session.user?.id },
      {
        $pull: {
          notes: { id: noteId }
        }
      },
      { new: true, runValidators: true }
    );

    if (!factory) {
      return NextResponse.json(
        { error: "Factory not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting note:", err);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
