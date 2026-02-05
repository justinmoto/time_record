import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function toLocalDateTime(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return { date: `${y}-${m}-${day}`, datetime: `${y}-${m}-${day} ${h}:${min}:${s}` };
}

export async function POST() {
  try {
    const now = new Date();
    const { date: today, datetime: timeOut } = toLocalDateTime(now);
    const rows = await query<{ id: number; time_in: Date }[]>(
      "SELECT id, time_in FROM time_logs WHERE date = ? AND time_out IS NULL ORDER BY time_in DESC LIMIT 1",
      [today]
    );
    const log = rows[0];
    if (!log) {
      return NextResponse.json({ error: "No active time in found" }, { status: 400 });
    }
    const timeIn = new Date(log.time_in);
    const totalHours = Math.round(((now.getTime() - timeIn.getTime()) / (1000 * 60 * 60)) * 100) / 100;
    await query(
      "UPDATE time_logs SET time_out = ?, total_hours = ? WHERE id = ?",
      [timeOut, totalHours, log.id]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to record time out" }, { status: 500 });
  }
}
