import Link from "next/link";

export const metadata = {
  title: "Terms of Service — AlohaShift",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-8 pt-8 pb-20">

        {/* Page header */}
        <div className="mb-8 pb-6 border-b border-[#E5E7EB]">
          <h1 className="text-[28px] font-semibold text-[#111827] tracking-tight">
            Terms of Service
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">Last updated: February 2025</p>
        </div>

        <div className="space-y-6 text-[14px] text-[#6B7280] leading-relaxed">

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using AlohaShift ("the Service"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">2. Description of Service</h2>
            <p>
              AlohaShift is a commute intelligence tool that helps users in Hawaii visualize how departure timing
              affects travel time based on traffic data provided by Google Maps. The Service displays predicted
              travel times for comparison purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">3. No Guarantee of Accuracy</h2>
            <p>
              Traffic predictions displayed by AlohaShift are sourced from third-party APIs (Google Maps Distance
              Matrix API) and are estimates only. Actual travel times may vary significantly due to road conditions,
              accidents, weather, construction, or other unforeseen events. AlohaShift makes no guarantee that
              predictions will be accurate, and you should always allow additional time for your commute.
            </p>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">4. Not a Navigation Service</h2>
            <p>
              AlohaShift is not a real-time navigation or routing service. It does not provide turn-by-turn
              directions. Do not use AlohaShift while driving. Always prioritize road safety.
            </p>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">5. User Responsibilities</h2>
            <p>
              You agree to use the Service only for lawful purposes. You are solely responsible for any
              decisions you make based on information provided by AlohaShift, including but not limited to
              decisions about departure times, routes, or commuting habits.
            </p>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">6. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, AlohaShift and its operators shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages arising from your use of,
              or inability to use, the Service — including any reliance on traffic predictions displayed.
            </p>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">7. Third-Party Services</h2>
            <p>
              AlohaShift uses Google Maps services. Your use of the Service is also subject to{" "}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2563EB] hover:text-[#1D4ED8]"
              >
                Google&apos;s Terms of Service
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">8. Changes to Terms</h2>
            <p>
              We reserve the right to update these Terms of Service at any time. Continued use of the Service
              after changes are posted constitutes your acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">9. Contact</h2>
            <p>
              For questions about these Terms, please{" "}
              <Link href="/contact" className="text-[#2563EB] hover:text-[#1D4ED8]">
                contact us
              </Link>
              .
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
