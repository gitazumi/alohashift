"use client";

export default function HeroSection() {
  const features = ["Real traffic data", "School calendar aware", "Built for Oahu"];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-amber-400 to-orange-600 px-6 py-24 md:py-32">

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-white/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">

        {/* Badge chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/30 bg-white/20 text-white/90 text-xs mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
          Built for Oahu commuters
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-6">
          <span className="text-white">Aloha</span>
          <span className="text-white">Shift</span>
          <span className="text-white/60 text-3xl md:text-4xl font-light">.com</span>
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-white/90 font-medium mb-4 leading-snug">
          Leave a little earlier. Arrive a little calmer.
        </p>

        {/* Description */}
        <p className="text-sm text-white/70 mb-10 max-w-md mx-auto leading-relaxed">
          Compare departure times and find the window when Oahu traffic is actually manageable —
          built by a local, for local commuters.
        </p>

        {/* Feature chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {features.map((f) => (
            <span
              key={f}
              className="px-3 py-1.5 text-xs text-white/80 border border-white/30 rounded-full bg-white/15 backdrop-blur-sm"
            >
              {f}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}
