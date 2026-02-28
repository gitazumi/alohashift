"use client";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-stone-900 via-stone-900 to-stone-800 px-6 py-20 md:py-28">
      <div className="max-w-3xl mx-auto text-center">

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-5 tracking-tight">
          Aloha<span className="text-amber-400">Shift</span><span className="text-stone-500 text-3xl md:text-4xl font-light">.com</span>
        </h1>

        {/* Primary tagline */}
        <p className="text-xl md:text-2xl text-stone-300 font-medium mb-5 leading-snug">
          Leave a little earlier.<br className="hidden sm:block" />
          Arrive a little calmer.
        </p>

        {/* Description */}
        <p className="text-sm text-stone-400 leading-relaxed max-w-md mx-auto">
          Compare departure times and find the window when Oahu traffic is actually manageable —
          built by a local, for local commuters.
        </p>

      </div>
    </section>
  );
}
