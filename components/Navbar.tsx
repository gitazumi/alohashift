"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.07)]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo / Home link */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-stone-900 text-sm">
            Aloha<span className="text-amber-500">Shift</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              pathname === "/"
                ? "bg-amber-50 text-amber-700"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
            }`}
          >
            <span className="hidden sm:inline">Plan My Commute</span>
            <span className="sm:hidden">Plan</span>
          </Link>

          <Link
            href="/community"
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
              pathname === "/community"
                ? "bg-emerald-50 text-emerald-600"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
            }`}
          >
            <span className="inline-flex items-center justify-center w-4 h-4 bg-emerald-500 text-white rounded-full text-xs font-bold leading-none">+</span>
            <span className="hidden sm:inline">Submit Commute Data</span>
            <span className="sm:hidden">Submit</span>
          </Link>

          <Link
            href="/data-sources"
            className={`px-3 py-1.5 rounded-lg font-medium transition hidden sm:block ${
              pathname === "/data-sources"
                ? "bg-stone-100 text-stone-700"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
            }`}
          >
            Data Sources
          </Link>
        </nav>

      </div>
    </header>
  );
}
