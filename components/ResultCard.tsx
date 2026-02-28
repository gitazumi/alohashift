"use client";

import type { StressData, StressLevel } from "@/types";

interface ResultCardProps {
  data: StressData;
  desiredArrival: string;
}

const riskConfig = {
  green: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badge: "bg-emerald-500 text-white",
    label: "On Time ✓",
    bufferColor: "text-emerald-600",
  },
  yellow: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-400 text-white",
    label: "Tight",
    bufferColor: "text-amber-600",
  },
  red: {
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-500 text-white",
    label: "Late Risk ✗",
    bufferColor: "text-red-500",
  },
};

const stressConfig: Record<StressLevel, { bar: string; label: string; text: string }> = {
  stable:   { bar: "bg-emerald-400", label: "Stable",   text: "text-emerald-600" },
  moderate: { bar: "bg-amber-400",   label: "Moderate", text: "text-amber-600"   },
  volatile: { bar: "bg-red-400",     label: "Volatile", text: "text-red-500"     },
};

export default function ResultCard({ data, desiredArrival }: ResultCardProps) {
  const risk = riskConfig[data.latenessRisk];
  const stress = stressConfig[data.stressLevel];
  const barWidth = Math.min(100, Math.round(data.stressIndex / 2));

  return (
    <div className={`rounded-2xl border p-5 transition-all ${risk.bg} ${risk.border}`}>

      {/* Header row: badge only, no "DEPARTURE" label */}
      <div className="flex items-center justify-end mb-3">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${risk.badge}`}>
          {risk.label}
        </span>
      </div>

      {/* Departure time */}
      <p className="text-3xl font-bold text-stone-900 mb-1 leading-none">
        {data.departureLabel}
      </p>
      <p className="text-xs text-stone-400 mb-4">departure</p>

      {/* Travel → Arrival */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-center">
          <p className="text-xs text-stone-400 mb-0.5">travel time</p>
          <p className="text-xl font-bold text-stone-700">
            {data.durationInTrafficMinutes}
            <span className="text-sm font-normal text-stone-400 ml-0.5">min</span>
          </p>
        </div>
        <div className="flex-1 flex items-center gap-1">
          <div className="flex-1 h-px bg-stone-200" />
          <svg className="w-3 h-3 text-stone-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 h-px bg-stone-200" />
        </div>
        <div className="text-center">
          <p className="text-xs text-stone-400 mb-0.5">arrives</p>
          <p className="text-xl font-bold text-stone-700">{data.arrivalLabel}</p>
        </div>
      </div>

      {/* Buffer */}
      <div className={`text-xs font-medium mb-4 ${risk.bufferColor}`}>
        {data.minutesBuffer > 0
          ? <span>+{data.minutesBuffer} min before {desiredArrival}</span>
          : <span>{Math.abs(data.minutesBuffer)} min after {desiredArrival}</span>
        }
      </div>

      {/* Stress Index */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="text-stone-400">Traffic stress</span>
          <span className={`font-semibold ${stress.text}`}>
            {stress.label}
          </span>
        </div>
        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full ${stress.bar} rounded-full transition-all duration-500`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
