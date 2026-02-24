import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dayOfWeek, departureTime, from, to, actualMinutes, alohaShiftMinutes, notes, email } = body;

    if (!from || !to || !actualMinutes || !departureTime) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const actual = parseFloat(actualMinutes);
    const predicted = alohaShiftMinutes ? parseFloat(alohaShiftMinutes) : null;
    const diff = predicted !== null ? Math.round(actual - predicted) : null;
    const diffPct = predicted !== null && predicted > 0
      ? Math.round(((actual - predicted) / predicted) * 100)
      : null;

    // ── 1. Save to Supabase ──────────────────────────────────────────────
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const { error: dbError } = await supabase
      .from("commute_reports")
      .insert({
        day_of_week: dayOfWeek,
        departure_time: departureTime,
        from_location: from,
        to_location: to,
        actual_minutes: actual,
        predicted_minutes: predicted,
        diff_minutes: diff,
        diff_pct: diffPct,
        notes: notes || null,
        email: email || null,
      });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      // Don't block — still send email even if DB fails
    }

    // ── 2. Send email notification via Resend ────────────────────────────
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "AlohaShift Community <onboarding@resend.dev>",
      to: "arensawa@gmail.com",
      replyTo: email || "noreply@alohashift.com",
      subject: `[AlohaShift Community] New commute report: ${from} → ${to}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #1e293b;">🚗 New Community Commute Report</h2>
          <p style="color:#64748b; font-size:13px;">Saved to Supabase ${dbError ? "❌ (DB error)" : "✅"}</p>

          <table style="width:100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr style="background:#f8fafc;">
              <td style="padding:8px 12px; color:#64748b; width:140px; font-weight:600;">Day</td>
              <td style="padding:8px 12px; color:#1e293b;">${dayOfWeek}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px; color:#64748b; font-weight:600;">Departure Time</td>
              <td style="padding:8px 12px; color:#1e293b;">${departureTime}</td>
            </tr>
            <tr style="background:#f8fafc;">
              <td style="padding:8px 12px; color:#64748b; font-weight:600;">From</td>
              <td style="padding:8px 12px; color:#1e293b;">${from}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px; color:#64748b; font-weight:600;">To</td>
              <td style="padding:8px 12px; color:#1e293b;">${to}</td>
            </tr>
            <tr style="background:#f8fafc;">
              <td style="padding:8px 12px; color:#64748b; font-weight:600;">Actual Time</td>
              <td style="padding:8px 12px; color:#1e293b; font-weight:bold;">${actual} min</td>
            </tr>
            <tr>
              <td style="padding:8px 12px; color:#64748b; font-weight:600;">AlohaShift Predicted</td>
              <td style="padding:8px 12px; color:#1e293b;">${predicted !== null ? `${predicted} min` : "Not provided"}</td>
            </tr>
            ${diff !== null ? `
            <tr style="background:${diff > 5 ? "#fef2f2" : diff < -5 ? "#eff6ff" : "#f0fdf4"};">
              <td style="padding:8px 12px; color:#64748b; font-weight:600;">Difference</td>
              <td style="padding:8px 12px; font-weight:bold; color:${diff > 5 ? "#dc2626" : diff < -5 ? "#2563eb" : "#16a34a"};">
                ${diff > 0 ? "+" : ""}${diff} min (${diff > 0 ? "+" : ""}${diffPct}%)
                ${diff > 5 ? " — underestimated" : diff < -5 ? " — overestimated" : " — Good match!"}
              </td>
            </tr>
            ` : ""}
            ${notes ? `
            <tr style="background:#f8fafc;">
              <td style="padding:8px 12px; color:#64748b; font-weight:600;">Notes</td>
              <td style="padding:8px 12px; color:#1e293b;">${notes}</td>
            </tr>
            ` : ""}
            ${email ? `
            <tr>
              <td style="padding:8px 12px; color:#64748b; font-weight:600;">Email</td>
              <td style="padding:8px 12px; color:#1e293b;">${email}</td>
            </tr>
            ` : ""}
          </table>

          <p style="font-size:12px; color:#94a3b8;">
            View all reports: supabase.com/dashboard/project/jftakglxbywzmwhwhsvo/editor
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Community API error:", error);
    return NextResponse.json({ error: "Failed to submit." }, { status: 500 });
  }
}
