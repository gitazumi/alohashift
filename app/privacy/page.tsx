import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — AlohaShift",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="max-w-3xl mx-auto px-8 pt-8 pb-20">

        {/* Page header */}
        <div className="mb-8 pb-6 border-b border-[#E5E7EB]">
          <h1 className="text-[28px] font-semibold text-[#111827] tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1">Last updated: February 2025</p>
        </div>

        <div className="space-y-6 text-[14px] text-[#6B7280] leading-relaxed">

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">1. Overview</h2>
            <p>
              AlohaShift is committed to protecting your privacy. This Privacy Policy explains what information
              we collect, how we use it, and your choices regarding your data.
            </p>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">2. Information We Collect</h2>
            <p className="mb-3">AlohaShift collects minimal information necessary to provide the Service:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>
                <span className="font-medium text-[#111827]">Location inputs:</span> Origin and destination
                addresses you enter into the search form. These are sent to Google Maps APIs to retrieve
                traffic data and are not stored on our servers.
              </li>
              <li>
                <span className="font-medium text-[#111827]">Usage data:</span> Standard web server logs
                (IP address, browser type, pages visited) may be collected automatically for security and
                performance monitoring.
              </li>
              <li>
                <span className="font-medium text-[#111827]">Contact form data:</span> If you submit the
                contact form, your name, email address, and message are collected solely to respond to
                your inquiry.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>To process traffic queries and display commute predictions</li>
              <li>To respond to your contact form submissions</li>
              <li>To monitor and improve the performance and security of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">4. Third-Party Services</h2>
            <p>
              AlohaShift uses <strong className="text-[#111827]">Google Maps APIs</strong> to retrieve
              traffic and location data. When you enter addresses, that data is transmitted to Google in
              accordance with{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#2563EB] hover:text-[#1D4ED8]"
              >
                Google&apos;s Privacy Policy
              </a>
              . We do not control how Google processes this data.
            </p>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">5. Data Retention</h2>
            <p>
              We do not store your origin/destination addresses or traffic query results on our servers.
              Contact form submissions are retained only as long as necessary to respond to your inquiry.
            </p>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">6. Cookies</h2>
            <p>
              AlohaShift does not use tracking cookies or advertising cookies. We may use essential
              session cookies required for the application to function correctly.
            </p>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">7. Children&apos;s Privacy</h2>
            <p>
              AlohaShift is not directed to children under 13 years of age. We do not knowingly collect
              personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page
              with an updated date. Continued use of the Service after changes are posted constitutes
              acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-[14px] font-semibold text-[#111827] mb-2">9. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or how your data is handled, please{" "}
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
