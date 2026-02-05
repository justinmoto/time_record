import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isCompleted, task } = body;

    const updates: string[] = [];
    const values: unknown[] = [];

    if (task !== undefined) {
      if (typeof task !== "string" || !task.trim()) {
        return NextResponse.json({ error: "Task cannot be empty" }, { status: 400 });
      }
      updates.push("task = ?");
      values.push(task.trim());
    }

    if (isCompleted !== undefined) {
      const now = new Date();
      const completedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      updates.push("is_completed = ?", "completed_at = ?");
      values.push(isCompleted ? 1 : 0, isCompleted ? completedAt : null);
    }

    if (updates.length > 0) {
      values.push(id);
      await query(`UPDATE todos SET ${updates.join(", ")} WHERE id = ?`, values);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query("DELETE FROM todos WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
  }
}
