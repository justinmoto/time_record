import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function formatDate(val: Date | string): string {
  const d = typeof val === "string" ? new Date(val) : val;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function GET() {
  try {
    const rows = await query<{ id: number; task: string; is_completed: number; completed_at: Date | string | null }[]>(
      "SELECT id, task, is_completed, completed_at FROM todos ORDER BY created_at ASC"
    );
    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        task: r.task,
        isCompleted: !!r.is_completed,
        completedAt: r.completed_at ? formatDate(r.completed_at) : null,
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { task } = await request.json();
    if (!task || typeof task !== "string" || !task.trim()) {
      return NextResponse.json({ error: "Task is required" }, { status: 400 });
    }
    const result = await query<{ insertId: number }>(
      "INSERT INTO todos (task) VALUES (?)",
      [task.trim()]
    );
    const insertId = (result as { insertId: number })?.insertId;
    return NextResponse.json({ success: true, id: insertId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add todo" }, { status: 500 });
  }
}
