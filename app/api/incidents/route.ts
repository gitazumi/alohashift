import { NextRequest, NextResponse } from "next/server";

export interface TrafficIncident {
  date: string;
  time: string;
  type: string;
  address: string;
  location?: string;
  area?: string;
  lat: number;
  lng: number;
  distanceKm: number;
}

interface GeocodingResult {
  lat: number;
  lng: number;
}

/**
 * Geocode an address using Google Maps Geocoding API.
 */
async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ", Honolulu, HI")}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status === "OK" && data.results?.[0]) {
    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
  }
  return null;
}

/**
 * Haversine distance between two lat/lng points (in km).
 */
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Minimum distance from point (lat, lng) to a line segment (A→B), in km.
 * Used to check if an incident is near the route corridor.
 */
function distanceToSegmentKm(
  lat: number, lng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number
): number {
  // Project to flat approximation (good enough for Oahu scale ~50km)
  const dx = bLng - aLng;
  const dy = bLat - aLat;
  if (dx === 0 && dy === 0) return haversineKm(lat, lng, aLat, aLng);
  const t = Math.max(0, Math.min(1, ((lng - aLng) * dx + (lat - aLat) * dy) / (dx * dx + dy * dy)));
  const projLat = aLat + t * dy;
  const projLng = aLng + t * dx;
  return haversineKm(lat, lng, projLat, projLng);
}

// Types to show as warnings (exclude parking complaints etc.)
const INCIDENT_TYPES_TO_SHOW = new Set([
  "MVC",
  "MVC Veh Towed",
  "MVC Fatal",
  "MVC Hit and Run",
  "MVC PI",             // personal injury
  "MVC w/ Injuries",
  "Collision",
  "Road Hazard",
  "Debris in Roadway",
  "Flooding",
]);

export async function POST(request: NextRequest) {
  try {
    const { origin, destination } = await request.json();

    if (!origin || !destination) {
      return NextResponse.json({ incidents: [] });
    }

    // ── 1. Geocode origin and destination in parallel ─────────────────────
    const [originGeo, destGeo] = await Promise.all([
      geocodeAddress(origin),
      geocodeAddress(destination),
    ]);

    if (!originGeo || !destGeo) {
      return NextResponse.json({ incidents: [], warning: "Could not geocode addresses" });
    }

    // ── 2. Fetch today's traffic incidents from Honolulu Open Data ────────
    // Filter to today's date in Hawaii (UTC-10)
    const HAWAII_OFFSET_MS = -10 * 60 * 60 * 1000;
    const nowHawaii = new Date(Date.now() + HAWAII_OFFSET_MS);
    const mm = String(nowHawaii.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(nowHawaii.getUTCDate()).padStart(2, "0");
    const yyyy = nowHawaii.getUTCFullYear();
    const todayStr = `${mm}/${dd}/${yyyy}`; // matches API format "02/23/2026"

    const socrataUrl =
      `https://data.honolulu.gov/resource/ykb6-n5th.json` +
      `?$where=date='${todayStr}'` +
      `&$limit=200` +
      `&$order=time+DESC`;

    const incidentRes = await fetch(socrataUrl, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 300 }, // cache 5 min
    });

    if (!incidentRes.ok) {
      return NextResponse.json({ incidents: [] });
    }

    const rawIncidents: TrafficIncident[] = await incidentRes.json();

    // ── 3. Geocode each incident address & filter by proximity to route ───
    // Route corridor = straight line origin→destination + 3 km buffer
    const ROUTE_BUFFER_KM = 3.0;

    // Geocode all incident addresses in parallel (batch with Promise.allSettled)
    type ResolvedIncident = TrafficIncident; // lat/lng/distanceKm are required

    const geocoded = await Promise.allSettled(
      rawIncidents
        .filter((inc) => {
          // Pre-filter: only relevant incident types
          const typeMatch = Array.from(INCIDENT_TYPES_TO_SHOW).some((t) =>
            inc.type?.toUpperCase().includes(t.toUpperCase()) ||
            t.toUpperCase().includes(inc.type?.toUpperCase() ?? "")
          );
          return typeMatch;
        })
        .map(async (inc): Promise<ResolvedIncident | null> => {
          const geo = await geocodeAddress(inc.address);
          if (!geo) return null;
          const dist = distanceToSegmentKm(
            geo.lat, geo.lng,
            originGeo.lat, originGeo.lng,
            destGeo.lat, destGeo.lng
          );
          if (dist > ROUTE_BUFFER_KM) return null;
          return {
            date: inc.date,
            time: inc.time,
            type: inc.type,
            address: inc.address,
            location: inc.location,
            area: inc.area,
            lat: geo.lat,
            lng: geo.lng,
            distanceKm: dist,
          };
        })
    );

    const nearby = geocoded
      .filter((r): r is PromiseFulfilledResult<ResolvedIncident | null> => r.status === "fulfilled")
      .map((r) => r.value)
      .filter((inc): inc is ResolvedIncident => inc !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json({ incidents: nearby });
  } catch (error) {
    console.error("Incidents API error:", error);
    return NextResponse.json({ incidents: [] });
  }
}
