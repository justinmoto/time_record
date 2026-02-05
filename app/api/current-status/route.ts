import { NextResponse } from "next/server";
import { query } from "@/lib/db";

function toLocalDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const today = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : toLocalDateStr(new Date());
    const rows = await query<{ id: number; time_out: Date | null }[]>(
      "SELECT id, time_out FROM time_logs WHERE date = ? ORDER BY time_in DESC LIMIT 1",
      [today]
    );
    const last = rows[0];
    const timedIn = !!last && (last.time_out === null || last.time_out === undefined);
    return NextResponse.json({ timedIn, logId: last?.id ?? null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
