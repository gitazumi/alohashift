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

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours();
  const minutes = date.getMinutes();
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

    const results: ETAResult[] = [];

    for (const departureTime of departureTimes) {
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

          // Amplify the congestion portion by 10% to better reflect
          // real-world Hawaii traffic (Google tends to underestimate peak congestion)
          const CONGESTION_MULTIPLIER = 1.10;
          const congestionDelay = rawDurationInTrafficSeconds - durationSeconds;
          const durationInTrafficSeconds =
            congestionDelay > 0
              ? Math.round(durationSeconds + congestionDelay * CONGESTION_MULTIPLIER)
              : rawDurationInTrafficSeconds;

          const arrivalTime = departureTime + durationInTrafficSeconds;

          results.push({
            departureTime,
            departureLabel: formatTime(departureTime),
            arrivalTime,
            arrivalLabel: formatTime(arrivalTime),
            durationSeconds,
            durationInTrafficSeconds,
            status: "OK",
          });
        } else {
          results.push({
            departureTime,
            departureLabel: formatTime(departureTime),
            arrivalTime: 0,
            arrivalLabel: "--",
            durationSeconds: 0,
            durationInTrafficSeconds: 0,
            status: element.status || "UNKNOWN",
          });
        }
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

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
