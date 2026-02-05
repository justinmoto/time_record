import { NextResponse } from "next/server";
import { query } from "@/lib/db";

type TimeLog = {
  date: string;
  time_in: string;
  time_out: string | null;
  total_hours: number | null;
};

export async function GET() {
  try {
    const rows = await query<TimeLog[]>(
      "SELECT date, time_in, time_out, total_hours FROM time_logs ORDER BY date DESC, time_in DESC LIMIT 50"
    );
    const formatted = rows.map((r) => {
      const timeInStr = typeof r.time_in === "string" ? r.time_in : (r.time_in as unknown as Date).toISOString?.() ?? "";
      const dateStr = timeInStr.slice(0, 10);
      const d = new Date(dateStr + "T12:00:00");
      const dateFormatted = isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      return {
        date: dateFormatted,
        dateRaw: dateStr,
        timeIn: formatTime(r.time_in),
        timeOut: r.time_out ? formatTime(r.time_out) : "-",
        totalHours: r.total_hours ?? "-",
      };
    });
    return NextResponse.json(formatted);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

function formatTime(val: string | Date): string {
  const d = typeof val === "string" ? new Date(val) : val;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
