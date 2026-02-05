import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const rows = await query<{ id: number; time_out: Date | null }[]>(
      "SELECT id, time_out FROM time_logs WHERE date = ? ORDER BY time_in DESC LIMIT 1",
      [today]
    );
    const last = rows[0];
    const timedIn = !!last && !last.time_out;
    return NextResponse.json({ timedIn, logId: last?.id ?? null });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
