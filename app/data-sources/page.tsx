import Link from "next/link";

export const metadata = {
  title: "Data Sources | AlohaShift",
  description: "APIs and data sources used by AlohaShift to power Honolulu commute intelligence.",
};

export default function DataSourcesPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        {/* Header */}
        <div>
          <Link href="/" className="text-sm text-blue-500 hover:text-blue-700 transition">
            ← Back to AlohaShift
          </Link>
          <h1 className="text-3xl font-bold text-slate-800 mt-4">Data Sources</h1>
          <p className="text-slate-500 mt-2 leading-relaxed">
            AlohaShift combines real commute data from Oahu drivers with public APIs
            to produce accurate departure time recommendations. This page documents
            every data source used and how each one contributes to predictions.
          </p>
        </div>

        {/* Section 1: Community Commute Data — CORE */}
        <section className="bg-white rounded-2xl border-2 border-emerald-300 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <span className="text-2xl">👥</span>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Community Commute Data</h2>
              <span className="inline-block mt-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">Core — Real Oahu Commuters</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            The most important data source in AlohaShift. Real commute times submitted by
            Oahu drivers are the ground truth that no API can replicate. Every report
            contributes to more accurate predictions — not just for that exact route,
            but for <strong>all routes sharing the same road corridors</strong>.
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 space-y-2">
            <p className="font-semibold">How one report helps many routes</p>
            <p>
              When you submit a commute from Pearl City → Downtown Honolulu, we extract
              which highways your route used — for example <code className="bg-emerald-100 px-1 rounded text-xs">["H1", "Moanalua Freeway"]</code>.
              That data then improves predictions for <em>any</em> other route using H1 or
              the Moanalua Freeway at the same time of day — Ewa Beach → UH Manoa,
              Aiea → Kapiolani Medical Center, and more.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 space-y-1.5">
            <p className="font-semibold text-slate-700 mb-2">How it works</p>
            <p>① You submit departure time, arrival time, and your route</p>
            <p>② We calculate your actual travel time automatically (arrival − departure)</p>
            <p>③ Google Directions API identifies which Oahu corridors your route uses</p>
            <p>④ The report is saved to our database with corridor tags (H1, Pali Hwy, etc.)</p>
            <p>⑤ Future searches on overlapping routes draw from your data to calibrate predictions</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Corridors Tracked</p>
            <p className="text-slate-700">H1, H2, H3, Pali Highway, Likelike Highway, Kalanianaole Highway, Kamehameha Highway, Nimitz Highway, Farrington Highway, and more</p>
          </div>

          <Link
            href="/community"
            className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            Submit Your Commute Data →
          </Link>
        </section>

        {/* Section 2: Google Maps */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <span className="text-2xl">🗺️</span>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Google Maps Distance Matrix API</h2>
              <span className="inline-block mt-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">Primary — Travel Time Baseline</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            For each departure time slot, we query Google Maps with{" "}
            <code className="bg-slate-100 px-1 rounded text-xs">traffic_model=pessimistic</code> to
            obtain predicted travel durations. This forms the baseline that community data
            is used to calibrate and correct over time.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Endpoint</p>
              <p className="text-slate-700 font-mono text-xs break-all">maps.googleapis.com/maps/api/distancematrix</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Traffic Model</p>
              <p className="text-slate-700"><code className="text-xs bg-slate-200 px-1 rounded">pessimistic</code> — worst-case historical scenario</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Also used for</p>
              <p className="text-slate-700">Directions API — extracting route corridor names from commute reports</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Update Frequency</p>
              <p className="text-slate-700">Real-time query per search</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            <span className="font-semibold">Known limitation:</span> Google Maps underestimates
            Honolulu peak-hour travel times. Real commute data (6:53 AM, Hawaii Kai →
            Mid-Pacific Institute) showed <strong>62 min actual</strong> vs <strong>30 min predicted</strong> —
            a 2× gap. Community data is how we close this gap over time.
          </div>
          <a href="https://developers.google.com/maps/documentation/distance-matrix" target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline">
            → Google Maps Distance Matrix API Documentation
          </a>
        </section>

        {/* Section 3: HDOT AADT */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <span className="text-2xl">🏛️</span>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">HDOT HPMS Dataset</h2>
              <span className="inline-block mt-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">Government Open Data — Commuter Count</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            The Hawaii Department of Transportation (HDOT) publishes Annual Average Daily Traffic (AADT)
            counts for all major state highways. We use this to calculate the realistic number
            of Oahu morning commuters shown in the Collective Impact Simulator.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Dataset</p>
              <p className="text-slate-700">HPMS (Highway Performance Monitoring System)</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">API</p>
              <p className="text-slate-700 font-mono text-xs break-all">highways.hidot.hawaii.gov/resource/3jb9-z582.json</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Key Finding</p>
              <p className="text-slate-700">H1 peak section AADT = <strong>65,800 vehicles/day</strong></p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Derived Estimate</p>
              <p className="text-slate-700"><strong>~10,857</strong> Oahu morning commuters (6–9 AM)</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
            <span className="font-semibold">Calculation:</span> 65,800 vehicles/day × 15% (morning rush share) × 1.1 (avg occupancy) = 10,857 commuters
          </div>
          <a href="https://highways.hidot.hawaii.gov/resource/3jb9-z582.json" target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline">
            → HDOT Open Data Portal
          </a>
        </section>

        {/* Section 4: TomTom */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <span className="text-2xl">📡</span>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">TomTom Traffic Flow API</h2>
              <span className="inline-block mt-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">Supplemental — Real-Time Speed Validation</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            We use TomTom&apos;s Traffic Flow API to cross-check real-time Oahu road speeds against
            free-flow baselines. This data is used to validate correction factors and will
            be integrated more deeply as community data grows.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Endpoint</p>
              <p className="text-slate-700 font-mono text-xs break-all">api.tomtom.com/traffic/services/4/flowSegmentData</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Update Frequency</p>
              <p className="text-slate-700">Every 2 minutes (real-time)</p>
            </div>
          </div>
          <a href="https://developer.tomtom.com/traffic-api/" target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline">
            → TomTom Traffic API Documentation
          </a>
        </section>

        {/* Footer note */}
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          AlohaShift is an independent student project built for the 2026 Congressional App Challenge.
          We are not affiliated with Google, TomTom, or HDOT.
          All data is used in accordance with respective terms of service.
        </p>

      </div>
    </main>
  );
}
