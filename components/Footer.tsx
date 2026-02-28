"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-[#faf9f7] mt-16">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-stone-700">AlohaShift</p>
            <p className="text-xs text-stone-400">Built in Hawaii for Hawaii commuters.</p>
            <p className="text-xs text-stone-400">© {new Date().getFullYear()} AlohaShift. All rights reserved.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-500 justify-start sm:justify-end">
            <Link href="/data-sources" className="hover:text-stone-800 transition">
              Data Sources
            </Link>
            <Link href="/community" className="hover:text-stone-800 transition">
              Community Data
            </Link>
            <Link href="/terms" className="hover:text-stone-800 transition">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-stone-800 transition">
              Privacy Policy
            </Link>
            <Link href="/contact" className="hover:text-stone-800 transition">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
