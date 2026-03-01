"use client";

import { useState } from "react";
import Link from "next/link";
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

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data: ETAResponse = await response.json();
      if (data.error) throw new Error(data.error);

      const [hours, minutes] = values.desiredArrivalTime.split(":").map(Number);
      const HAWAII_OFFSET_MS = -10 * 60 * 60 * 1000;
      const nowUtcMs = Date.now();
      const nowHawaiiMs = nowUtcMs + HAWAII_OFFSET_MS;
      const nowHawaii = new Date(nowHawaiiMs);
      const hawaiiDayOfWeek = nowHawaii.getUTCDay();
      const daysAhead = (values.targetDay - hawaiiDayOfWeek + 7) % 7;
      const hawaiiMidnightMs = nowHawaiiMs - (
        nowHawaii.getUTCHours() * 3600000 +
        nowHawaii.getUTCMinutes() * 60000 +
        nowHawaii.getUTCSeconds() * 1000 +
        nowHawaii.getUTCMilliseconds()
      );
      const targetMidnightMs = hawaiiMidnightMs + daysAhead * 24 * 60 * 60 * 1000;
      const targetHawaii = new Date(targetMidnightMs);
      const year = targetHawaii.getUTCFullYear();
      const month = targetHawaii.getUTCMonth();
      const day = targetHawaii.getUTCDate();

      let desiredArrivalTimestamp = Math.floor(
        Date.UTC(year, month, day, hours + 10, minutes, 0, 0) / 1000
      );
      const startH = Number(values.startTime.split(":")[0]);
      const startM = Number(values.startTime.split(":")[1]);
      const startUtcMs = Date.UTC(year, month, day, startH + 10, startM, 0, 0);
      if (startUtcMs < nowUtcMs) desiredArrivalTimestamp += 7 * 24 * 60 * 60;

      const stressData = calculateStressData(data.results, data.freeFlowDuration, desiredArrivalTimestamp);
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const desiredArrival = `${displayHours}:${displayMinutes} ${ampm}`;

      setResult({ stressData, origin: values.origin, destination: values.destination, desiredArrival });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const aiComment = result
    ? generateAIComment({ stressData: result.stressData, sweetSpotIndex: -1, origin: result.origin, destination: result.destination })
    : null;

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-6xl mx-auto px-8 pt-8 pb-20">

        {/* Page header */}
        <div className="mb-8 pb-6 border-b border-[#E5E7EB]">
          <h1 className="text-[28px] font-semibold text-[#111827] tracking-tight">
            Oahu Commute Optimization
          </h1>
          <p className="text-[17px] text-[#111827] mt-2 leading-snug">
            Traffic isn&apos;t random.<br />
            It depends on when we leave.
          </p>
          <p className="text-[12px] text-[#9CA3AF] mt-2">
            Island-wide departure time modeling · Real-time ETA sampling
          </p>
        </div>

        {/* Input Form — single column, full width */}
        <InputForm onSubmit={handleSubmit} isLoading={isLoading} />

        {/* Error */}
        {error && (
          <div className="border border-[#E5E7EB] rounded-[4px] px-4 py-3 text-[13px] text-[#B45309] bg-white mt-6">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-3 py-8 mt-6">
            <svg className="animate-spin w-4 h-4 text-[#2563EB]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-[14px] text-[#6B7280]">Querying traffic data...</span>
          </div>
        )}

        {/* Results — appear below form after Analyze */}
        {result && (
          <div className="mt-10">

            {/* School day status */}
            {(() => {
              const schoolInfo = isTodaySchoolDay();
              return (
                <div className="flex items-center gap-2 mb-5 text-[12px] text-[#6B7280]">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${schoolInfo.isSchoolDay ? "bg-[#2563EB]" : "bg-[#9CA3AF]"}`} />
                  {schoolInfo.isSchoolDay
                    ? "School day — school traffic patterns applied"
                    : `School not in session (${schoolInfo.reason}) — lighter traffic expected`}
                </div>
              );
            })()}

            {/* Route summary */}
            <div className="mb-5 text-[13px] text-[#6B7280] space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-16 text-right text-[12px] font-medium text-[#9CA3AF]">From</span>
                <span className="text-[#111827]">{result.origin}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 text-right text-[12px] font-medium text-[#9CA3AF]">To</span>
                <span className="text-[#111827]">{result.destination}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 text-right text-[12px] font-medium text-[#9CA3AF]">Goal</span>
                <span className="text-[#111827]">{result.desiredArrival}</span>
              </div>
            </div>

            {/* Timeline header */}
            <div className="flex items-center gap-4 py-2 border-b border-[#E5E7EB] mb-0 text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide px-2 -mx-2">
              <span className="w-[72px]">Depart</span>
              <span className="w-[64px]">Travel</span>
              <span className="flex-1">Arrives</span>
              <span className="w-[96px] text-right">Buffer</span>
              <span className="w-[72px] text-right">Status</span>
            </div>

            {/* Timeline rows */}
            <div>
              {result.stressData.map((data) => (
                <ResultCard
                  key={data.departureLabel}
                  data={data}
                  desiredArrival={result.desiredArrival}
                />
              ))}
            </div>

            {/* AI Pattern comment */}
            {aiComment && (
              <div className="mt-6 text-[13px] text-[#6B7280] leading-relaxed border-l-2 border-[#E5E7EB] pl-4">
                <span className="font-medium text-[#111827]">{aiComment.headline}</span>{" "}
                {aiComment.detail}
              </div>
            )}

            {/* Traffic Curve */}
            <TrafficCurve stressData={result.stressData} desiredArrival={result.desiredArrival} />

            {/* Route Map */}
            <div className="mt-8">
              <RouteMap origin={result.origin} destination={result.destination} />
            </div>

            {/* Collective Impact */}
            {result.stressData.length > 0 && (() => {
              const durations = result.stressData.map((d) => d.durationInTrafficMinutes);
              const freeFlow = Math.min(...result.stressData.map((d) => d.durationMinutes));
              const peakDelay = Math.max(...durations) - freeFlow;
              const worstIdx = durations.indexOf(Math.max(...durations));
              const bestIdx = durations.indexOf(Math.min(...durations));
              const personalSavedMin = Math.max(0, durations[worstIdx] - durations[bestIdx]);
              return (
                <CollectiveImpact
                  peakDelayMinutes={peakDelay}
                  freeFlowMinutes={freeFlow}
                  personalSavedMin={personalSavedMin}
                  worstLabel={result.stressData[worstIdx].departureLabel}
                  bestLabel={result.stressData[bestIdx].departureLabel}
                />
              );
            })()}

            {/* Methodology note */}
            <div className="mt-8 pt-6 border-t border-[#E5E7EB] text-[12px] text-[#9CA3AF] text-center">
              AlohaShift presents options — not prescriptions. The decision is always yours.
            </div>

          </div>
        )}

        {/* ── Community CTA ── */}
        <div className="mt-16 pt-8 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-medium text-[#111827]">Help improve prediction accuracy</p>
            <p className="text-[13px] text-[#6B7280] mt-0.5">
              Submit real commute times · Community-powered · No account needed
            </p>
          </div>
          <Link
            href="/community"
            className="shrink-0 text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] transition flex items-center gap-1"
          >
            Submit commute data →
          </Link>
        </div>

      </div>
    </main>
  );
}
