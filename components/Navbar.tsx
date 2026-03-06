"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const linkClass = (href: string) =>
    `text-[15px] transition-colors ${
      pathname === href
        ? "text-[#111827] font-medium"
        : "text-[#6B7280] hover:text-[#111827]"
    }`;

  const mobileLinkClass = (href: string) =>
    `block px-4 py-3 text-[15px] transition-colors ${
      pathname === href
        ? "text-[#111827] font-medium bg-[#F3F4F6]"
        : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] h-16 flex items-center">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 w-full flex items-center justify-between">

        <Link href="/" className="text-[18px] font-semibold text-[#111827] tracking-tight">
          Aloha<span className="text-[#2563EB]">Shift</span>.com
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className={linkClass("/")}>
            Analysis
          </Link>
          <Link href="/community" className={linkClass("/community")}>
            Submit commute data
          </Link>
          <Link href="/data-sources" className={linkClass("/data-sources")}>
            Methodology
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <div className="md:hidden relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-[#6B7280] hover:text-[#111827] transition-colors"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </svg>
            )}
          </button>

          {menuOpen && (
            <nav className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 overflow-hidden">
              <Link href="/" className={mobileLinkClass("/")}>
                Analysis
              </Link>
              <Link href="/community" className={mobileLinkClass("/community")}>
                Submit commute data
              </Link>
              <Link href="/data-sources" className={mobileLinkClass("/data-sources")}>
                Methodology
              </Link>
            </nav>
          )}
        </div>

      </div>
    </header>
  );
}
