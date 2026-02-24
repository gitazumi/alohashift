import { NextRequest, NextResponse } from "next/server";
import type { ETAResult, ETAResponse } from "@/types";

interface DistanceMatrixElement {
  status: string;
  duration?: { value: number; text: string };
  duration_in_traffic?: { value: number; text: string };
}

interface DistanceMatrixRow {
  elements: DistanceMatrixElement[];
}

interface DistanceMatrixResponse {
  status: string;
  rows: DistanceMatrixRow[];
}

/**
 * Honolulu Reality Correction
 *
 * Google Maps Distance Matrix API consistently underestimates travel times
 * across all Oahu routes (H1, Pali Highway, Likelike, H3, Kamehameha Hwy, etc.)
 * during peak hours. Based on real commute data:
 *   160 Polihale Pl → Mid-Pacific Institute, 6:53 AM departure
 *   → actual 62 min vs Google predicted 30 min (duration_in_traffic)
 *
 * We apply a single time-of-day multiplier directly to duration_in_traffic.
 *
 * Correction factors:
 *   Early AM  (5:00–6:29): ×1.3  — light but building traffic
 *   Peak AM   (6:30–8:59): ×1.9  — heavily congested across all routes
 *   Mid AM    (9:00–10:59): ×1.4  — post-peak, still slow
 *   Midday   (11:00–14:59): ×1.1  — near free-flow
 *   Early PM (15:00–16:29): ×1.3  — building again
 *   Peak PM  (16:30–18:59): ×1.7  — afternoon rush
 *   Evening  (19:00+):      ×1.1  — light traffic
 */
function getHawaiiRealityMultiplier(departureTimestamp: number): number {
  // Convert UTC timestamp to Hawaii hour (UTC-10)
  const hawaiiHour = ((Math.floor(departureTimestamp / 3600) - 10) % 24 + 24) % 24;
  const hawaiiMinute = Math.floor((departureTimestamp % 3600) / 60);
  const fractionalHour = hawaiiHour + hawaiiMinute / 60;

  if (fractionalHour >= 6.5 && fractionalHour < 9.0)  return 1.9;  // AM peak
  if (fractionalHour >= 16.5 && fractionalHour < 19.0) return 1.7;  // PM peak
  if (fractionalHour >= 9.0 && fractionalHour < 11.0)  return 1.4;  // post-AM peak
  if (fractionalHour >= 15.0 && fractionalHour < 16.5) return 1.3;  // pre-PM peak
  if (fractionalHour >= 5.0 && fractionalHour < 6.5)   return 1.3;  // early AM
  return 1.1;  // midday / evening
}

