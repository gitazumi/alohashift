import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AlohaShift — Hawaii Commute Intelligence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.07) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow orb top-right */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Glow orb bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "320px",
            height: "320px",
            background: "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Logo circle */}
        <div
          style={{
            width: "96px",
            height: "96px",
            borderRadius: "50%",
            background: "#3b82f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "28px",
            boxShadow: "0 0 40px rgba(59,130,246,0.5)",
          }}
        >
          {/* Up arrow symbol */}
          <svg width="52" height="52" viewBox="0 0 100 100" fill="none">
            <path
              d="M15 62 Q25 52 35 62 Q45 72 55 62 Q65 52 75 62 Q82 68 88 62"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M10 70 Q22 60 34 70 Q46 80 58 70 Q70 60 82 70 Q88 74 92 70"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              opacity="0.35"
            />
            <path
              d="M30 58 L50 35 L70 58"
              stroke="white"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M50 35 L50 68"
              stroke="white"
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "68px",
            fontWeight: 800,
            color: "white",
            letterSpacing: "-2px",
            lineHeight: 1,
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          AlohaShift
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "28px",
            color: "#93c5fd",
            fontWeight: 500,
            marginBottom: "40px",
            textAlign: "center",
            letterSpacing: "0px",
          }}
        >
          Hawaii Commute Intelligence
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          {[
            { icon: "🕐", label: "Best Departure Time" },
            { icon: "🗺️", label: "Real Traffic Data" },
            { icon: "🏫", label: "School Day Aware" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "100px",
                padding: "10px 20px",
                fontSize: "18px",
                color: "rgba(255,255,255,0.85)",
                fontWeight: 500,
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: "20px",
            color: "rgba(255,255,255,0.4)",
            fontWeight: 400,
            letterSpacing: "1px",
          }}
        >
          alohashift.com
        </div>
      </div>
    ),
    { ...size }
  );
}
