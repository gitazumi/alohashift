"use client";

import type { TrafficIncident } from "@/app/api/incidents/route";

interface IncidentBannerProps {
  incidents: TrafficIncident[];
  isLoading: boolean;
}

function formatTime(timeStr: string): string {
  // "04:22:48 PM" → "4:22 PM"
  const [time, ampm] = timeStr.split(" ");
  const [h, m] = time.split(":");
  return `${parseInt(h)}:${m} ${ampm}`;
}

function incidentLabel(type: string): string {
  const t = type.toUpperCase();
  if (t.includes("FATAL")) return "Fatal Crash";
  if (t.includes("PI") || t.includes("INJUR")) return "Injury Crash";
  if (t.includes("TOWED")) return "Crash (Vehicle Towed)";
  if (t.includes("HIT AND RUN")) return "Hit & Run";
  if (t.includes("MVC")) return "Traffic Crash";
  if (t.includes("HAZARD")) return "Road Hazard";
  if (t.includes("DEBRIS")) return "Debris in Road";
  if (t.includes("FLOOD")) return "Flooding";
  return type;
}

function severityColor(type: string): "red" | "orange" | "yellow" {
  const t = type.toUpperCase();
  if (t.includes("FATAL") || t.includes("PI") || t.includes("INJUR")) return "red";
  if (t.includes("MVC") || t.includes("HIT AND RUN")) return "orange";
  return "yellow";
}

const colorMap = {
  red: {
    banner: "bg-red-50 border-red-300",
    icon: "text-red-500",
    title: "text-red-800",
    badge: "bg-red-100 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  orange: {
    banner: "bg-orange-50 border-orange-300",
    icon: "text-orange-500",
    title: "text-orange-800",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  yellow: {
    banner: "bg-amber-50 border-amber-300",
    icon: "text-amber-500",
    title: "text-amber-800",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
};

export default function IncidentBanner({ incidents, isLoading }: IncidentBannerProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 animate-pulse">
        <span className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
        Checking for traffic incidents on your route…
      </div>
    );
  }

  if (incidents.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span><span className="font-semibold">No incidents</span> reported on your route today (HPD data)</span>
      </div>
    );
  }

  // Determine overall severity from worst incident
  const worstSeverity = incidents.reduce<"red" | "orange" | "yellow">((acc, inc) => {
    const s = severityColor(inc.type);
    if (s === "red") return "red";
    if (s === "orange" && acc !== "red") return "orange";
    return acc;
  }, "yellow");

  const colors = colorMap[worstSeverity];

  return (
    <div className={`rounded-2xl border ${colors.banner} px-4 py-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <svg className={`w-5 h-5 ${colors.icon} shrink-0`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className={`text-sm font-bold ${colors.title}`}>
          {incidents.length === 1
            ? "1 incident reported on your route today"
            : `${incidents.length} incidents reported on your route today`}
        </p>
        <span className="ml-auto text-xs text-slate-400 shrink-0">HPD · live</span>
      </div>

      {/* Incident list */}
      <div className="space-y-2">
        {incidents.slice(0, 5).map((inc, i) => {
          const sev = severityColor(inc.type);
          const c = colorMap[sev];
          return (
            <div key={i} className="flex items-start gap-3 bg-white/60 rounded-xl px-3 py-2.5">
              <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${c.badge}`}>
                    {incidentLabel(inc.type)}
                  </span>
                  {inc.area && (
                    <span className="text-xs text-slate-400">{inc.area}</span>
                  )}
                </div>
                <p className="text-xs text-slate-700 font-medium truncate">{inc.address}</p>
                {inc.location && inc.location !== "NA" && (
                  <p className="text-xs text-slate-400 truncate">{inc.location}</p>
                )}
              </div>
              <span className="text-xs text-slate-400 shrink-0 mt-0.5">
                {formatTime(inc.time)}
              </span>
            </div>
          );
        })}
        {incidents.length > 5 && (
          <p className="text-xs text-slate-400 text-center pt-1">
            +{incidents.length - 5} more incident{incidents.length - 5 > 1 ? "s" : ""}
          </p>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Source: Honolulu Police Department via{" "}
        <a
          href="https://data.honolulu.gov/Public-Safety/Traffic-Incidents/ykb6-n5th"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-slate-600"
        >
          data.honolulu.gov
        </a>
        . Updated every 5 min. Only incidents within 3 km of your route are shown.
      </p>
    </div>
  );
}
