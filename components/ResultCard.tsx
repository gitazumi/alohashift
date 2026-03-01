"use client";

import type { StressData } from "@/types";

interface ResultCardProps {
  data: StressData;
  desiredArrival: string;
}

function statusConfig(risk: StressData["latenessRisk"], stress: StressData["stressLevel"]) {
  if (risk === "red") return { color: "text-[#B45309]", label: "Late risk" };
  if (risk === "yellow") return { color: "text-[#6B7280]", label: "Tight" };
  // green — use stress level for nuance
  if (stress === "volatile") return { color: "text-[#6B7280]", label: "On time" };
  if (stress === "moderate") return { color: "text-[#15803D]", label: "On time" };
  return { color: "text-[#15803D]", label: "On time" };
}

function stressLabel(level: StressData["stressLevel"]): { label: string; color: string } {
  if (level === "stable") return { label: "Stable", color: "text-[#15803D]" };
  if (level === "moderate") return { label: "Moderate", color: "text-[#6B7280]" };
  return { label: "Volatile", color: "text-[#B45309]" };
}

export default function ResultCard({ data, desiredArrival }: ResultCardProps) {
  const status = statusConfig(data.latenessRisk, data.stressLevel);
  const stress = stressLabel(data.stressLevel);

  return (
    <div className="flex items-center gap-4 py-4 border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors px-2 -mx-2">

      {/* Departure time */}
      <div className="w-[72px] shrink-0">
        <span className="text-[22px] font-semibold text-[#111827] tabular-nums leading-none">
          {data.departureLabel}
        </span>
      </div>

      {/* Duration */}
      <div className="w-[64px] shrink-0 text-[14px] text-[#6B7280]">
        <span className="font-medium text-[#111827] tabular-nums">{data.durationInTrafficMinutes}</span>
        <span className="text-[12px] ml-0.5">min</span>
      </div>

      {/* Arrival */}
      <div className="flex-1 text-[13px] text-[#6B7280]">
        → <span className="font-medium text-[#111827]">{data.arrivalLabel}</span>
      </div>

      {/* Buffer */}
      <div className="w-[96px] shrink-0 text-right text-[12px]">
        {data.minutesBuffer > 0 ? (
          <span className="text-[#15803D]">+{data.minutesBuffer} min</span>
        ) : data.minutesBuffer === 0 ? (
          <span className="text-[#6B7280]">exact</span>
        ) : (
          <span className="text-[#B45309]">{Math.abs(data.minutesBuffer)} min late</span>
        )}
      </div>

      {/* Status */}
      <div className="w-[72px] shrink-0 text-right">
        <span className={`text-[12px] font-medium ${status.color}`}>
          {status.label}
        </span>
        <div className={`text-[11px] ${stress.color} mt-0.5`}>{stress.label}</div>
      </div>

    </div>
  );
}
