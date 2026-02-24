"use client";

import { useState } from "react";
import Link from "next/link";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  "5:00 AM", "5:15 AM", "5:30 AM", "5:45 AM",
  "6:00 AM", "6:15 AM", "6:30 AM", "6:45 AM",
  "7:00 AM", "7:15 AM", "7:30 AM", "7:45 AM",
  "8:00 AM", "8:15 AM", "8:30 AM", "8:45 AM",
  "9:00 AM", "9:15 AM", "9:30 AM", "9:45 AM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM",
  "7:00 PM",
];

// Convert "7:00 AM" → "07:00" for time input
function slotToTime(slot: string): string {
  const [time, ampm] = slot.split(" ");
  const [h, m] = time.split(":").map(Number);
  const hour24 = ampm === "PM" && h !== 12 ? h + 12 : ampm === "AM" && h === 12 ? 0 : h;
  return `${String(hour24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function CommunityPage() {
  const [form, setForm] = useState({
    dayOfWeek: "Monday",
    departureTime: "7:00 AM",
    from: "",
    to: "",
    actualMinutes: "",
    notes: "",
    email: "",
  });

  const [predicted, setPredicted] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Fetch AlohaShift prediction automatically
  const fetchPrediction = async () => {
    if (!form.from || !form.to) {
      setFetchError("Please enter From and To locations first.");
      return;
    }
    setIsFetching(true);
    setFetchError("");
    setPredicted(null);

    try {
      // Build departure timestamp for selected day + time
      const HAWAII_OFFSET_MS = -10 * 60 * 60 * 1000;
      const nowUtcMs = Date.now();
      const nowHawaiiMs = nowUtcMs + HAWAII_OFFSET_MS;
      const nowHawaii = new Date(nowHawaiiMs);
      const hawaiiDayOfWeek = nowHawaii.getUTCDay();
      const targetDayNum = DAYS.indexOf(form.dayOfWeek);
      let daysAhead = (targetDayNum - hawaiiDayOfWeek + 7) % 7;
      const targetHawaii = new Date(nowHawaiiMs + daysAhead * 24 * 60 * 60 * 1000);
      const year  = targetHawaii.getUTCFullYear();
      const month = targetHawaii.getUTCMonth();
      const day   = targetHawaii.getUTCDate();

      const timeStr = slotToTime(form.departureTime);
      const [h, m] = timeStr.split(":").map(Number);
      let depUtcMs = Date.UTC(year, month, day, h + 10, m, 0, 0);
      if (depUtcMs < nowUtcMs) depUtcMs += 7 * 24 * 60 * 60 * 1000;
      const depTimestamp = Math.floor(depUtcMs / 1000);

      const res = await fetch("/api/eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: form.from,
          destination: form.to,
          departureTimes: [depTimestamp],
        }),
      });

      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const result = data.results?.[0];
      if (result?.status === "OK" && result.durationInTrafficSeconds) {
        setPredicted(Math.round(result.durationInTrafficSeconds / 60));
      } else {
        setFetchError("Could not get prediction for this route. Please check the addresses.");
      }
    } catch {
      setFetchError("Failed to fetch prediction. Please try again.");
    } finally {
      setIsFetching(false);
    }
  };

  const diff = (() => {
    const actual = parseFloat(form.actualMinutes);
    if (!isNaN(actual) && predicted !== null && predicted > 0) {
      const d = actual - predicted;
      const pct = Math.round((d / predicted) * 100);
      return { d, pct };
    }
    return null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.from || !form.to || !form.actualMinutes || !form.departureTime) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, alohaShiftMinutes: predicted?.toString() ?? "" }),
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
            AlohaShift uses Google Maps data plus real-world corrections from actual Oahu commuters.
            Whether you drive H1, Pali Highway, or any other route — your real commute times
            help make predictions more accurate for everyone.
          </p>
        </div>

        {/* Why it matters */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 space-y-1">
          <p className="font-semibold">Why your data matters:</p>
          <p>Google Maps and AlohaShift use historical traffic models — but Honolulu's real
          conditions often differ from predictions.</p>
          <p>The more real commute data we collect across different routes and times, the more
          accurate AlohaShift becomes for all Oahu commuters.</p>
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
                setForm({ ...form, actualMinutes: "", notes: "" });
                setPredicted(null);
              }}
              className="mt-2 text-sm text-emerald-700 underline hover:no-underline"
            >
              Submit another report
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">

            {/* Day + Time */}
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  Departure Time <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.departureTime}
                  onChange={e => setForm({ ...form, departureTime: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* From / To — Google Places Autocomplete */}
            <div className="space-y-4">
              <PlaceAutocomplete
                label="From (departure location) *"
                placeholder="e.g. Ala Moana Center, Honolulu"
                value={form.from}
                onChange={(val) => { setForm({ ...form, from: val }); setPredicted(null); }}
                icon="origin"
              />
              <PlaceAutocomplete
                label="To (destination) *"
                placeholder="e.g. Honolulu International Airport"
                value={form.to}
                onChange={(val) => { setForm({ ...form, to: val }); setPredicted(null); }}
                icon="destination"
              />
            </div>

            {/* AlohaShift Prediction — auto fetch */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">AlohaShift Prediction</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    We'll fetch the predicted travel time automatically for your route and time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchPrediction}
                  disabled={isFetching || !form.from || !form.to}
                  className="shrink-0 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                >
                  {isFetching ? "Fetching..." : "Fetch →"}
                </button>
              </div>

              {fetchError && (
                <p className="text-xs text-red-500">{fetchError}</p>
              )}

              {predicted !== null && (
                <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-4 py-3">
                  <span className="text-blue-500 text-lg">📱</span>
                  <div>
                    <p className="text-xs text-slate-400">AlohaShift predicts</p>
                    <p className="text-xl font-bold text-blue-600">{predicted} min</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actual travel time */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                ⏱ Your Actual Travel Time (minutes) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={1} max={180}
                placeholder="e.g. 45"
                value={form.actualMinutes}
                onChange={e => setForm({ ...form, actualMinutes: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <p className="text-xs text-slate-400 mt-1">
                Door-to-door time from when you left to when you arrived.
              </p>
            </div>

            {/* Live diff display */}
            {diff !== null && (
              <div className={`rounded-xl p-4 text-sm font-medium text-center ${
                Math.abs(diff.pct) <= 10
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : diff.d > 0
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}>
                {diff.d > 0
                  ? `AlohaShift underestimated by ${diff.d} min (${diff.pct}% off) — your data will help fix this!`
                  : diff.d < 0
                  ? `AlohaShift overestimated by ${Math.abs(diff.d)} min (${Math.abs(diff.pct)}% off)`
                  : `Perfect match! AlohaShift nailed it.`
                }
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Additional Notes (optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. There was an accident near Halawa. H1 was backed up from the merge."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Your Email (optional)
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <p className="text-xs text-slate-400 mt-1">Only used to notify you when your data improves AlohaShift. Never shared.</p>
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
