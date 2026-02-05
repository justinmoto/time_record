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
    const { date, datetime: timeIn } = toLocalDateTime(now);
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
