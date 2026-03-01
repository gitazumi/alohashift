"use client";

import { useState } from "react";
import type { FormValues, TargetDay } from "@/types";
import PlaceAutocomplete from "./PlaceAutocomplete";

interface InputFormProps {
  onSubmit: (values: FormValues) => void;
  isLoading: boolean;
}

const DAYS: { label: string; value: TargetDay; isWeekend: boolean }[] = [
  { label: "Sun", value: 0, isWeekend: true },
  { label: "Mon", value: 1, isWeekend: false },
  { label: "Wed", value: 3, isWeekend: false },
  { label: "Thu", value: 4, isWeekend: false },
  { label: "Fri", value: 5, isWeekend: false },
  { label: "Sat", value: 6, isWeekend: true },
];

const ALL_DAYS: { label: string; value: TargetDay }[] = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

function getHawaiiDayOfWeek(): number {
  const now = new Date();
  const hawaiiOffset = -10 * 60;
  const utcMinutes = now.getTime() / 60000 + now.getTimezoneOffset();
  const hawaiiDate = new Date((utcMinutes + hawaiiOffset) * 60000);
  return hawaiiDate.getDay();
}

const STORAGE_KEY = "alohashift_route";

function loadSavedRoute(): { origin: string; destination: string } {
  if (typeof window === "undefined") return { origin: "", destination: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { origin: "", destination: "" };
    return JSON.parse(raw);
  } catch {
    return { origin: "", destination: "" };
  }
}

const inputClass =
  "w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[6px] text-[14px] text-[#111827] bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition placeholder:text-[#9CA3AF]";

const labelClass = "block text-[13px] font-medium text-[#6B7280] mb-1.5";

export default function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const saved = loadSavedRoute();
  const [values, setValues] = useState<FormValues>({
    origin: saved.origin,
    destination: saved.destination,
    startTime: "06:30",
    endTime: "07:30",
    intervalMinutes: 10,
    desiredArrivalTime: "08:00",
    targetDay: getHawaiiDayOfWeek() as TargetDay,
  });

  const setRoute = (origin: string, destination: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ origin, destination }));
    } catch { /* ignore */ }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.origin.trim() || !values.destination.trim()) return;
    onSubmit(values);
  };

  const slotCount = (() => {
    const [sh, sm] = values.startTime.split(":").map(Number);
    const [eh, em] = values.endTime.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (endMin <= startMin) return 0;
    return Math.min(Math.floor((endMin - startMin) / values.intervalMinutes) + 1, 8);
  })();

  const slotWarning = (() => {
    const [sh, sm] = values.startTime.split(":").map(Number);
    const [eh, em] = values.endTime.split(":").map(Number);
    const raw = Math.floor(((eh * 60 + em) - (sh * 60 + sm)) / values.intervalMinutes) + 1;
    if (raw > 8) return `Window capped at 8 slots (${raw} requested)`;
    return null;
  })();

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Origin */}
      <div>
        <label className={labelClass}>Origin</label>
        <PlaceAutocomplete
          label=""
          placeholder="e.g. Ala Moana Center"
          value={values.origin}
          onChange={(val) => { setValues({ ...values, origin: val }); setRoute(val, values.destination); }}
          icon="origin"
        />
      </div>

      {/* Destination */}
      <div>
        <label className={labelClass}>Destination</label>
        <PlaceAutocomplete
          label=""
          placeholder="e.g. Downtown Honolulu"
          value={values.destination}
          onChange={(val) => { setValues({ ...values, destination: val }); setRoute(values.origin, val); }}
          icon="destination"
        />
      </div>

      {/* Day of week */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelClass.replace("mb-1.5", "mb-0")}>Day</label>
          <span className="text-[12px] text-[#9CA3AF]">
            Today (HST): <span className="text-[#6B7280] font-medium">{ALL_DAYS[getHawaiiDayOfWeek()].label}</span>
          </span>
        </div>
        <div className="grid grid-cols-7 gap-0 border border-[#E5E7EB] rounded-[6px] overflow-hidden">
          {ALL_DAYS.map((day, i) => (
            <button
              key={day.value}
              type="button"
              onClick={() => setValues({ ...values, targetDay: day.value })}
              className={`py-2 text-[12px] font-medium transition ${
                i > 0 ? "border-l border-[#E5E7EB]" : ""
              } ${
                values.targetDay === day.value
                  ? "bg-[#2563EB] text-white"
                  : "bg-white text-[#6B7280] hover:bg-[#F9FAFB]"
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Departure window */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelClass.replace("mb-1.5", "mb-0")}>Departure window</label>
          {slotCount > 0 && (
            <span className="text-[12px] text-[#9CA3AF]">
              {slotCount} slot{slotCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={values.startTime}
            onChange={(e) => setValues({ ...values, startTime: e.target.value })}
            className={inputClass}
            required
          />
          <span className="text-[#9CA3AF] text-[13px] shrink-0">to</span>
          <input
            type="time"
            value={values.endTime}
            onChange={(e) => setValues({ ...values, endTime: e.target.value })}
            className={inputClass}
            required
          />
        </div>
        {slotWarning && (
          <p className="text-[12px] text-[#B45309] mt-1.5">{slotWarning}</p>
        )}
      </div>

      {/* Check every */}
      <div>
        <label className={labelClass}>Interval</label>
        <div className="grid grid-cols-3 gap-0 border border-[#E5E7EB] rounded-[6px] overflow-hidden">
          {[10, 15, 20].map((min, i) => (
            <button
              key={min}
              type="button"
              onClick={() => setValues({ ...values, intervalMinutes: min })}
              className={`py-2 text-[13px] font-medium transition ${
                i > 0 ? "border-l border-[#E5E7EB]" : ""
              } ${
                values.intervalMinutes === min
                  ? "bg-[#2563EB] text-white"
                  : "bg-white text-[#6B7280] hover:bg-[#F9FAFB]"
              }`}
            >
              {min} min
            </button>
          ))}
        </div>
      </div>

      {/* Must arrive by */}
      <div>
        <label className={labelClass}>Must arrive by</label>
        <input
          type="time"
          value={values.desiredArrivalTime}
          onChange={(e) => setValues({ ...values, desiredArrivalTime: e.target.value })}
          className={inputClass}
          required
        />
        <p className="text-[12px] text-[#9CA3AF] mt-1.5">
          Slots after this time will be flagged as late risk.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !values.origin.trim() || !values.destination.trim()}
        className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-medium rounded-[6px] transition"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Analyzing...
          </span>
        ) : (
          "Analyze →"
        )}
      </button>

    </form>
  );
}
