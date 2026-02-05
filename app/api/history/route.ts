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
      const totalHours = computeHours(r.time_in, r.time_out);
      return {
        date: dateFormatted,
        dateRaw: dateStr,
        timeIn: formatTime(r.time_in),
        timeOut: r.time_out ? formatTime(r.time_out) : "-",
        totalHours: totalHours ?? "-",
        totalHoursDisplay: totalHours != null ? formatHoursDisplay(totalHours) : "-",
      };
    });
    return NextResponse.json(formatted);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

function parseLocalDateTime(val: string | Date): Date | null {
  if (!val) return null;
  let str: string;
  if (typeof val === "string") {
    str = val.replace(" ", "T").slice(0, 19);
  } else {
    const d = val as Date;
    str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  }
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]), parseInt(m[4]), parseInt(m[5]), parseInt(m[6] ?? "0"));
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function formatTime(val: string | Date): string {
  const d = parseLocalDateTime(val);
  if (!d) return "-";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function computeHours(timeIn: string | Date | null, timeOut: string | Date | null): number | null {
  if (!timeIn || !timeOut) return null;
  const start = parseLocalDateTime(timeIn);
  const end = parseLocalDateTime(timeOut);
  if (!start || !end) return null;
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

function formatHoursDisplay(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}hrs`;
  return `${h}hrs ${m}mins`;
}
