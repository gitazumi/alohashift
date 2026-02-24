"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Parse free-form time like "6:53", "653", "6:53 AM", "7" → "HH:MM" (24h) or null
function parseTimeInput(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return null;

  // "HH:MM AM/PM" or "H:MM AM/PM"
  const ampmMatch = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1]);
    const m = parseInt(ampmMatch[2]);
    const ampm = ampmMatch[3];
    if (ampm === "pm" && h !== 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    if (h > 23 || m > 59) return null;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // "H:MM" or "HH:MM"
  const colonMatch = s.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    const h = parseInt(colonMatch[1]);
    const m = parseInt(colonMatch[2]);
    if (h > 23 || m > 59) return null;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // "653" or "700" (4 digits)
  const digitsMatch = s.match(/^(\d{3,4})$/);
  if (digitsMatch) {
    const n = digitsMatch[1];
    const h = n.length === 3 ? parseInt(n[0]) : parseInt(n.slice(0, 2));
    const m = parseInt(n.slice(-2));
    if (h > 23 || m > 59) return null;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // Single number like "7" → 7:00
  const singleMatch = s.match(/^(\d{1,2})$/);
  if (singleMatch) {
    const h = parseInt(singleMatch[1]);
    if (h > 23) return null;
    return `${String(h).padStart(2, "0")}:00`;
  }

  return null;
}

// Format "07:30" → "7:30 AM"
function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr);
  const m = parseInt(mStr);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// Calculate travel minutes from departure "HH:MM" and arrival "HH:MM"
// Handles overnight (arrival < departure → +24h)
function calcActualMinutes(dep: string, arr: string): number | null {
  const depParsed = parseTimeInput(dep);
  const arrParsed = parseTimeInput(arr);
  if (!depParsed || !arrParsed) return null;
  const [dh, dm] = depParsed.split(":").map(Number);
  const [ah, am] = arrParsed.split(":").map(Number);
  let diff = (ah * 60 + am) - (dh * 60 + dm);
  if (diff <= 0) diff += 24 * 60;
  if (diff > 300) return null; // sanity check: more than 5h is probably wrong
  return diff;
}

