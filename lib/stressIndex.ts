import type { ETAResult, StressData, StressLevel } from "@/types";

/**
 * Compute Stress Index for a single departure slot.
 *
 * Formula:
 *   delay      = travel_time_min - free_flow_min
 *   lateness   = max(0, arrival_unix - goal_unix) / 60   (minutes late)
 *   volatility = |local_slope|  (rate of travel-time change vs adjacent slots)
 *
 *   StressIndex = clamp( round(
 *     (delay / free_flow_min) * 100   ← congestion ratio component
 *     + lateness * 2                  ← lateness penalty
 *     + volatility * 8                ← instability penalty
 *   ), 0, 200 )
 *
 * Levels (display-normalized to 0–100):
 *   0–35  → Stable
 *   36–70 → Moderate
 *   71+   → Volatile
 */
function computeStressIndex(
  travelMin: number,
  freeFlowMin: number,
  latenessMin: number,
  localSlope: number
): number {
  if (freeFlowMin <= 0) return 0;
  const delay = travelMin - freeFlowMin;
  const congestionRatio = (delay / freeFlowMin) * 100;
  const latenessPenalty = latenessMin * 2;
  const volatilityPenalty = Math.abs(localSlope) * 8;
  const raw = congestionRatio + latenessPenalty + volatilityPenalty;
  return Math.min(200, Math.max(0, Math.round(raw)));
}

function toStressLevel(index: number): StressLevel {
  if (index <= 35) return "stable";
  if (index <= 70) return "moderate";
  return "volatile";
}

export function calculateStressData(
  results: ETAResult[],
  freeFlowDuration: number,
  desiredArrivalTimestamp: number
): StressData[] {
  const valid = results.filter((r) => r.status === "OK");
  const freeFlowMin = freeFlowDuration / 60;

  // Pre-compute travel minutes for slope calculation
  const travelMins = valid.map((r) =>
    Math.round(r.durationInTrafficSeconds / 60)
  );

  const rawData = valid.map((result, index) => {
    const durationMinutes = Math.round(result.durationSeconds / 60);
    const durationInTrafficMinutes = travelMins[index];

    // Local slope: rate of change vs neighbors (min per slot)
    const prev = travelMins[index - 1] ?? travelMins[index];
    const next = travelMins[index + 1] ?? travelMins[index];
    const localSlope = (next - prev) / 2;

    // Lateness
    const latenessMin =
      result.arrivalTime > desiredArrivalTimestamp
        ? (result.arrivalTime - desiredArrivalTimestamp) / 60
        : 0;

    const stressIndex = computeStressIndex(
      durationInTrafficMinutes,
      freeFlowMin,
      latenessMin,
      localSlope
    );
    const stressLevel = toStressLevel(stressIndex);

    // Risk Factor (trend signal)
    let riskFactor = 5;
    if (index < valid.length - 1) {
      const currentDelay = result.durationInTrafficSeconds - result.durationSeconds;
      const nextDelay =
        valid[index + 1].durationInTrafficSeconds -
        valid[index + 1].durationSeconds;
      if (nextDelay > currentDelay * 1.1) riskFactor = 20;
    }

    // Lateness risk badge
    const minutesBuffer = Math.round(
      (desiredArrivalTimestamp - result.arrivalTime) / 60
    );
    let latenessRisk: "green" | "yellow" | "red";
    if (result.arrivalTime > desiredArrivalTimestamp) {
      latenessRisk = "red";
    } else if (minutesBuffer <= 5) {
      latenessRisk = "yellow";
    } else {
      latenessRisk = "green";
    }

    return {
      departureLabel: result.departureLabel,
      arrivalLabel: result.arrivalLabel,
      durationMinutes,
      durationInTrafficMinutes,
      stressIndex,
      stressLevel,
      riskFactor,
      latenessRisk,
      minutesBuffer,
      isSweetSpot: false, // filled in below
    };
  });

  return rawData;
}

// kept for compatibility (no longer used in UI but referenced in some paths)
export function findSweetSpot(results: ETAResult[]): number {
  const valid = results.filter((r) => r.status === "OK");
  if (valid.length === 0) return -1;
  let minDuration = Infinity;
  let sweetIndex = 0;
  valid.forEach((r, i) => {
    if (r.durationInTrafficSeconds < minDuration) {
      minDuration = r.durationInTrafficSeconds;
      sweetIndex = i;
    }
  });
  return sweetIndex;
}

/**
 * Generate departure timestamps from a start time to end time
 * at a given interval, on the next occurrence of targetDay (0=Sun…6=Sat).
 * Google requires future timestamps for traffic predictions.
 */
export function generateDepartureTimes(
  startTime: string,
  endTime: string,
  intervalMinutes: number = 10,
  targetDay: number = 1
): number[] {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  // Hawaii Standard Time is UTC-10 (no daylight saving time)
  const HAWAII_OFFSET_MS = -10 * 60 * 60 * 1000;

  // Get current time in Hawaii
  const nowUtcMs = Date.now();
  const nowHawaiiMs = nowUtcMs + HAWAII_OFFSET_MS;
  const nowHawaii = new Date(nowHawaiiMs);

  // Current day of week in Hawaii
  const hawaiiDayOfWeek = nowHawaii.getUTCDay(); // 0=Sun…6=Sat

  // Find next occurrence of targetDay in Hawaii time
  // If today matches, use today (daysAhead = 0); otherwise find the next occurrence
  let daysAhead = (targetDay - hawaiiDayOfWeek + 7) % 7;

  // Build Hawaii date for the target day (year/month/day in Hawaii)
  // IMPORTANT: Use Hawaii midnight (00:00 HST) as the reference point to get the
  // correct calendar date. Hawaii midnight = UTC 10:00 of the same day.
  // Using nowHawaiiMs directly can give wrong UTC date when Hawaii time is > 14:00.
  const hawaiiMidnightMs = nowHawaiiMs - (nowHawaii.getUTCHours() * 3600000 + nowHawaii.getUTCMinutes() * 60000 + nowHawaii.getUTCSeconds() * 1000 + nowHawaii.getUTCMilliseconds());
  const targetMidnightMs = hawaiiMidnightMs + daysAhead * 24 * 60 * 60 * 1000;
  const targetHawaii = new Date(targetMidnightMs);
  const year  = targetHawaii.getUTCFullYear();
  const month = targetHawaii.getUTCMonth();
  const day   = targetHawaii.getUTCDate();

  // Build UTC timestamps for startTime and endTime on that Hawaii date
  // Hawaii HH:MM → UTC = HH:MM + 10h
  let startUtcMs = Date.UTC(year, month, day, startH + 10, startM, 0, 0);
  let endUtcMs   = Date.UTC(year, month, day, endH   + 10, endM,   0, 0);

  // If the start time is already in the past (today's date but past the window),
  // push to next week so Google Maps can still return traffic predictions.
  if (startUtcMs < nowUtcMs) {
    startUtcMs += 7 * 24 * 60 * 60 * 1000;
    endUtcMs   += 7 * 24 * 60 * 60 * 1000;
  }

  if (startUtcMs >= endUtcMs) return [];

  const times: number[] = [];
  let currentMs = startUtcMs;
  while (currentMs <= endUtcMs) {
    times.push(Math.floor(currentMs / 1000));
    currentMs += intervalMinutes * 60 * 1000;
  }
  return times.slice(0, 8);
}
