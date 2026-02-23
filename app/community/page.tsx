"use client";

import { useState } from "react";
import Link from "next/link";

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

export default function CommunityPage() {
  const [form, setForm] = useState({
    dayOfWeek: "Monday",
    departureTime: "7:00 AM",
    from: "",
    to: "",
    actualMinutes: "",
    alohaShiftMinutes: "",
    notes: "",
    email: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const diff = (() => {
    const actual = parseFloat(form.actualMinutes);
    const predicted = parseFloat(form.alohaShiftMinutes);
    if (!isNaN(actual) && !isNaN(predicted) && predicted > 0) {
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
        body: JSON.stringify(form),
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
            AlohaShift's predictions are based on Google Maps data plus real-world corrections
            from actual Oahu commuters. If you drive H1 regularly, your data makes our predictions
            more accurate for everyone. Takes less than 2 minutes.
          </p>
        </div>

        {/* Why it matters */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 space-y-1">
          <p className="font-semibold">Why your data matters:</p>
          <p>Google Maps predicted <strong>30 min</strong> for a Kapolei → Honolulu commute at 6:53 AM.</p>
          <p>The actual drive took <strong>62 min</strong> — more than twice as long.</p>
          <p>Real commuter reports help us close that gap for everyone who uses AlohaShift.</p>
        </div>

        {status === "success" ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-3">
            <p className="text-4xl">🤙</p>
            <p className="text-lg font-semibold text-emerald-800">Mahalo! Data received.</p>
            <p className="text-sm text-emerald-600">
              Your commute report helps make AlohaShift more accurate for all Oahu commuters.
            </p>
            <button
              onClick={() => { setStatus("idle"); setForm({ ...form, actualMinutes: "", alohaShiftMinutes: "", notes: "" }); }}
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

            {/* From / To */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  From (departure location) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 160 Polihale Pl, Kapolei"
                  value={form.from}
                  onChange={e => setForm({ ...form, from: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                  To (destination) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mid-Pacific Institute, Honolulu"
                  value={form.to}
                  onChange={e => setForm({ ...form, to: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>

            {/* Actual vs Predicted */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Travel Time Comparison
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">
                    ⏱ Actual travel time (minutes) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1} max={180}
                    placeholder="e.g. 62"
                    value={form.actualMinutes}
                    onChange={e => setForm({ ...form, actualMinutes: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">
                    📱 AlohaShift predicted (minutes)
                  </label>
                  <input
                    type="number"
                    min={1} max={180}
                    placeholder="e.g. 41"
                    value={form.alohaShiftMinutes}
                    onChange={e => setForm({ ...form, alohaShiftMinutes: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>

              {/* Live diff display */}
              {diff !== null && (
                <div className={`mt-3 rounded-xl p-3 text-sm font-medium text-center ${
                  Math.abs(diff.pct) <= 10
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : diff.d > 0
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}>
                  {diff.d > 0
                    ? `AlohaShift underestimated by ${diff.d} min (${diff.pct}% off)`
                    : diff.d < 0
                    ? `AlohaShift overestimated by ${Math.abs(diff.d)} min (${Math.abs(diff.pct)}% off)`
                    : `Perfect match! AlohaShift was exactly right.`
                  }
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Additional Notes (optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. There was an accident near Halawa. H1 westbound was clear but eastbound was stopped."
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>

            {/* Email (optional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Your Email (optional — only if you want updates)
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <p className="text-xs text-slate-400 mt-1">We will never share your email. Used only to notify you when your data improves AlohaShift.</p>
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
