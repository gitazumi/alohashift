"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
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
  isSweetSpot: boolean;
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      <p className="text-blue-600">{payload[0]?.value} min with traffic</p>
      {d && (
        <p className={`text-xs mt-1 font-medium ${d.isLate ? "text-red-400" : "text-slate-400"}`}>
          {d.isLate ? "⚠ Risk Zone" : `Stress: ${d.stressIndex}`}
        </p>
      )}
    </div>
  );
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
}

function CustomDot({ cx, cy, payload }: CustomDotProps) {
  if (!cx || !cy || !payload) return null;
  if (payload.isLate) {
    return <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="white" strokeWidth={1.5} />;
  }
  return <circle cx={cx} cy={cy} r={4} fill="#94a3b8" stroke="white" strokeWidth={1.5} />;
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
  const minMinutes = Math.min(...allMinutes);
  const maxMinutes = Math.max(...allMinutes);
  const yMin = Math.floor(minMinutes * 0.85);
  const yMax = Math.ceil(maxMinutes * 1.1);

  // Contiguous late-risk zones for ReferenceArea shading
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
    <div className="bg-white rounded-2xl border border-stone-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-stone-800">Traffic curve</h3>
          <p className="text-xs text-stone-400 mt-0.5">
            How long each departure takes — red zones mean you&apos;d arrive late
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-300 inline-block" />
          late risk
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 20, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />

          {lateZones.map((z, i) => (
            <ReferenceArea
              key={i}
              x1={z.start}
              x2={z.end}
              fill="#fee2e2"
              fillOpacity={0.5}
            />
          ))}

          <XAxis dataKey="departure" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
          <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m`} width={36} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="minutes"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={<CustomDot />}
            activeDot={{ r: 7, fill: "#3b82f6" }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-stone-400 border-t border-stone-100 pt-3">
        <span>
          Goal: <span className="font-medium text-stone-600">{desiredArrival}</span>
        </span>
        <span className="flex items-center gap-2">
          Traffic stress —
          <span className="text-emerald-600 font-medium">stable</span>
          <span className="text-amber-500 font-medium">moderate</span>
          <span className="text-red-500 font-medium">volatile</span>
        </span>
      </div>
    </div>
  );
}
