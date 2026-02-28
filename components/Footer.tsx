"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-white/10 mt-16">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">
              Aloha<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Shift</span>
            </p>
            <p className="text-xs text-zinc-500">Built in Hawaii for Hawaii commuters.</p>
            <p className="text-xs text-zinc-700">© {new Date().getFullYear()} AlohaShift. All rights reserved.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500 justify-start sm:justify-end">
            <Link href="/data-sources" className="hover:text-zinc-200 transition">
              Data Sources
            </Link>
            <Link href="/community" className="hover:text-zinc-200 transition">
              Community Data
            </Link>
            <Link href="/terms" className="hover:text-zinc-200 transition">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-zinc-200 transition">
              Privacy Policy
            </Link>
            <Link href="/contact" className="hover:text-zinc-200 transition">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
