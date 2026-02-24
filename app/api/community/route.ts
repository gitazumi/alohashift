import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// ── Route segment extraction ─────────────────────────────────────────────────
//
// Calls Google Directions API and extracts the highway/road names used.
// This allows cross-route data reuse: a report from Ewa Beach → Downtown
// shares H1 segment data with Kapolei → UH Manoa, improving accuracy for
// all routes that use the same corridors.

interface DirectionsRoute {
  legs: {
    steps: {
      html_instructions: string;
      distance: { value: number };
    }[];
  }[];
}

interface DirectionsResponse {
  status: string;
  routes: DirectionsRoute[];
}

const OAHU_CORRIDORS = [
  { pattern: /\bH-?1\b/i,                label: "H1" },
  { pattern: /\bH-?2\b/i,                label: "H2" },
  { pattern: /\bH-?3\b/i,                label: "H3" },
  { pattern: /pali\s+hwy|pali\s+highway/i, label: "Pali Highway" },
  { pattern: /likelike\s+hwy|likelike\s+highway/i, label: "Likelike Highway" },
  { pattern: /kalanianaole\s+hwy|kalanianaole\s+highway|72/i, label: "Kalanianaole Highway" },
  { pattern: /kamehameha\s+hwy|kamehameha\s+highway|99/i, label: "Kamehameha Highway" },
  { pattern: /moanalua\s+fwy|moanalua\s+freeway/i, label: "Moanalua Freeway" },
  { pattern: /nimitz\s+hwy|nimitz\s+highway/i, label: "Nimitz Highway" },
  { pattern: /queen\s+ka['']ahumanu|queen\s+kaahumanu/i, label: "Queen Kaahumanu Highway" },
  { pattern: /farrington\s+hwy|farrington\s+highway/i, label: "Farrington Highway" },
  { pattern: /wilikina\s+dr|wilikina\s+drive/i, label: "Wilikina Drive" },
];

async function fetchRouteSegments(
  origin: string,
  destination: string,
  apiKey: string
): Promise<string[]> {
  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  const data: DirectionsResponse = await res.json();

  if (data.status !== "OK" || !data.routes[0]) return [];

  // Collect all step instructions and road names
  const allText = data.routes[0].legs
    .flatMap(leg => leg.steps)
    .map(step => step.html_instructions)
    .join(" ");

  // Strip HTML tags
  const plainText = allText.replace(/<[^>]+>/g, " ");

  // Match against known Oahu corridors
  const segments = new Set<string>();
  for (const corridor of OAHU_CORRIDORS) {
    if (corridor.pattern.test(plainText)) {
      segments.add(corridor.label);
    }
  }

  return Array.from(segments);
}

// ── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dayOfWeek, departureTime, from, to, actualMinutes, alohaShiftMinutes, notes } = body;

    if (!from || !to || !actualMinutes || !departureTime) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const actual = parseFloat(actualMinutes);

    if (isNaN(actual) || actual < 5 || actual > 240) {
      return NextResponse.json(
        { error: "Travel time must be between 5 and 240 minutes." },
        { status: 400 }
      );
    }

    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "Departure and destination must be different." },
        { status: 400 }
      );
    }
    const predicted = alohaShiftMinutes ? parseFloat(alohaShiftMinutes) : null;
    const diff = predicted !== null ? Math.round(actual - predicted) : null;
    const diffPct = predicted !== null && predicted > 0
      ? Math.round(((actual - predicted) / predicted) * 100)
      : null;

    // ── 1. Fetch route segments in background (non-blocking for user) ─────
    const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? "";
    let routeSegments: string[] = [];
    try {
      if (apiKey && apiKey !== "your_api_key_here") {
        routeSegments = await fetchRouteSegments(from, to, apiKey);
      }
    } catch (segErr) {
      console.warn("Route segment fetch failed (non-blocking):", segErr);
    }

    // ── 2. Save to Supabase ───────────────────────────────────────────────
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
        route_segments: routeSegments,
      });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
    }

    // ── 3. Send email notification via Resend ─────────────────────────────
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "AlohaShift Community <onboarding@resend.dev>",
      to: "arensawa@gmail.com",
      replyTo: "noreply@alohashift.com",
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
              <td style="padding:8px 12px; color:#64748b; font-weight:600;">Route Segments</td>
              <td style="padding:8px 12px; color:#1e293b;">${routeSegments.length > 0 ? routeSegments.join(", ") : "—"}</td>
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
