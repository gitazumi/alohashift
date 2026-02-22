# TimeShift — Hawaii Commute Intelligence

> Visualize how departure timing changes your commute outcome.

TimeShift does not fix congestion. It shows how outcomes change when you shift your departure time. The decision is always yours.

---

## Quick Start

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

| Feature | Status |
|---|---|
| 6-window departure comparison | ✅ |
| Stress Index calculation | ✅ |
| Traffic Curve (Recharts) | ✅ |
| Sweet Spot highlight | ✅ |
| Lateness risk color coding | ✅ |
| AI pattern comment (local) | ✅ |
| Hawaii context panel | ✅ (placeholder) |
| CO₂ savings estimate | ✅ |
| Google Maps API integration | ✅ (mock fallback) |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure API key

Edit `.env.local`:

```env
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

**Getting a Google Maps API key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select an existing one
3. Enable the **Distance Matrix API**
4. Create an API key under Credentials
5. Restrict the key to Distance Matrix API (recommended)

> **Without an API key:** The app works with realistic mock data for Hawaii commute patterns. Just leave `GOOGLE_MAPS_API_KEY=your_api_key_here` in `.env.local`.

### 3. Run locally

```bash
npm run dev
```

---

## Project Structure

```
TimeShift/
├── app/
│   ├── api/
│   │   └── eta/
│   │       └── route.ts        # Distance Matrix API handler + mock
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Main page, state management
├── components/
│   ├── HeroSection.tsx         # Top hero with example visualization
│   ├── InputForm.tsx           # Origin / Destination / Arrival time form
│   ├── ResultCard.tsx          # Per-departure-slot card with Stress Index
│   ├── TrafficCurve.tsx        # Recharts line chart with Sweet Spot
│   ├── AIComment.tsx           # Pattern analysis comment panel
│   ├── HawaiiContext.tsx       # Weather / school zone / incident panel
│   └── CO2Section.tsx          # CO₂ savings estimate
├── lib/
│   ├── stressIndex.ts          # StressIndex, RiskFactor, Sweet Spot logic
│   ├── aiComments.ts           # Local comment generator + LLM stub
│   └── co2.ts                  # CO₂ estimation
├── types/
│   └── index.ts                # Shared TypeScript types
├── .env.local                  # API key (not committed)
└── README.md
```

---

## How It Works

### Departure Window Generation

Given a desired arrival time, TimeShift generates 6 departure slots:
- T−60, T−50, T−40, T−30, T−20, T−10 minutes

### Stress Index

```
StressIndex = ((duration_in_traffic - free_flow_duration) / free_flow_duration) × 100
```

A value of 0 = free-flow. 50 = 50% longer than baseline.

### Risk Factor

- `+20` if the next time slot shows increasing congestion trend
- `+5` if traffic is stable or improving

### Lateness Risk

| Condition | Color |
|---|---|
| Arrival after goal | 🔴 Red |
| Within 5 min of goal | 🟡 Yellow |
| More than 5 min buffer | 🟢 Green |

### Sweet Spot

The departure slot with the minimum `duration_in_traffic`. Highlighted with a blue ring on cards and a reference line on the chart.

### CO₂ Estimate

```
CO₂ saved = (worst_delay_min - best_delay_min) × 0.02 kg
```

---

## Design Philosophy

- **No optimal answer.** TimeShift presents comparisons, not recommendations.
- **No notifications.** The app does not push or alert.
- **No forced actions.** All decisions remain with the user.
- **Public service aesthetic.** Clean, trustworthy, neutral.

---

## Future Extensions

- [ ] Real-time weather impact via OpenWeatherMap API
- [ ] HDOT / 511 Hawaii incident feed
- [ ] School zone calendar integration
- [ ] LLM-powered commentary (stub in `lib/aiComments.ts`)
- [ ] Historical pattern comparison
- [ ] Multi-route support

---

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Recharts**
- **Google Maps Distance Matrix API**
