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
 * Honolulu Reality Correction — Analysis & Decision
 *
 * Real commute data (160 Polihale Pl → Mid-Pacific Institute, Monday AM):
 *   6:30 AM: Google traffic=26min, actual=25min  → ratio=1.30, needs ×0.96 (no correction)
 *   6:53 AM: Google traffic=30min, actual=62min  → ratio=1.50, needs ×2.07
 *   7:00 AM: Google traffic=38min, actual=60min  → ratio=1.90, needs ×1.58
 *   7:10 AM: Google traffic=44min, actual=62min  → ratio=2.19, needs ×1.41
 *
 * Key insight: the required multiplier is NOT monotone with time-of-day —
 * it depends on how much congestion Google has already "baked in" on that
 * specific day. A fixed multiplier either over-corrects light days (6:30 AM)
 * or under-corrects heavy days (6:53 AM). A free-flow floor (×3.0) flattens
 * all slots to ~60 min regardless of actual conditions.
 *
 * Decision: use Google duration_in_traffic directly without correction.
 * - Light days (6:30 AM): 26min → displayed 26min, actual 25min (error 1min ✓)
 * - Heavy days (7:10 AM): 44min → displayed 44min, actual 62min (error 18min)
 *
 * The remaining gap on heavy days will be closed as community data accumulates
 * and per-route calibration becomes possible. A single scalar multiplier
 * cannot solve the day-to-day variance in Google's own traffic model.
 */

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

            // Use Google duration_in_traffic directly.
            // Any fixed multiplier either over-corrects light-traffic slots or
            // under-corrects heavy ones — see comment block above for full analysis.
            const durationInTrafficSeconds = rawDurationInTrafficSeconds;

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
