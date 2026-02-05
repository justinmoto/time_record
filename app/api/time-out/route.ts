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

function parseTime(timeStr: string): string {
  const m = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return "";
  const h = String(parseInt(m[1], 10)).padStart(2, "0");
  const min = String(parseInt(m[2], 10)).padStart(2, "0");
  const s = m[3] ? String(parseInt(m[3], 10)).padStart(2, "0") : "00";
  return `${h}:${min}:${s}`;
}

export async function POST(req: Request) {
  try {
    const now = new Date();
    const { date: today } = toLocalDateTime(now);
    let timeOut: string;
    try {
      const body = await req.json().catch(() => ({}));
      if (body.time) {
        const timePart = parseTime(body.time);
        if (!timePart) {
          return NextResponse.json({ error: "Invalid time format (use HH:mm)" }, { status: 400 });
        }
        timeOut = `${today} ${timePart}`;
      } else {
        const { datetime } = toLocalDateTime(now);
        timeOut = datetime;
      }
    } catch {
      const { datetime } = toLocalDateTime(now);
      timeOut = datetime;
    }
    const rows = await query<{ id: number; time_in: Date }[]>(
      "SELECT id, time_in FROM time_logs WHERE date = ? AND time_out IS NULL ORDER BY time_in DESC LIMIT 1",
      [today]
    );
    const log = rows[0];
    if (!log) {
      return NextResponse.json({ error: "No active time in found" }, { status: 400 });
    }
    const timeIn = new Date(log.time_in);
    const timeOutDate = new Date(timeOut);
    const totalHours = Math.round(((timeOutDate.getTime() - timeIn.getTime()) / (1000 * 60 * 60)) * 100) / 100;
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
