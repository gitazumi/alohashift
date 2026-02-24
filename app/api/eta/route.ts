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
 * Google Maps Duration Matrix API underestimates Oahu peak-hour congestion,
 * but the degree varies by day — some days Google already reflects heavy
 * traffic in duration_in_traffic, other days it doesn't.
 *
 * A fixed multiplier on duration_in_traffic causes over-correction on days
 * when Google already accounts for congestion.
 *
 * Solution: use max(traffic × trafficMultiplier, free × freeMultiplier).
 * This anchors on the free-flow baseline on light-traffic days while still
 * following Google's estimate when it already shows heavy congestion.
 *
 * Validated against real commute data:
 *   160 Polihale Pl → Mid-Pacific Institute, 6:53 AM Monday
 *   free=20min, traffic=30min → max(30×1.4, 20×3.0) = 60min (actual: 62min ✓)
 *   free=20min, traffic=44min → max(44×1.4, 20×3.0) = 62min (actual: ~60min ✓)
 */
interface RealityCorrection {
  trafficMultiplier: number; // applied to duration_in_traffic
  freeMultiplier: number;    // applied to free-flow duration (floor)
}

function getHawaiiRealityCorrection(departureTimestamp: number): RealityCorrection {
  const hawaiiHour = ((Math.floor(departureTimestamp / 3600) - 10) % 24 + 24) % 24;
  const hawaiiMinute = Math.floor((departureTimestamp % 3600) / 60);
  const fractionalHour = hawaiiHour + hawaiiMinute / 60;

  if (fractionalHour >= 6.5 && fractionalHour < 9.0)
    return { trafficMultiplier: 1.4, freeMultiplier: 3.0 }; // AM peak
  if (fractionalHour >= 16.5 && fractionalHour < 19.0)
    return { trafficMultiplier: 1.3, freeMultiplier: 2.5 }; // PM peak
  if (fractionalHour >= 9.0 && fractionalHour < 11.0)
    return { trafficMultiplier: 1.2, freeMultiplier: 2.0 }; // post-AM peak
  if (fractionalHour >= 15.0 && fractionalHour < 16.5)
    return { trafficMultiplier: 1.2, freeMultiplier: 1.8 }; // pre-PM peak
  if (fractionalHour >= 5.0 && fractionalHour < 6.5)
    return { trafficMultiplier: 1.2, freeMultiplier: 1.5 }; // early AM
  return { trafficMultiplier: 1.05, freeMultiplier: 1.2 };  // midday / evening
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

            // Apply Honolulu Reality Correction:
            // max(traffic × trafficMultiplier, free × freeMultiplier)
            // This avoids over-correction on days when Google already reflects congestion.
            const correction = getHawaiiRealityCorrection(departureTime);
            const durationInTrafficSeconds = Math.round(Math.max(
              rawDurationInTrafficSeconds * correction.trafficMultiplier,
              durationSeconds * correction.freeMultiplier
            ));

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
