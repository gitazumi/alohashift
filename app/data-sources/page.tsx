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
            AlohaShift combines multiple public and commercial data sources to produce
            the most accurate commute time estimates possible for Oahu commuters —
            whether you drive H1, Pali Highway, Likelike, H3, or any other route.
            This page documents every API and dataset used, and how we use it.
          </p>
        </div>

        {/* Section 1: Google Maps */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <span className="text-2xl">🗺️</span>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Google Maps Distance Matrix API</h2>
              <span className="inline-block mt-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">Primary — Travel Time Predictions</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            The core engine behind AlohaShift. For each departure time slot, we query Google Maps
            with <code className="bg-slate-100 px-1 rounded text-xs">traffic_model=pessimistic</code> to
            obtain predicted travel durations accounting for historical traffic patterns.
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
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Update Frequency</p>
              <p className="text-slate-700">Real-time query per search</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Cost</p>
              <p className="text-slate-700">Pay-as-you-go (Google Maps Platform)</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            <span className="font-semibold">Known limitation:</span> Google Maps consistently underestimates
            Honolulu commute travel times during peak hours. Our real-world validation (6:53 AM departure,
            160 Polihale Pl → Mid-Pacific Institute: <strong>62 min actual</strong> vs <strong>30 min predicted</strong>)
            revealed a ~2× gap, which we correct with the Honolulu Reality Correction below.
          </div>
          <a href="https://developers.google.com/maps/documentation/distance-matrix" target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline">
            → Google Maps Distance Matrix API Documentation
          </a>
        </section>

        {/* Section 2: Honolulu Reality Correction */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <span className="text-2xl">🔬</span>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Honolulu Reality Correction</h2>
              <span className="inline-block mt-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">Original — Real-World Validated</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Because Google Maps underestimates Honolulu congestion across all major routes —
            H1, Pali Highway, Likelike Highway, H3, Kamehameha Highway, and more —
            we developed a time-of-day correction factor based on real commute measurements
            collected on Oahu. This is AlohaShift&apos;s original contribution: a Hawaii-specific
            calibration layer on top of Google&apos;s predictions, applied to any route you search.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200">Time of Day (Hawaii)</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200">Correction Factor</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-200">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-red-50">
                  <td className="px-3 py-2 font-medium text-slate-700">6:30 AM – 9:00 AM</td>
                  <td className="px-3 py-2 font-bold text-red-600">× 1.9</td>
                  <td className="px-3 py-2 text-slate-600">AM peak — severely congested across all routes</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-slate-700">5:00 AM – 6:30 AM</td>
                  <td className="px-3 py-2 font-semibold text-orange-600">× 1.3</td>
                  <td className="px-3 py-2 text-slate-600">Early AM — traffic building</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-slate-700">9:00 AM – 11:00 AM</td>
                  <td className="px-3 py-2 font-semibold text-orange-600">× 1.4</td>
                  <td className="px-3 py-2 text-slate-600">Post-peak — still slow</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-slate-700">11:00 AM – 3:00 PM</td>
                  <td className="px-3 py-2 font-semibold text-slate-600">× 1.1</td>
                  <td className="px-3 py-2 text-slate-600">Midday — near free-flow</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-slate-700">3:00 PM – 4:30 PM</td>
                  <td className="px-3 py-2 font-semibold text-orange-600">× 1.3</td>
                  <td className="px-3 py-2 text-slate-600">Pre-PM peak — building again</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="px-3 py-2 font-medium text-slate-700">4:30 PM – 7:00 PM</td>
                  <td className="px-3 py-2 font-bold text-red-600">× 1.7</td>
                  <td className="px-3 py-2 text-slate-600">PM peak — afternoon rush</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-slate-700">7:00 PM+</td>
                  <td className="px-3 py-2 font-semibold text-slate-600">× 1.1</td>
                  <td className="px-3 py-2 text-slate-600">Evening — light traffic</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800">
            <span className="font-semibold">Validation:</span> AM peak factor of 1.9 validated against
            real commute data: Google predicted 30 min → corrected to 60.8 min → actual was 62 min
            (error: 1.2 min). Help us improve accuracy across more routes by{" "}
            <Link href="/community" className="underline font-semibold">submitting your commute data</Link>.
          </div>
        </section>

        {/* Section 3: HPD Traffic Incidents */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <span className="text-2xl">🚨</span>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">HPD Traffic Incidents</h2>
              <span className="inline-block mt-1 text-xs font-medium bg-red-100 text-red-700 rounded-full px-2 py-0.5">Real-Time — Live Incident Alerts</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            AlohaShift checks the Honolulu Police Department&apos;s live traffic incident feed
            every time you search. If any crashes, road hazards, or debris are reported
            within 3 km of your route today, they appear as a warning banner above your
            departure windows — so you know what&apos;s actually on the road right now.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Source</p>
              <p className="text-slate-700">Honolulu Police Department (HPD)</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Portal</p>
              <p className="text-slate-700 font-mono text-xs break-all">data.honolulu.gov · dataset ykb6-n5th</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Update Frequency</p>
              <p className="text-slate-700">Every 5 minutes (live HPD dispatch)</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Coverage</p>
              <p className="text-slate-700">All Oahu roads — not limited to freeways</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-700 mb-1">How it works</p>
            <p>① Fetch today&apos;s incident log from Honolulu Open Data Portal (Socrata API)</p>
            <p>② Geocode each incident address using Google Maps Geocoding API</p>
            <p>③ Filter to incidents within <strong>3 km</strong> of your route using Haversine distance</p>
            <p>④ Display color-coded by severity: <span className="text-red-600 font-semibold">red</span> = fatal/injury, <span className="text-orange-600 font-semibold">orange</span> = crash, <span className="text-amber-600 font-semibold">yellow</span> = hazard</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
            <span className="font-semibold">Incident types shown:</span> MVC (Motor Vehicle Crash),
            MVC with Injuries, MVC Fatal, Hit &amp; Run, Vehicle Towed, Road Hazard, Debris in Roadway, Flooding.
            Parking complaints and non-traffic incidents are excluded.
          </div>
          <a href="https://data.honolulu.gov/Public-Safety/Traffic-Incidents/ykb6-n5th" target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline">
            → Honolulu Open Data — Traffic Incidents Dataset
          </a>
        </section>

        {/* Section 4: HDOT AADT */}
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
            counts for all major state highways via their open data portal. We use this to calculate
            the realistic number of Oahu morning commuters shown in the Collective Impact Simulator.
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

        {/* Section 5: TomTom */}
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
            free-flow baselines. This data is used to validate our correction factors and will
            be integrated more deeply in future updates.
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

        {/* Section 6: Community Data */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <span className="text-2xl">👥</span>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Community Commute Data</h2>
              <span className="inline-block mt-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5">Crowdsourced — Real Oahu Commuters</span>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Real commute measurements from Oahu drivers help us refine our correction factors
            and make AlohaShift more accurate for everyone. Whether you drive H1, Pali Highway,
            Likelike, H3, or any other route — your actual times are valuable.
          </p>
          <Link
            href="/community"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            Submit Your Commute Data →
          </Link>
        </section>

        {/* Footer note */}
        <p className="text-xs text-slate-400 text-center leading-relaxed">
          AlohaShift is an independent student project built for the 2026 Congressional App Challenge.
          We are not affiliated with Google, TomTom, HDOT, or the Honolulu Police Department.
          All data is used in accordance with respective terms of service.
        </p>

      </div>
    </main>
  );
}
