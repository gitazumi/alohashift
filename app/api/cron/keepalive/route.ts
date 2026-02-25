import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Vercel Cron Job — runs daily at 8:00 AM UTC (10:00 PM HST previous day)
// Purpose:
//   1. Keep the Supabase project active (free tier pauses after 1 week of inactivity)
//   2. Keep the Vercel serverless functions warm
//   3. Return basic DB stats for monitoring

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verify this request is from Vercel Cron (not a random visitor)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Ping Supabase: count total reports and get latest entry
    const { count, error } = await supabase
      .from("commute_reports")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    const elapsed = Date.now() - startedAt;

    console.log(`[cron/keepalive] OK — ${count} reports in DB, ${elapsed}ms`);

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      db: {
        reportsTotal: count,
        responseMs: elapsed,
      },
    });
  } catch (err) {
    console.error("[cron/keepalive] ERROR:", err);
    return NextResponse.json(
      { ok: false, error: String(err), timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
