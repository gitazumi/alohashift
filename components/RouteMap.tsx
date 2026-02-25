"use client";

import { useEffect, useState } from "react";

interface RouteMapProps {
  origin: string;
  destination: string;
}

export default function RouteMap({ origin, destination }: RouteMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [mapSrc, setMapSrc] = useState<string | null>(null);
  const [mapsUrl, setMapsUrl] = useState<string>("");

  useEffect(() => {
    if (!apiKey || !origin || !destination) return;

    // Build Google Maps URL for "Open in Google Maps" link
    setMapsUrl(
      `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`
    );

    // Fetch encoded polyline from our own API route (keeps API key server-side safe)
    // Then build a Static Maps image with just the route line — no distance/time labels
    const buildStaticMap = async () => {
      try {
        const res = await fetch("/api/route-polyline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origin, destination }),
        });
        if (!res.ok) throw new Error("polyline fetch failed");
        const data = await res.json();
        const polyline = data.polyline as string;

        // Static Maps API with encoded polyline — clean map, no UI labels
        const staticSrc =
          `https://maps.googleapis.com/maps/api/staticmap` +
          `?size=800x340` +
          `&scale=2` +
          `&maptype=roadmap` +
          `&path=color:0x3b82f6FF|weight:4|enc:${encodeURIComponent(polyline)}` +
          `&markers=color:green|label:A|${encodeURIComponent(origin)}` +
          `&markers=color:red|label:B|${encodeURIComponent(destination)}` +
          `&key=${apiKey}`;

        setMapSrc(staticSrc);
      } catch {
        // Fallback: simple static map without polyline
        const fallbackSrc =
          `https://maps.googleapis.com/maps/api/staticmap` +
          `?size=800x340` +
          `&scale=2` +
          `&maptype=roadmap` +
          `&markers=color:green|label:A|${encodeURIComponent(origin)}` +
          `&markers=color:red|label:B|${encodeURIComponent(destination)}` +
          `&key=${apiKey}`;
        setMapSrc(fallbackSrc);
      }
    };

    buildStaticMap();
  }, [origin, destination, apiKey]);

  if (!apiKey) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
          Route
        </h2>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:text-blue-700 transition"
          >
            Open in Google Maps →
          </a>
        )}
      </div>
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 min-h-[220px] flex items-center justify-center">
        {mapSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mapSrc}
            alt={`Route from ${origin} to ${destination}`}
            className="w-full block"
            style={{ display: "block" }}
          />
        ) : (
          <div className="text-slate-400 text-sm animate-pulse">Loading map…</div>
        )}
      </div>
    </section>
  );
}
