"use client";

import { useState } from "react";
import Link from "next/link";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Parse "HH:MM" (from <input type="time">) → display "6:53 AM"
function formatTime(hhmm: string): string {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr);
  const m = parseInt(mStr);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Calculate travel minutes from two "HH:MM" values
function calcActualMinutes(dep: string, arr: string): number | null {
  if (!dep || !arr) return null;
  const [dh, dm] = dep.split(":").map(Number);
  const [ah, am] = arr.split(":").map(Number);
  let diff = (ah * 60 + am) - (dh * 60 + dm);
  if (diff <= 0) diff += 24 * 60;
  if (diff > 300) return null; // sanity: more than 5h is probably wrong
  return diff;
}

export default function CommunityPage() {
  const [form, setForm] = useState({
    dayOfWeek: "Monday",
    departureTime: "",  // "HH:MM" from <input type="time">
    arrivalTime: "",    // "HH:MM" from <input type="time">
    from: "",
    to: "",
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
      setErrorMsg("Travel time looks incorrect. Please check your departure and arrival times.");
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
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

        {/* Header */}
        <div>
          <Link href="/" className="text-sm text-blue-500 hover:text-blue-700 transition">
            ← Back to AlohaShift
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mt-4">Help Us Get It Right</h1>
          <p className="text-slate-500 mt-2 leading-relaxed">
            AlohaShift learns from real Oahu commuters. Your actual drive times help us
            correct predictions across all routes — not just yours.
          </p>
        </div>

        {/* Why it matters */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 space-y-1">
          <p className="font-semibold">Your data travels further than you think</p>
          <p>
            We analyze which roads your route uses — H1, Pali Highway, Likelike, H3, and more.
            When enough commuters share times on the same corridors, AlohaShift gets more accurate
            for <em>every</em> route that uses those roads, not just yours.
          </p>
        </div>

        {status === "success" ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-3">
            <p className="text-4xl">🤙</p>
            <p className="text-lg font-semibold text-emerald-800">Mahalo! Data received.</p>
            <p className="text-sm text-emerald-600">
              Your commute report helps make AlohaShift more accurate for all Oahu commuters.
            </p>
            <button
              onClick={() => {
                setStatus("idle");
                setForm({ ...form, departureTime: "", arrivalTime: "", notes: "" });
              }}
              className="mt-2 text-sm text-emerald-700 underline hover:no-underline"
            >
              Submit another report
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">

            {/* Day of Week */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Day of Week <span className="text-red-400">*</span>
              </label>
              <select
                value={form.dayOfWeek}
                onChange={e => setForm({ ...form, dayOfWeek: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            {/* Departure + Arrival Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  Departure Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={form.departureTime}
                  onChange={e => setForm({ ...form, departureTime: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  Arrival Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="time"
                  value={form.arrivalTime}
                  onChange={e => setForm({ ...form, arrivalTime: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>

            {/* Calculated actual travel time */}
            {actualMinutes !== null && (
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <span className="text-slate-400 text-lg">⏱</span>
                <div>
                  <p className="text-xs text-slate-400">Actual travel time</p>
                  <p className="text-xl font-bold text-slate-700">{actualMinutes} min</p>
                </div>
                <p className="text-xs text-slate-400 ml-auto">
                  {formatTime(form.departureTime)} → {formatTime(form.arrivalTime)}
                </p>
              </div>
            )}

            {/* From / To */}
            <div className="space-y-4">
              <PlaceAutocomplete
                label="From (departure location) *"
                placeholder="e.g. Ala Moana Center, Honolulu"
                value={form.from}
                onChange={(val) => setForm({ ...form, from: val })}
                icon="origin"
              />
              <PlaceAutocomplete
                label="To (destination) *"
                placeholder="e.g. Honolulu International Airport"
                value={form.to}
                onChange={(val) => setForm({ ...form, to: val })}
                icon="destination"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Notes (optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Accident near Halawa. H1 backed up from the merge."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>

            {/* Error */}
            {errorMsg && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{errorMsg}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              {status === "submitting" ? "Submitting..." : "Submit Commute Report 🤙"}
            </button>

            <p className="text-xs text-slate-400 text-center">
              Your data is used only to improve AlohaShift predictions.
              See our <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </form>
        )}

      </div>
    </main>
  );
}
