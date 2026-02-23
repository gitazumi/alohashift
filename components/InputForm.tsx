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
  { label: "Tue", value: 2, isWeekend: false },
  { label: "Wed", value: 3, isWeekend: false },
  { label: "Thu", value: 4, isWeekend: false },
  { label: "Fri", value: 5, isWeekend: false },
  { label: "Sat", value: 6, isWeekend: true },
];

// Get current day of week in Hawaii Standard Time (UTC-10)
function getHawaiiDayOfWeek(): number {
  const now = new Date();
  // Hawaii is UTC-10 (no daylight saving time)
  const hawaiiOffset = -10 * 60; // minutes
  const utcMinutes = now.getTime() / 60000 + now.getTimezoneOffset();
  const hawaiiDate = new Date((utcMinutes + hawaiiOffset) * 60000);
  return hawaiiDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
}

export default function InputForm({ onSubmit, isLoading }: InputFormProps) {
  const [values, setValues] = useState<FormValues>({
    origin: "",
    destination: "",
    startTime: "06:30",
    endTime: "07:30",
    intervalMinutes: 10,
    desiredArrivalTime: "07:45",
    targetDay: getHawaiiDayOfWeek() as TargetDay, // Auto-detect Hawaii day
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.origin.trim() || !values.destination.trim()) return;
    onSubmit(values);
  };

  // Calculate how many slots the current window/interval produces
  const slotCount = (() => {
    const [sh, sm] = values.startTime.split(":").map(Number);
    const [eh, em] = values.endTime.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (endMin <= startMin) return 0;
    const raw = Math.floor((endMin - startMin) / values.intervalMinutes) + 1;
    return Math.min(raw, 8); // capped at 8
  })();

  const slotWarning = (() => {
    const [sh, sm] = values.startTime.split(":").map(Number);
    const [eh, em] = values.endTime.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    if (endMin <= startMin) return null;
    const raw = Math.floor((endMin - startMin) / values.intervalMinutes) + 1;
    if (raw > 8) return `Window too wide — only the first 8 of ${raw} slots will be checked.`;
    return null;
  })();

  return (
    <section className="px-6 py-12 bg-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Plan your commute
        </h2>
        <p className="text-sm text-slate-400 mb-8">
          Set your departure window and day of week to compare predicted arrival times side by side.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Origin */}
          <PlaceAutocomplete
            label="Origin"
            placeholder="e.g. Ala Moana Center, Honolulu"
            value={values.origin}
            onChange={(val) => setValues({ ...values, origin: val })}
            icon="origin"
          />

          {/* Destination */}
          <PlaceAutocomplete
            label="Destination"
            placeholder="e.g. Honolulu International Airport"
            value={values.destination}
            onChange={(val) => setValues({ ...values, destination: val })}
            icon="destination"
          />

          {/* Day of week */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Day of Week
              </label>
              <span className="text-xs text-blue-400 font-medium">
                📍 Today in Hawaii: {DAYS[getHawaiiDayOfWeek()].label}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() =>
                    setValues({ ...values, targetDay: day.value })
                  }
                  className={`py-2 rounded-lg text-xs font-semibold border transition ${
                    values.targetDay === day.value
                      ? day.isWeekend
                        ? "bg-slate-700 text-white border-slate-700"
                        : "bg-blue-500 text-white border-blue-500"
                      : day.isWeekend
                      ? "bg-white text-slate-400 border-slate-200 hover:border-slate-400"
                      : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <span className="text-xs">{day.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Departure time range */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Departure Window
              </label>
              {slotCount > 0 && (
                <span className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-600">{slotCount}</span> slot{slotCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">From</p>
                <input
                  type="time"
                  value={values.startTime}
                  onChange={(e) =>
                    setValues({ ...values, startTime: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
                  required
                />
              </div>
              <span className="text-slate-300 mt-5">→</span>
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">To</p>
                <input
                  type="time"
                  value={values.endTime}
                  onChange={(e) =>
                    setValues({ ...values, endTime: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
                  required
                />
              </div>
            </div>
            {slotWarning && (
              <p className="text-xs text-amber-500 mt-2">⚠ {slotWarning}</p>
            )}
          </div>

          {/* Interval */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Interval
            </label>
            <div className="flex gap-2">
              {[10, 15, 20].map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() =>
                    setValues({ ...values, intervalMinutes: min })
                  }
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                    values.intervalMinutes === min
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  every {min} min
                </button>
              ))}
            </div>
          </div>

          {/* Desired Arrival Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Must Arrive By
            </label>
            <input
              type="time"
              value={values.desiredArrivalTime}
              onChange={(e) =>
                setValues({ ...values, desiredArrivalTime: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
              required
            />
            <p className="text-xs text-slate-400 mt-1.5">
              Each departure slot will be color-coded based on whether you arrive on time.
            </p>
          </div>

          <button
            type="submit"
            disabled={
              isLoading ||
              !values.origin.trim() ||
              !values.destination.trim()
            }
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-sm tracking-wide shadow-sm shadow-blue-200"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Fetching traffic data...
              </span>
            ) : (
              "Visualize Time Shift →"
            )}
          </button>
        </form>
      </div>
    </section>
  );
}