function formatTime(timestamp: number): string {
  // Always display in Hawaii Standard Time (UTC-10)
  const hawaiiOffsetMs = -10 * 60 * 60 * 1000;
  const hawaiiMs = timestamp * 1000 + hawaiiOffsetMs;
  const date = new Date(hawaiiMs);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, departureTimes } = body as {
      origin: string;
      destination: string;
      departureTimes: number[];
    };

    if (!origin || !destination || !departureTimes?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
      // Return mock data for development
      const mockResults = generateMockResults(departureTimes);
      return NextResponse.json(mockResults);
    }

    // Fetch all departure times in parallel for maximum speed
    const results: ETAResult[] = await Promise.all(
      departureTimes.map(async (departureTime) => {
        const url = new URL(
          "https://maps.googleapis.com/maps/api/distancematrix/json"
        );
        url.searchParams.set("origins", origin);
        url.searchParams.set("destinations", destination);
        url.searchParams.set("departure_time", departureTime.toString());
        url.searchParams.set("traffic_model", "pessimistic");
        url.searchParams.set("key", apiKey);

        const response = await fetch(url.toString());
        const data: DistanceMatrixResponse = await response.json();

        if (data.status === "OK" && data.rows[0]?.elements[0]) {
          const element = data.rows[0].elements[0];
          if (element.status === "OK" && element.duration && element.duration_in_traffic) {
            const durationSeconds = element.duration.value;
            const rawDurationInTrafficSeconds = element.duration_in_traffic.value;

            // DEBUG: log raw Google API values
            const hawaiiHourDbg = ((Math.floor(departureTime / 3600) - 10) % 24 + 24) % 24;
            const hawaiiMinDbg  = Math.floor((departureTime % 3600) / 60);
            console.log(`[ETA DEBUG] Hawaii ${hawaiiHourDbg}:${String(hawaiiMinDbg).padStart(2,"0")} | free=${Math.round(durationSeconds/60)}min | traffic=${Math.round(rawDurationInTrafficSeconds/60)}min`);

            // Apply Honolulu Reality Correction factor directly to duration_in_traffic.
            // Google Maps consistently underestimates Oahu peak-hour congestion across
            // all routes (H1, Pali, Likelike, H3, etc.).
            // Real commute data: 6:53 AM departure → actual 62 min, Google predicted 30 min.
            // We apply a single time-of-day multiplier to duration_in_traffic only.
            // (Previously a two-step graduated multiplier was applied first, causing
            //  double-counting and over-estimated times of 90+ min.)
            const realityMultiplier = getHawaiiRealityMultiplier(departureTime);
            const durationInTrafficSeconds = Math.round(
              rawDurationInTrafficSeconds * realityMultiplier
            );

            const arrivalTime = departureTime + durationInTrafficSeconds;
            return {
              departureTime,
              departureLabel: formatTime(departureTime),
              arrivalTime,
              arrivalLabel: formatTime(arrivalTime),
              durationSeconds,
              durationInTrafficSeconds,
              status: "OK",
            } as ETAResult;
          } else {
            return {
              departureTime,
              departureLabel: formatTime(departureTime),
              arrivalTime: 0,
              arrivalLabel: "--",
              durationSeconds: 0,
              durationInTrafficSeconds: 0,
              status: data.rows[0].elements[0].status || "UNKNOWN",
            } as ETAResult;
          }
        }
        return {
          departureTime,
          departureLabel: formatTime(departureTime),
          arrivalTime: 0,
          arrivalLabel: "--",
          durationSeconds: 0,
          durationInTrafficSeconds: 0,
          status: "API_ERROR",
        } as ETAResult;
      })
    );

    const validResults = results.filter((r) => r.status === "OK");
    const freeFlowDuration =
      validResults.length > 0
        ? Math.min(...validResults.map((r) => r.durationSeconds))
        : 0;

    const responseData: ETAResponse = {
      results,
      freeFlowDuration,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("ETA API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function generateMockResults(departureTimes: number[]): ETAResponse {
  // Simulate realistic Hawaii commute patterns
  // Peak traffic around 7:30-8:30 AM on H1 freeway
  const trafficPatterns: Record<number, number> = {
    // hour -> multiplier over free-flow
    5: 1.05,
    6: 1.15,
    7: 1.45,
    8: 1.65,
    9: 1.35,
    10: 1.15,
    11: 1.1,
    12: 1.2,
    13: 1.2,
    14: 1.15,
    15: 1.3,
    16: 1.55,
    17: 1.7,
    18: 1.5,
    19: 1.2,
    20: 1.1,
  };

  const baseDurationSeconds = 1800; // 30 min free-flow baseline

  const results: ETAResult[] = departureTimes.map((depTime) => {
    const date = new Date(depTime * 1000);
    const hour = date.getHours();
    const minute = date.getMinutes();
    const fractionalHour = hour + minute / 60;

    // Interpolate between hours for smoother curve
    const lowerHour = Math.floor(fractionalHour);
    const upperHour = Math.ceil(fractionalHour);
    const fraction = fractionalHour - lowerHour;

    const lowerMultiplier = trafficPatterns[lowerHour] ?? 1.1;
    const upperMultiplier = trafficPatterns[upperHour] ?? 1.1;
    const multiplier =
      lowerMultiplier + (upperMultiplier - lowerMultiplier) * fraction;

    // Add some variance
    const variance = (Math.random() - 0.5) * 0.05;
    const finalMultiplier = Math.max(1, multiplier + variance);

    const durationInTrafficSeconds = Math.round(
      baseDurationSeconds * finalMultiplier
    );
    const arrivalTime = depTime + durationInTrafficSeconds;

    return {
      departureTime: depTime,
      departureLabel: formatTime(depTime),
      arrivalTime,
      arrivalLabel: formatTime(arrivalTime),
      durationSeconds: baseDurationSeconds,
      durationInTrafficSeconds,
      status: "OK",
    };
  });

  return {
    results,
    freeFlowDuration: baseDurationSeconds,
  };
}
