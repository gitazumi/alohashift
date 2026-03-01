"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `text-[13px] transition-colors ${
      pathname === href
        ? "text-[#111827] font-medium"
        : "text-[#6B7280] hover:text-[#111827]"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] h-16 flex items-center">
      <div className="max-w-6xl mx-auto px-8 w-full flex items-center justify-between">

        <Link href="/" className="text-[14px] font-semibold text-[#111827] tracking-tight">
          AlohaShift
        </Link>

        <nav className="flex items-center gap-8">
          <Link href="/" className={linkClass("/")}>
            Analysis
          </Link>
          <Link href="/community" className={linkClass("/community")}>
            Community Data
          </Link>
          <Link href="/data-sources" className={linkClass("/data-sources")}>
            Methodology
          </Link>
        </nav>

      </div>
    </header>
  );
}
