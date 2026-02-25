import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { origin, destination } = await request.json();

    if (!origin || !destination) {
      return NextResponse.json({ error: "origin and destination are required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Maps API key not configured" }, { status: 500 });
    }

    // Google Directions API — fetch encoded overview polyline
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destination)}` +
      `&mode=driving` +
      `&key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Directions API error" }, { status: 502 });
    }

    const data = await res.json();

    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      return NextResponse.json({ error: "No route found" }, { status: 404 });
    }

    const polyline = data.routes[0].overview_polyline?.points;
    if (!polyline) {
      return NextResponse.json({ error: "No polyline in response" }, { status: 404 });
    }

    return NextResponse.json({ polyline });
  } catch (err) {
    console.error("route-polyline error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
