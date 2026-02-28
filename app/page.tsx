"use client";

import { useState } from "react";
import Link from "next/link";
import HeroSection from "@/components/HeroSection";
import InputForm from "@/components/InputForm";
import ResultCard from "@/components/ResultCard";
import TrafficCurve from "@/components/TrafficCurve";
import AIComment from "@/components/AIComment";
import CollectiveImpact from "@/components/CollectiveImpact";
import RouteMap from "@/components/RouteMap";
import { calculateStressData, generateDepartureTimes } from "@/lib/stressIndex";
import { generateAIComment } from "@/lib/aiComments";
import { isTodaySchoolDay } from "@/lib/schoolCalendar";
import type { ETAResponse, FormValues, StressData } from "@/types";
interface ResultState {
  stressData: StressData[];
  origin: string;
  destination: string;
  desiredArrival: string;
}

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const departureTimes = generateDepartureTimes(
        values.startTime,
        values.endTime,
        values.intervalMinutes,
        values.targetDay
      );

      if (departureTimes.length === 0) {
        throw new Error("Please set a valid departure window (start time must be before end time).");
      }

      const response = await fetch("/api/eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: values.origin,
          destination: values.destination,
          departureTimes,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: ETAResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Parse desired arrival as timestamp — must match the same targetDay date
      // that generateDepartureTimes uses (Hawaii Standard Time = UTC-10)
      const [hours, minutes] = values.desiredArrivalTime.split(":").map(Number);
      const HAWAII_OFFSET_MS = -10 * 60 * 60 * 1000;
      const nowUtcMs = Date.now();
      const nowHawaiiMs = nowUtcMs + HAWAII_OFFSET_MS;
      const nowHawaii = new Date(nowHawaiiMs);
      const hawaiiDayOfWeek = nowHawaii.getUTCDay();
      const daysAhead = (values.targetDay - hawaiiDayOfWeek + 7) % 7;
      // IMPORTANT: Normalize to Hawaii midnight before extracting year/month/day.
      // When Hawaii local time is past 14:00, nowHawaiiMs in UTC rolls to the next
      // calendar day, causing getUTCDate() to return the wrong date.
      const hawaiiMidnightMs = nowHawaiiMs - (
        nowHawaii.getUTCHours() * 3600000 +
        nowHawaii.getUTCMinutes() * 60000 +
        nowHawaii.getUTCSeconds() * 1000 +
        nowHawaii.getUTCMilliseconds()
      );
      const targetMidnightMs = hawaiiMidnightMs + daysAhead * 24 * 60 * 60 * 1000;
      const targetHawaii = new Date(targetMidnightMs);
      const year  = targetHawaii.getUTCFullYear();
      const month = targetHawaii.getUTCMonth();
      const day   = targetHawaii.getUTCDate();
      // Hawaii HH:MM → UTC = HH:MM + 10h
      let desiredArrivalTimestamp = Math.floor(
        Date.UTC(year, month, day, hours + 10, minutes, 0, 0) / 1000
      );

      // generateDepartureTimes pushes timestamps +7 days when the start time
      // is already in the past. desiredArrivalTimestamp must follow the same
      // shift — otherwise all arrival times will be later than the "today"
      // desired arrival and every slot shows latenessRisk=red.
      const startH = Number(values.startTime.split(":")[0]);
      const startM = Number(values.startTime.split(":")[1]);
      const startUtcMs = Date.UTC(year, month, day, startH + 10, startM, 0, 0);
      if (startUtcMs < nowUtcMs) {
        desiredArrivalTimestamp += 7 * 24 * 60 * 60;
      }

      const stressData = calculateStressData(
        data.results,
        data.freeFlowDuration,
        desiredArrivalTimestamp
      );
      // Format desired arrival for display
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const desiredArrival = `${displayHours}:${displayMinutes} ${ampm}`;

      setResult({
        stressData,
        origin: values.origin,
        destination: values.destination,
        desiredArrival,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Derived data for panels
  const aiComment =
    result
      ? generateAIComment({
          stressData: result.stressData,
          sweetSpotIndex: -1,
          origin: result.origin,
          destination: result.destination,
        })
      : null;

  return (
    <main className="min-h-screen bg-[#faf9f7]">
      <HeroSection />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Input Form */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-md overflow-hidden">
          <InputForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-6 py-4 text-sm text-red-600">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-8">
            {/* School day indicator */}
            {(() => {
              const schoolInfo = isTodaySchoolDay();
              return schoolInfo.isSchoolDay ? (
                <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-700">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                  <span>
                    <span className="font-semibold">School day</span> — predictions include school traffic patterns.
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                  <span>
                    <span className="font-semibold">School is not in session</span> ({schoolInfo.reason}) — traffic may be lighter than usual.
                  </span>
                </div>
              );
            })()}

            {/* Route summary */}
            <div className="bg-white rounded-xl border border-stone-200 px-4 py-3 space-y-1.5">
              <div className="flex items-start gap-2.5 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5"></span>
                <span className="font-medium text-stone-700 break-words min-w-0">{result.origin}</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 mt-1.5"></span>
                <span className="font-medium text-stone-700 break-words min-w-0">{result.destination}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-400 pt-0.5 border-t border-stone-100">
                <span>Must arrive by</span>
                <span className="font-semibold text-stone-600">{result.desiredArrival}</span>
              </div>
            </div>

            {/* Result Cards Grid */}
            <section>
              <h2 className="text-sm font-medium text-stone-400 mb-4">
                Departure windows
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {result.stressData.map((data) => (
                  <ResultCard
                    key={data.departureLabel}
                    data={data}
                    desiredArrival={result.desiredArrival}
                  />
                ))}
              </div>
            </section>

            {/* Route Map */}
            <RouteMap
              origin={result.origin}
              destination={result.destination}
            />

            {/* Traffic Curve */}
            <TrafficCurve
              stressData={result.stressData}
              desiredArrival={result.desiredArrival}
            />

            {/* AI Comment (Pattern Analysis) */}
            {aiComment && <AIComment comment={aiComment} />}

            {/* Collective Impact Simulator */}
            {result.stressData.length > 0 && (() => {
              const durations = result.stressData.map((d) => d.durationInTrafficMinutes);
              const freeFlow = Math.min(...result.stressData.map((d) => d.durationMinutes));
              const peakDelay = Math.max(...durations) - freeFlow;
              const worstIdx = durations.indexOf(Math.max(...durations));
              const bestIdx  = durations.indexOf(Math.min(...durations));
              const worstSlot = result.stressData[worstIdx];
              const bestSlot  = result.stressData[bestIdx];
              const personalSavedMin = Math.max(0, durations[worstIdx] - durations[bestIdx]);
              return (
                <CollectiveImpact
                  peakDelayMinutes={peakDelay}
                  freeFlowMinutes={freeFlow}
                  personalSavedMin={personalSavedMin}
                  worstLabel={worstSlot.departureLabel}
                  bestLabel={bestSlot.departureLabel}
                />
              );
            })()}

            {/* Philosophy footer */}
            <div className="text-center py-8 border-t border-stone-200">
              <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
                AlohaShift presents options — not prescriptions. We do not
                notify, push, or optimize on your behalf. The decision is always
                yours.
              </p>
            </div>
          </div>
        )}

        {/* Community Data CTA — always visible, just above the page footer */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-emerald-800 mb-0.5">
              Help make AlohaShift more accurate
            </p>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Share your real commute times and see how predictions compare to reality.
              Takes less than 2 minutes · No account needed.
            </p>
          </div>
          <Link
            href="/community"
            className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-sm whitespace-nowrap"
          >
            Submit Your Commute Data →
          </Link>
        </div>

      </div>
    </main>
  );
}
