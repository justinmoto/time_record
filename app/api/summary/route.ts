import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function toLocalDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET() {
  try {
    const now = new Date();
    const today = toLocalDateStr(now);
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekStartStr = toLocalDateStr(weekStart);
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    const todayRows = await query<{ total: number }[]>(
      "SELECT COALESCE(SUM(ROUND(TIMESTAMPDIFF(SECOND, time_in, time_out) / 3600, 2)), 0) as total FROM time_logs WHERE date = ? AND time_out IS NOT NULL",
      [today]
    );
    const weekRows = await query<{ total: number }[]>(
      "SELECT COALESCE(SUM(ROUND(TIMESTAMPDIFF(SECOND, time_in, time_out) / 3600, 2)), 0) as total FROM time_logs WHERE date >= ? AND date <= ? AND time_out IS NOT NULL",
      [weekStartStr, today]
    );
    const monthRows = await query<{ total: number }[]>(
      "SELECT COALESCE(SUM(ROUND(TIMESTAMPDIFF(SECOND, time_in, time_out) / 3600, 2)), 0) as total FROM time_logs WHERE date >= ? AND date <= ? AND time_out IS NOT NULL",
      [monthStart, today]
    );
    const totalRows = await query<{ total: number }[]>(
      "SELECT COALESCE(SUM(ROUND(TIMESTAMPDIFF(SECOND, time_in, time_out) / 3600, 2)), 0) as total FROM time_logs WHERE time_out IS NOT NULL"
    );

    const todayTotal = Number(todayRows[0]?.total ?? 0);
    const weekTotal = Number(weekRows[0]?.total ?? 0);
    const monthTotal = Number(monthRows[0]?.total ?? 0);
    const total = Number(totalRows[0]?.total ?? 0);

    return NextResponse.json({
      today: Number(todayTotal),
      week: Number(weekTotal),
      month: Number(monthTotal),
      total: Number(total),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
