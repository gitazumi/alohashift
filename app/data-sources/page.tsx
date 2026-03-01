import Link from "next/link";

export const metadata = {
  title: "Data Sources | AlohaShift",
  description: "APIs and data sources used by AlohaShift to power Honolulu commute intelligence.",
};

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2.5 border-b border-[#E5E7EB] last:border-b-0">
      <span className="w-36 shrink-0 text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wide pt-0.5">{label}</span>
      <span className="text-[13px] text-[#111827] leading-relaxed">{value}</span>
    </div>
  );
}

export default function DataSourcesPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-8 pt-8 pb-20">

        {/* Page header */}
        <div className="mb-8 pb-6 border-b border-[#E5E7EB]">
          <h1 className="text-[28px] font-semibold text-[#111827] tracking-tight">
            Data Sources
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Every source used to power Oahu commute predictions
          </p>
        </div>

        <div className="space-y-6">

          {/* Section 1: Community Commute Data */}
          <div className="border border-[#E5E7EB] rounded-[4px] bg-white">
            <div className="px-6 py-4 border-b border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-[#111827]">Community Commute Data</h2>
                <span className="text-[11px] font-medium text-[#15803D] uppercase tracking-wide">Core source</span>
              </div>
              <p className="text-[12px] text-[#6B7280] mt-0.5">Real Oahu commuters</p>
            </div>
            <div className="px-6 py-4 text-[13px] text-[#6B7280] leading-relaxed space-y-3">
              <p>
                The most important data source in AlohaShift. Real commute times submitted by
                Oahu drivers are the ground truth that no API can replicate. Every report
                contributes to more accurate predictions — not just for that exact route,
                but for <strong className="text-[#111827]">all routes sharing the same road corridors</strong>.
              </p>
              <div className="border border-[#E5E7EB] rounded-[4px] p-4 space-y-2">
                <p className="text-[13px] font-medium text-[#111827]">How one report helps many routes</p>
                <p>
                  When you submit a commute from Pearl City to Downtown Honolulu, we extract
                  which highways your route used — H1, Moanalua Freeway, etc. That data then
                  improves predictions for any other route using those corridors at the same
                  time of day: Ewa Beach to UH Manoa, Aiea to Kapiolani Medical Center, and more.
                </p>
              </div>
              <div className="space-y-0">
                <DataRow label="Step 1" value="You submit departure time, arrival time, and your route" />
                <DataRow label="Step 2" value="We calculate actual travel time (arrival − departure)" />
                <DataRow label="Step 3" value="Google Directions API identifies which Oahu corridors your route uses" />
                <DataRow label="Step 4" value="Report is saved to database with corridor tags (H1, Pali Hwy, etc.)" />
                <DataRow label="Step 5" value="Future searches on overlapping routes draw from your data to calibrate predictions" />
              </div>
              <div className="border border-[#E5E7EB] rounded-[4px] p-4">
                <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wide mb-1.5">Corridors tracked</p>
                <p className="text-[13px] text-[#111827]">
                  H1, H2, H3, Pali Highway, Likelike Highway, Kalanianaole Highway,
                  Kamehameha Highway, Nimitz Highway, Farrington Highway, and more
                </p>
              </div>
              <div className="pt-1">
                <Link
                  href="/community"
                  className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] transition"
                >
                  Submit your commute data →
                </Link>
              </div>
            </div>
          </div>

          {/* Section 2: School Calendar */}
          <div className="border border-[#E5E7EB] rounded-[4px] bg-white">
            <div className="px-6 py-4 border-b border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-[#111827]">Hawaii DOE School Calendar</h2>
                <span className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide">Seasonal context</span>
              </div>
              <p className="text-[12px] text-[#6B7280] mt-0.5">School day detection</p>
            </div>
            <div className="px-6 py-4 text-[13px] text-[#6B7280] leading-relaxed space-y-3">
              <p>
                Oahu traffic during school breaks is dramatically lighter than on school days.
                The same Monday at 7 AM can differ by <strong className="text-[#111827]">20–30 minutes</strong> depending
                on whether school is in session. Day-of-week alone is not enough — seasonal context matters.
              </p>
              <p>
                Every community commute report is automatically tagged with whether school was in session
                that day, based on the Hawaii DOE academic calendar. School days and non-school days are
                stored separately, so future predictions always compare like with like.
              </p>
              <div className="space-y-0">
                <DataRow label="Source" value="Hawaii DOE Academic Calendar (SY 2024–25 and 2025–26)" />
                <DataRow label="Breaks covered" value="Summer, Winter, Spring, Thanksgiving, Federal & State holidays" />
                <DataRow label="Applied to" value="Each commute report at submission time" />
                <DataRow label="UI indicator" value="School day / School not in session — shown in search results" />
              </div>
              <a
                href="https://www.hawaiipublicschools.org/TeachingAndLearning/StudentLearning/SchoolYear/Pages/School-Year-Calendar.aspx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-[#2563EB] hover:text-[#1D4ED8] transition"
              >
                Hawaii DOE School Year Calendar →
              </a>
            </div>
          </div>

          {/* Section 3: Google Maps */}
          <div className="border border-[#E5E7EB] rounded-[4px] bg-white">
            <div className="px-6 py-4 border-b border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-[#111827]">Google Maps Distance Matrix API</h2>
                <span className="text-[11px] font-medium text-[#2563EB] uppercase tracking-wide">Primary</span>
              </div>
              <p className="text-[12px] text-[#6B7280] mt-0.5">Travel time baseline</p>
            </div>
            <div className="px-6 py-4 text-[13px] text-[#6B7280] leading-relaxed space-y-3">
              <p>
                For each departure time slot, we query Google Maps with{" "}
                <code className="text-[12px] bg-[#F3F4F6] px-1 rounded text-[#111827]">traffic_model=pessimistic</code>{" "}
                to obtain predicted travel durations. This forms the baseline that community data
                is used to calibrate and correct over time.
              </p>
              <div className="space-y-0">
                <DataRow label="Endpoint" value={<span className="font-mono text-[12px]">maps.googleapis.com/maps/api/distancematrix</span>} />
                <DataRow label="Traffic model" value={<span><code className="text-[12px] bg-[#F3F4F6] px-1 rounded">pessimistic</code> — worst-case historical scenario</span>} />
                <DataRow label="Also used for" value="Directions API — extracting route corridor names from commute reports" />
                <DataRow label="Update frequency" value="Real-time query per search" />
              </div>
              <div className="border border-[#E5E7EB] rounded-[4px] p-4 text-[13px] text-[#6B7280]">
                <span className="font-medium text-[#111827]">Known limitation:</span>{" "}
                Google Maps underestimates Honolulu peak-hour travel times. Real commute data
                (6:53 AM, Hawaii Kai to Mid-Pacific Institute) showed{" "}
                <strong className="text-[#111827]">62 min actual</strong> vs{" "}
                <strong className="text-[#111827]">30 min predicted</strong> — a 2× gap.
                Community data is how we close this gap over time.
              </div>
              <a
                href="https://developers.google.com/maps/documentation/distance-matrix"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-[#2563EB] hover:text-[#1D4ED8] transition"
              >
                Google Maps Distance Matrix API Documentation →
              </a>
            </div>
          </div>

          {/* Section 4: HDOT AADT */}
          <div className="border border-[#E5E7EB] rounded-[4px] bg-white">
            <div className="px-6 py-4 border-b border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-[#111827]">HDOT HPMS Dataset</h2>
                <span className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide">Government open data</span>
              </div>
              <p className="text-[12px] text-[#6B7280] mt-0.5">Commuter count baseline</p>
            </div>
            <div className="px-6 py-4 text-[13px] text-[#6B7280] leading-relaxed space-y-3">
              <p>
                The Hawaii Department of Transportation (HDOT) publishes Annual Average Daily Traffic (AADT)
                counts for all major state highways. We use this to calculate the realistic number of Oahu
                morning commuters shown in the Collective Impact section.
              </p>
              <div className="space-y-0">
                <DataRow label="Dataset" value="HPMS — Highway Performance Monitoring System" />
                <DataRow label="API" value={<span className="font-mono text-[12px]">highways.hidot.hawaii.gov/resource/3jb9-z582.json</span>} />
                <DataRow label="Key finding" value={<span>H1 peak section AADT = <strong className="text-[#111827]">65,800 vehicles/day</strong></span>} />
                <DataRow label="Derived estimate" value={<span><strong className="text-[#111827]">~10,857</strong> Oahu morning commuters (6–9 AM)</span>} />
              </div>
              <div className="border border-[#E5E7EB] rounded-[4px] p-4 text-[12px] text-[#9CA3AF]">
                Calculation: 65,800 vehicles/day × 15% (morning rush share) × 1.1 (avg occupancy) = 10,857 commuters
              </div>
              <a
                href="https://highways.hidot.hawaii.gov/resource/3jb9-z582.json"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-[#2563EB] hover:text-[#1D4ED8] transition"
              >
                HDOT Open Data Portal →
              </a>
            </div>
          </div>

          {/* Section 5: TomTom */}
          <div className="border border-[#E5E7EB] rounded-[4px] bg-white">
            <div className="px-6 py-4 border-b border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-[#111827]">TomTom Traffic Flow API</h2>
                <span className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide">Supplemental</span>
              </div>
              <p className="text-[12px] text-[#6B7280] mt-0.5">Real-time speed validation</p>
            </div>
            <div className="px-6 py-4 text-[13px] text-[#6B7280] leading-relaxed space-y-3">
              <p>
                We use TomTom&apos;s Traffic Flow API to cross-check real-time Oahu road speeds against
                free-flow baselines. This data is used to validate correction factors and will be
                integrated more deeply as community data grows.
              </p>
              <div className="space-y-0">
                <DataRow label="Endpoint" value={<span className="font-mono text-[12px]">api.tomtom.com/traffic/services/4/flowSegmentData</span>} />
                <DataRow label="Update frequency" value="Every 2 minutes (real-time)" />
              </div>
              <a
                href="https://developer.tomtom.com/traffic-api/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-[#2563EB] hover:text-[#1D4ED8] transition"
              >
                TomTom Traffic API Documentation →
              </a>
            </div>
          </div>

        </div>

        {/* Footer note */}
        <p className="mt-8 pt-6 border-t border-[#E5E7EB] text-[12px] text-[#9CA3AF] text-center leading-relaxed">
          AlohaShift is an independent student project built for the 2026 Congressional App Challenge.
          Not affiliated with Google, TomTom, or HDOT.
          All data is used in accordance with respective terms of service.
        </p>

      </div>
    </main>
  );
}