export default function CommunityPage() {
  const [form, setForm] = useState({
    dayOfWeek: "Monday",
    departureTime: "",   // free-form, e.g. "6:53"
    arrivalTime: "",     // free-form, e.g. "7:55"
    from: "",
    to: "",
    notes: "",
  });

  const [predicted, setPredicted] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Derived: parsed departure/arrival and actual minutes
  const depParsed = parseTimeInput(form.departureTime);
  const arrParsed = parseTimeInput(form.arrivalTime);
  const actualMinutes = calcActualMinutes(form.departureTime, form.arrivalTime);

  // Auto-fetch prediction in background when From + To + Day + departureTime are all set
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!form.from || !form.to || !depParsed) {
      setPredicted(null);
      setFetchError("");
      return;
    }

    // Debounce: wait 800ms after last change before fetching
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(async () => {
      setIsFetching(true);
      setFetchError("");
      setPredicted(null);

      try {
        const HAWAII_OFFSET_MS = -10 * 60 * 60 * 1000;
        const nowUtcMs = Date.now();
        const nowHawaiiMs = nowUtcMs + HAWAII_OFFSET_MS;
        const nowHawaii = new Date(nowHawaiiMs);
        const hawaiiDayOfWeek = nowHawaii.getUTCDay();
        const targetDayNum = DAYS.indexOf(form.dayOfWeek);
        const daysAhead = (targetDayNum - hawaiiDayOfWeek + 7) % 7;
        const targetHawaii = new Date(nowHawaiiMs + daysAhead * 24 * 60 * 60 * 1000);
        const year  = targetHawaii.getUTCFullYear();
        const month = targetHawaii.getUTCMonth();
        const day   = targetHawaii.getUTCDate();

        const [h, m] = depParsed.split(":").map(Number);
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
          setFetchError("Could not get prediction. Check the addresses.");
        }
      } catch {
        setFetchError("Failed to fetch prediction.");
      } finally {
        setIsFetching(false);
      }
    }, 800);

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.from, form.to, form.dayOfWeek, depParsed]);

  const diff = (() => {
    if (actualMinutes !== null && predicted !== null && predicted > 0) {
      const d = actualMinutes - predicted;
      const pct = Math.round((d / predicted) * 100);
      return { d, pct };
    }
    return null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.from || !form.to || !form.departureTime || !form.arrivalTime) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    if (!depParsed) {
      setErrorMsg("Departure time format is invalid. Try e.g. 6:53 or 7:00.");
      return;
    }
    if (!arrParsed) {
      setErrorMsg("Arrival time format is invalid. Try e.g. 7:55 or 8:30.");
      return;
    }
    if (actualMinutes === null) {
      setErrorMsg("Could not calculate travel time. Please check departure and arrival times.");
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
          departureTime: depParsed ? formatTime(depParsed) : form.departureTime,
          from: form.from,
          to: form.to,
          actualMinutes: String(actualMinutes),
          alohaShiftMinutes: predicted?.toString() ?? "",
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
            AlohaShift uses Google Maps data plus real-world corrections from actual Oahu commuters.
            Whether you drive H1, Pali Highway, or any other route — your real commute times
            help make predictions more accurate for everyone.
          </p>
        </div>

        {/* Why it matters */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 space-y-1">
          <p className="font-semibold">Why your data matters:</p>
          <p>Google Maps and AlohaShift use historical traffic models — but Honolulu&apos;s real
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
                setForm({ ...form, departureTime: "", arrivalTime: "", notes: "" });
                setPredicted(null);
              }}
              className="mt-2 text-sm text-emerald-700 underline hover:no-underline"
            >
              Submit another report
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">

            {/* Day + Departure Time */}
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
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 6:53"
                  value={form.departureTime}
                  onChange={e => setForm({ ...form, departureTime: e.target.value })}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    form.departureTime && !depParsed
                      ? "border-red-300 bg-red-50"
                      : "border-slate-200"
                  }`}
                />
                {depParsed && (
                  <p className="text-xs text-emerald-600 mt-1">{formatTime(depParsed)}</p>
                )}
                {form.departureTime && !depParsed && (
                  <p className="text-xs text-red-500 mt-1">Invalid time format</p>
                )}
              </div>
            </div>

            {/* Arrival Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Arrival Time <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 7:55"
                value={form.arrivalTime}
                onChange={e => setForm({ ...form, arrivalTime: e.target.value })}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                  form.arrivalTime && !arrParsed
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200"
                }`}
              />
              {arrParsed && (
                <p className="text-xs text-emerald-600 mt-1">{formatTime(arrParsed)}</p>
              )}
              {form.arrivalTime && !arrParsed && (
                <p className="text-xs text-red-500 mt-1">Invalid time format</p>
              )}
            </div>

            {/* Calculated actual travel time */}
            {actualMinutes !== null && (
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <span className="text-slate-400 text-lg">⏱</span>
                <div>
                  <p className="text-xs text-slate-400">Actual travel time (calculated)</p>
                  <p className="text-xl font-bold text-slate-700">{actualMinutes} min</p>
                </div>
              </div>
            )}

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

            {/* AlohaShift Prediction — auto-fetched in background */}
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-700">AlohaShift Prediction</p>
                {isFetching && (
                  <span className="text-xs text-slate-400 animate-pulse">Fetching...</span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Automatically fetched when your route and departure time are set.
              </p>

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

              {!predicted && !isFetching && !fetchError && (
                <p className="text-xs text-slate-300">
                  {(!form.from || !form.to) ? "Enter From and To locations to get a prediction." :
                   !depParsed ? "Enter departure time to get a prediction." :
                   "Prediction will appear here."}
                </p>
              )}
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
