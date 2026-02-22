"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-16">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-400">
            © {new Date().getFullYear()} AlohaShift. All rights reserved.
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-500">
            <Link
              href="/terms"
              className="hover:text-slate-800 transition"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="hover:text-slate-800 transition"
            >
              Privacy Policy
            </Link>
            <Link
              href="/contact"
              className="hover:text-slate-800 transition"
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
