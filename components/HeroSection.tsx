"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-blue-50 to-white border-b border-blue-100 px-6 py-20">
      <div className="max-w-3xl mx-auto text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          Hawaii Commute Intelligence
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
          Aloha<span className="text-blue-500">Shift</span><span className="text-slate-400">.com</span>
        </h1>

        {/* Primary tagline */}
        <p className="text-xl md:text-2xl text-slate-600 font-medium mb-4 leading-snug">
          Traffic isn&apos;t random.<br className="hidden sm:block" />
          It&apos;s a function of collective timing.
        </p>

        {/* Description */}
        <p className="text-base text-slate-400 leading-relaxed max-w-xl mx-auto mb-6">
          AlohaShift fetches Google Maps ETA snapshots across multiple departure times
          and makes the structure behind congestion visible — so you can make
          smarter commuting decisions every day.
        </p>

        {/* Sub-tagline */}
        <p className="text-sm text-slate-400 italic mb-10">
          We don&apos;t fix traffic. We reveal how timing creates it.
        </p>

        {/* Community Data CTA */}
        <div className="border-t border-blue-100 pt-8">
          <p className="text-sm text-slate-500 mb-3">
            🤙 <span className="font-semibold text-slate-700">Drive H1 every day?</span>{" "}
            Help make AlohaShift more accurate for everyone —
            share your real commute times and see how predictions compare to reality.
          </p>
          <Link
            href="/community"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-sm"
          >
            <span>Submit Your Commute Data</span>
            <span>→</span>
          </Link>
          <p className="text-xs text-slate-400 mt-2">Takes less than 2 minutes · No account needed</p>
        </div>

      </div>
    </section>
  );
}
