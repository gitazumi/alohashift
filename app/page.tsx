"use client";

import { useState } from "react";
import Link from "next/link";
import HeroSection from "@/components/HeroSection";
import InputForm from "@/components/InputForm";
import ResultCard from "@/components/ResultCard";
import TrafficCurve from "@/components/TrafficCurve";
import AIComment from "@/components/AIComment";
import CollectiveImpact from "@/components/CollectiveImpact";
import IncidentBanner from "@/components/IncidentBanner";
import { calculateStressData, generateDepartureTimes } from "@/lib/stressIndex";
import { generateAIComment } from "@/lib/aiComments";
import type { ETAResponse, FormValues, StressData } from "@/types";
import type { TrafficIncident } from "@/app/api/incidents/route";

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

  // Incident state — fetched in parallel with ETA
  const [incidents, setIncidents] = useState<TrafficIncident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setIncidents([]);
    setIncidentsLoading(true);

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

      // ── Fetch ETA and incidents in parallel ───────────────────────────
      const [response, incidentRes] = await Promise.all([
        fetch("/api/eta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: values.origin,
            destination: values.destination,
            departureTimes,
          }),
        }),
        fetch("/api/incidents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin: values.origin,
            destination: values.destination,
          }),
        }).catch(() => null), // don't block ETA if incidents fail
      ]);

      // Handle incidents (non-blocking)
      if (incidentRes?.ok) {
        const incData = await incidentRes.json();
        setIncidents(incData.incidents ?? []);
      }
      setIncidentsLoading(false);

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
      setIncidentsLoading(false);
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

            {/* Traffic Incident Banner — between Traffic Curve and Pattern Analysis */}
            <IncidentBanner incidents={incidents} isLoading={incidentsLoading} />

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
            <div className="text-center py-8 border-t border-slate-200">
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
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
              🤙 Help make AlohaShift more accurate
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
