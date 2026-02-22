"use client";

import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import InputForm from "@/components/InputForm";
import ResultCard from "@/components/ResultCard";
import TrafficCurve from "@/components/TrafficCurve";
import AIComment from "@/components/AIComment";
import CO2Section from "@/components/CO2Section";
import CollectiveImpact from "@/components/CollectiveImpact";
import { calculateStressData, generateDepartureTimes } from "@/lib/stressIndex";
import { generateAIComment } from "@/lib/aiComments";
import { estimateCO2Savings } from "@/lib/co2";
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
      let daysAhead = (values.targetDay - hawaiiDayOfWeek + 7) % 7;
      if (daysAhead === 0) daysAhead = 7;
      const targetHawaii = new Date(nowHawaiiMs + daysAhead * 24 * 60 * 60 * 1000);
      const year  = targetHawaii.getUTCFullYear();
      const month = targetHawaii.getUTCMonth();
      const day   = targetHawaii.getUTCDate();
      // Hawaii HH:MM → UTC = HH:MM + 10h
      const desiredArrivalTimestamp = Math.floor(
        Date.UTC(year, month, day, hours + 10, minutes, 0, 0) / 1000
      );

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

  const co2Data = result && result.stressData.length > 0
    ? (() => {
        const delays = result.stressData.map(
          (d) => d.durationInTrafficMinutes - d.durationMinutes
        );
        const worstDelay = Math.max(...delays);
        const bestDelay = Math.min(...delays);
        const worstSlot = result.stressData[delays.indexOf(worstDelay)];
        const bestSlot = result.stressData[delays.indexOf(bestDelay)];
        return {
          ...estimateCO2Savings(worstDelay, bestDelay),
          worstLabel: worstSlot.departureLabel,
          bestLabel: bestSlot.departureLabel,
        };
      })()
    : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <HeroSection />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {/* Input Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
            {/* Route summary */}
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{result.origin}</span>
              <svg
                className="w-4 h-4 text-slate-300"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium text-slate-700">
                {result.destination}
              </span>
              <span className="ml-auto text-slate-400">
                Goal:{" "}
                <span className="font-semibold text-slate-600">
                  {result.desiredArrival}
                </span>
              </span>
            </div>

            {/* Result Cards Grid */}
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Departure Windows
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

            {/* Traffic Curve */}
            <TrafficCurve
              stressData={result.stressData}
              desiredArrival={result.desiredArrival}
            />

            {/* AI Comment */}
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
              // Minutes saved by choosing best slot over worst slot
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

            {/* CO2 */}
            {co2Data && (
              <CO2Section
                savingsKg={co2Data.savingsKg}
                savingsGrams={co2Data.savingsGrams}
                equivalent={co2Data.equivalent}
                worstLabel={co2Data.worstLabel}
                bestLabel={co2Data.bestLabel}
              />
            )}

            {/* Philosophy footer */}
            <div className="text-center py-8 border-t border-slate-200">
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                AlohaShift presents options — not prescriptions. We do not
                notify, push, or optimize on your behalf. The decision is always
                yours.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
