"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E5E7EB] mt-0">
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-[12px] text-[#9CA3AF]">
            © {new Date().getFullYear()} AlohaShift.com — Built in Hawaii for Oahu commuters
          </p>
          <nav className="flex flex-wrap items-center gap-6 text-[12px] text-[#9CA3AF]">
            <Link href="/data-sources" className="hover:text-[#111827] transition">Data Sources</Link>
            <Link href="/community" className="hover:text-[#111827] transition">Community Data</Link>
            <Link href="/terms" className="hover:text-[#111827] transition">Terms</Link>
            <Link href="/privacy" className="hover:text-[#111827] transition">Privacy</Link>
            <Link href="/contact" className="hover:text-[#111827] transition">Contact</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
