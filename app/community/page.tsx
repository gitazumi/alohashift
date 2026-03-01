"use client";

import { useState } from "react";
import Link from "next/link";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

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

function saveRoute(origin: string, destination: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ origin, destination }));
  } catch {
    // ignore
  }
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getTodayHawaii(): string {
  const hawaiiMs = Date.now() + (-10 * 60 * 60 * 1000);
  const dayIndex = new Date(hawaiiMs).getUTCDay();
  return DAYS[dayIndex];
}

function formatTime(hhmm: string): string {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr);
  const m = parseInt(mStr);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function calcActualMinutes(dep: string, arr: string): number | null {
  if (!dep || !arr) return null;
  const [dh, dm] = dep.split(":").map(Number);
  const [ah, am] = arr.split(":").map(Number);
  let diff = (ah * 60 + am) - (dh * 60 + dm);
  if (diff <= 0) diff += 24 * 60;
  if (diff < 5) return null;
  if (diff > 240) return null;
  return diff;
}

const inputClass =
  "w-full px-3 py-2.5 border border-[#E5E7EB] rounded-[6px] text-[14px] text-[#111827] bg-white focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition placeholder:text-[#9CA3AF]";

const labelClass = "block text-[13px] font-medium text-[#6B7280] mb-1.5";

export default function CommunityPage() {
  const saved = loadSavedRoute();
  const [form, setForm] = useState({
    dayOfWeek: getTodayHawaii(),
    departureTime: "",
    arrivalTime: "",
    from: saved.origin,
    to: saved.destination,
    notes: "",
  });

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const actualMinutes = calcActualMinutes(form.departureTime, form.arrivalTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.from || !form.to || !form.departureTime || !form.arrivalTime) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (actualMinutes === null) {
      setErrorMsg("Travel time must be between 5 and 240 minutes. Please check your times.");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: form.dayOfWeek,
          departureTime: formatTime(form.departureTime),
          from: form.from,
          to: form.to,
          actualMinutes: String(actualMinutes),
          alohaShiftMinutes: "",
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-2xl mx-auto px-8 pt-8 pb-20">

        {/* Page header */}
        <div className="mb-8 pb-6 border-b border-[#E5E7EB]">
          <h1 className="text-[28px] font-semibold text-[#111827] tracking-tight">
            Submit Commute Data
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Help improve prediction accuracy · No account needed · Community-powered
          </p>
        </div>

        {/* Info note */}
        <div className="border border-[#E5E7EB] rounded-[4px] bg-white px-4 py-3 mb-6 text-[13px] text-[#6B7280] leading-relaxed">
          <span className="font-medium text-[#111827]">Your data travels further than you think.</span>{" "}
          We analyze which corridors your route uses — H1, Pali Hwy, Likelike, H3, and more.
          When enough commuters share times on the same corridors, predictions improve for every overlapping route.
        </div>

        {status === "success" ? (
          <div className="border border-[#E5E7EB] rounded-[4px] bg-white px-6 py-10 text-center">
            <p className="text-[14px] font-semibold text-[#111827] mb-1">Data received — mahalo.</p>
            <p className="text-[13px] text-[#6B7280] mb-5">
              Your commute report helps make AlohaShift more accurate for all Oahu commuters.
            </p>
            <button
              onClick={() => {
                setStatus("idle");
                setForm({ ...form, departureTime: "", arrivalTime: "", notes: "" });
              }}
              className="text-[13px] text-[#2563EB] hover:text-[#1D4ED8] transition"
            >
              Submit another report →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="border border-[#E5E7EB] rounded-[4px] bg-white p-6 space-y-5">

            {/* Day of Week */}
            <div>
              <label className={labelClass}>
                Day of week <span className="text-[#B45309]">*</span>
              </label>
              <select
                value={form.dayOfWeek}
                onChange={e => setForm({ ...form, dayOfWeek: e.target.value })}
                className={inputClass}
              >
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            {/* Departure + Arrival Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Departure time <span className="text-[#B45309]">*</span>
                </label>
                <input
                  type="time"
                  value={form.departureTime}
                  onChange={e => setForm({ ...form, departureTime: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Arrival time <span className="text-[#B45309]">*</span>
                </label>
                <input
                  type="time"
                  value={form.arrivalTime}
                  onChange={e => setForm({ ...form, arrivalTime: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Calculated actual travel time */}
            {actualMinutes !== null && (
              <div className="flex items-center gap-4 border border-[#E5E7EB] rounded-[4px] px-4 py-3">
                <div>
                  <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-0.5">Actual travel time</p>
                  <p className="text-[22px] font-semibold text-[#111827] tabular-nums leading-none">
                    {actualMinutes}
                    <span className="text-[14px] font-normal text-[#6B7280] ml-1">min</span>
                  </p>
                </div>
                <p className="text-[12px] text-[#9CA3AF] ml-auto tabular-nums">
                  {formatTime(form.departureTime)} → {formatTime(form.arrivalTime)}
                </p>
              </div>
            )}

            {/* From / To */}
            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  From <span className="text-[#B45309]">*</span>
                </label>
                <PlaceAutocomplete
                  label=""
                  placeholder="e.g. Ala Moana Center, Honolulu"
                  value={form.from}
                  onChange={(val) => {
                    setForm({ ...form, from: val });
                    saveRoute(val, form.to);
                  }}
                  icon="origin"
                />
              </div>
              <div>
                <label className={labelClass}>
                  To <span className="text-[#B45309]">*</span>
                </label>
                <PlaceAutocomplete
                  label=""
                  placeholder="e.g. Honolulu International Airport"
                  value={form.to}
                  onChange={(val) => {
                    setForm({ ...form, to: val });
                    saveRoute(form.from, val);
                  }}
                  icon="destination"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>
                Notes <span className="text-[12px] font-normal text-[#9CA3AF]">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Accident near Halawa. H1 backed up from the merge."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="border border-[#E5E7EB] rounded-[4px] px-4 py-3 text-[13px] text-[#B45309]">
                <span className="font-medium">Error:</span> {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full h-11 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-medium rounded-[6px] transition"
            >
              {status === "submitting" ? "Submitting..." : "Submit commute report →"}
            </button>

            <p className="text-[12px] text-[#9CA3AF] text-center">
              Used only to improve AlohaShift predictions.{" "}
              <Link href="/privacy" className="text-[#2563EB] hover:text-[#1D4ED8]">Privacy Policy</Link>
            </p>
          </form>
        )}

      </div>
    </main>
  );
}
