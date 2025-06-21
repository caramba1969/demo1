import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import { Factory } from "@/lib/models/Factory";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { text } = await req.json();
  const { id } = await params;

  if (!text?.trim()) {
    return NextResponse.json(
      { error: "Task text is required" },
      { status: 400 }
    );
  }

  try {
    const taskId = Date.now().toString();
    const factory = await Factory.findByIdAndUpdate(
      id,
      {
        $push: {
          tasks: {
            id: taskId,
            text: text.trim(),
            completed: false,
            createdAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!factory) {
      return NextResponse.json(
        { error: "Factory not found" },
        { status: 404 }
      );
    }

    const newTask = factory.tasks.find((task: { id: string }) => task.id === taskId);
    return NextResponse.json(newTask, { status: 201 });
  } catch (err) {
    console.error("Error adding task:", err);
    return NextResponse.json(
      { error: "Failed to add task" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { taskId, completed } = await req.json();
  const { id } = await params;

  try {
    const factory = await Factory.findByIdAndUpdate(
      id,
      {
        $set: {
          "tasks.$[task].completed": completed
        }
      },
      {
        arrayFilters: [{ "task.id": taskId }],
        new: true,
        runValidators: true
      }
    );

    if (!factory) {
      return NextResponse.json(
        { error: "Factory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating task:", err);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { taskId } = await req.json();
  const { id } = await params;

  try {
    const factory = await Factory.findByIdAndUpdate(
      id,
      {
        $pull: {
          tasks: { id: taskId }
        }
      },
      { new: true, runValidators: true }
    );

    if (!factory) {
      return NextResponse.json(
        { error: "Factory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting task:", err);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
