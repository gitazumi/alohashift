"use client";

import Image from "next/image";

export default function HeroSection() {
  const features = ["Real traffic data", "School calendar aware", "Built for Oahu"];

  return (
    <section className="relative overflow-hidden bg-zinc-950 px-6 py-24 md:py-32">

      {/* Background photo */}
      <Image
        src="/bg2.png"
        alt="Hawaii traffic"
        fill
        className="object-cover object-bottom"
        priority
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-zinc-950/30" />

      {/* Top edge glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent pointer-events-none" />

      {/* Subtle blue ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">

        {/* Badge chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-zinc-400 text-xs mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
          Built for Oahu commuters
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-6">
          <span className="text-white">Aloha</span>
          <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-400 bg-clip-text text-transparent">
            Shift
          </span>
          <span className="text-white/60 text-3xl md:text-4xl font-light">.com</span>
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-zinc-300 font-medium mb-4 leading-snug">
          Leave a little earlier. Arrive a little calmer.
        </p>

        {/* Description */}
        <p className="text-sm text-zinc-400 mb-10 max-w-md mx-auto leading-relaxed">
          Compare departure times and find the window when Oahu traffic is actually manageable —
          built by a local, for local commuters.
        </p>

        {/* Feature chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {features.map((f) => (
            <span
              key={f}
              className="px-3 py-1.5 text-xs text-zinc-400 border border-white/10 rounded-full bg-white/5 backdrop-blur-sm"
            >
              {f}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}
