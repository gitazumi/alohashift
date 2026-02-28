"use client";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-amber-50 via-orange-50/30 to-[#faf9f7] border-b border-stone-200/60 px-6 py-16 md:py-24">
      <div className="max-w-3xl mx-auto text-center">

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-bold text-stone-900 leading-tight mb-5">
          Aloha<span className="text-blue-500">Shift</span><span className="text-stone-300 text-4xl md:text-5xl font-light">.com</span>
        </h1>

        {/* Primary tagline */}
        <p className="text-2xl md:text-3xl text-stone-700 font-medium mb-4 leading-snug">
          Leave a little earlier.<br className="hidden sm:block" />
          Arrive a little calmer.
        </p>

        {/* Description */}
        <p className="text-base text-stone-500 leading-relaxed max-w-lg mx-auto">
          Compare departure times side by side and find the window
          when Oahu traffic is actually manageable — built by a local, for local commuters.
        </p>

      </div>
    </section>
  );
}
