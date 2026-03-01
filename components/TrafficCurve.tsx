"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import type { StressData } from "@/types";

interface TrafficCurveProps {
  stressData: StressData[];
  desiredArrival: string;
}

interface ChartDataPoint {
  departure: string;
  minutes: number;
  stressIndex: number;
  isLate: boolean;
}

interface TooltipPayload {
  payload?: ChartDataPoint;
  value?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-3 text-[13px] shadow-sm min-w-[140px]">
      <p className="font-medium text-[#111827] mb-1">{label}</p>
      <p className="text-[#2563EB] tabular-nums">{payload[0]?.value} min</p>
      {d?.isLate && (
        <p className="text-[12px] text-[#B45309] mt-1">Late risk</p>
      )}
    </div>
  );
}

export default function TrafficCurve({ stressData, desiredArrival }: TrafficCurveProps) {
  const chartData: ChartDataPoint[] = stressData.map((d) => ({
    departure: d.departureLabel,
    minutes: d.durationInTrafficMinutes,
    stressIndex: d.stressIndex,
    isSweetSpot: d.isSweetSpot,
    isLate: d.latenessRisk === "red",
  }));

  const allMinutes = chartData.map((d) => d.minutes);
  const yMin = Math.floor(Math.min(...allMinutes) * 0.9);
  const yMax = Math.ceil(Math.max(...allMinutes) * 1.08);

  const lateZones: { start: string; end: string }[] = [];
  let zoneStart: string | null = null;
  chartData.forEach((d, i) => {
    if (d.isLate && !zoneStart) zoneStart = d.departure;
    if (!d.isLate && zoneStart) {
      lateZones.push({ start: zoneStart, end: chartData[i - 1].departure });
      zoneStart = null;
    }
    if (d.isLate && i === chartData.length - 1 && zoneStart) {
      lateZones.push({ start: zoneStart, end: d.departure });
    }
  });

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[4px] p-6 mt-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-semibold text-[#111827]">
            Commute Time Variance
          </h3>
          <p className="text-[12px] text-[#6B7280] mt-0.5">
            Travel duration by departure time · Goal: {desiredArrival}
          </p>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-[#6B7280] mt-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-px bg-[#2563EB] inline-block" />
            Duration
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#FEF3C7] border border-[#E5E7EB] inline-block" />
            Late risk
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#E5E7EB" vertical={false} />

          {lateZones.map((z, i) => (
            <ReferenceArea
              key={i}
              x1={z.start}
              x2={z.end}
              fill="#FEF3C7"
              fillOpacity={0.7}
            />
          ))}

          <XAxis
            dataKey="departure"
            tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: "inherit" }}
            axisLine={{ stroke: "#E5E7EB" }}
            tickLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 11, fill: "#9CA3AF", fontFamily: "inherit" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}m`}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="minutes"
            stroke="#2563EB"
            strokeWidth={1.5}
            dot={{ r: 3, fill: "#2563EB", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#2563EB", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3 pt-3 border-t border-[#E5E7EB] flex gap-6 text-[12px] text-[#6B7280]">
        <span>
          Stable <span className="text-[#15803D] font-medium">↓ congestion</span>
        </span>
        <span>
          Moderate <span className="text-[#6B7280] font-medium">·</span>
        </span>
        <span>
          Volatile <span className="text-[#B45309] font-medium">↑ congestion</span>
        </span>
      </div>
    </div>
  );
}
