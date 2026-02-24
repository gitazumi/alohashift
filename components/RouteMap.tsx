interface RouteMapProps {
  origin: string;
  destination: string;
}

export default function RouteMap({ origin, destination }: RouteMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) return null;

  // Google Maps Embed API — Directions mode
  const src =
    `https://www.google.com/maps/embed/v1/directions` +
    `?key=${apiKey}` +
    `&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}` +
    `&mode=driving` +
    `&avoid=tolls`;

  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
        Route
      </h2>
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <iframe
          title="Route Map"
          src={src}
          width="100%"
          height="340"
          style={{ border: 0, display: "block" }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </section>
  );
}
