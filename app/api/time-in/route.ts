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
    let date: string;
    let timeIn: string;
    try {
      const body = await req.json().catch(() => ({}));
      if (body.time) {
        const timePart = parseTime(body.time);
        if (!timePart) {
          return NextResponse.json({ error: "Invalid time format (use HH:mm)" }, { status: 400 });
        }
        if (body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
          date = body.date;
        } else {
          const { date: d } = toLocalDateTime(now);
          date = d;
        }
        timeIn = `${date} ${timePart}`;
      } else {
        const dt = toLocalDateTime(now);
        date = dt.date;
        timeIn = dt.datetime;
      }
    } catch {
      const dt = toLocalDateTime(now);
      date = dt.date;
      timeIn = dt.datetime;
    }
    const existing = await query<{ id: number }[]>(
      "SELECT id FROM time_logs WHERE date = ? AND time_out IS NULL LIMIT 1",
      [date]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: "Already timed in today" }, { status: 400 });
    }
    await query(
      "INSERT INTO time_logs (date, time_in) VALUES (?, ?)",
      [date, timeIn]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to record time in" }, { status: 500 });
  }
}
