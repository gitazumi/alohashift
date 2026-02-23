"use client";

import { useState, useMemo } from "react";

interface CollectiveImpactProps {
  peakDelayMinutes: number;  // worst slot − free_flow (minutes)
  freeFlowMinutes: number;   // baseline free-flow travel time
  personalSavedMin: number;  // best slot vs worst slot in user's results
  worstLabel: string;        // departure label of worst slot
  bestLabel: string;         // departure label of best slot
}

// ── Constants ──────────────────────────────────────────────────────────────
const COMMUTE_DAYS_PER_YEAR      = 240;   // 5 days × 48 weeks
const AVG_FUEL_GAL_PER_CONG_MIN = 0.034; // extra gal burned in congestion vs free-flow
const GAS_PRICE                  = 4.50;  // USD per gallon (Hawaii avg)
const CO2_PER_CONGESTION_MIN     = 0.02;  // kg CO₂ per congestion-minute
const TOTAL_COMMUTERS            = 10_000;

function equiv(co2Kg: number): string {
  const trees = Math.round(co2Kg / 21);
  if (trees >= 1) return `≈ planting ${trees} tree${trees > 1 ? "s" : ""}`;
  const phoneCharges = Math.round(co2Kg / 0.005);
  return `≈ ${phoneCharges.toLocaleString()} phone charges`;
}

function Num({ value, decimals = 0 }: { value: number; decimals?: number }) {
  return <>{decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString()}</>;
}

export default function CollectiveImpact({
  peakDelayMinutes,
  freeFlowMinutes,
  personalSavedMin,
  worstLabel,
  bestLabel,
}: CollectiveImpactProps) {

  // Personal scale selector: "actual" = based on results, or 5/10/15 min hypothetical
  const [personalScale, setPersonalScale] = useState<"actual" | 5 | 10 | 15>("actual");

  // City-scale slider
  const [participationPct, setParticipationPct] = useState(10);

  // ── A: Personal Impact ─────────────────────────────────────────────────
  const personalMinutes = personalScale === "actual" ? personalSavedMin : personalScale;

  const personal = useMemo(() => {
    const savedMin      = Math.min(personalMinutes, peakDelayMinutes);
    const annualMin     = savedMin * COMMUTE_DAYS_PER_YEAR;
    const annualHours   = annualMin / 60;
    const annualFuelDol = annualMin * AVG_FUEL_GAL_PER_CONG_MIN * GAS_PRICE;
    const annualCO2Kg   = annualMin * CO2_PER_CONGESTION_MIN;
    const workdaysEquiv = Math.round((annualMin / 480) * 10) / 10;
    return {
      savedMin,
      annualMin: Math.round(annualMin),
      annualHours,
      annualFuelDol,
      annualCO2Kg,
      workdaysEquiv,
    };
  }, [personalMinutes, peakDelayMinutes]);

  // ── B: City-Scale Impact ───────────────────────────────────────────────
  const city = useMemo(() => {
    const rate                 = participationPct / 100;
    const reductionFactor      = 0.6 * rate * (Math.max(personalSavedMin, 5) / 10);
    const shifters             = Math.round(TOTAL_COMMUTERS * rate);
    const delayReducedPerPerson = peakDelayMinutes * reductionFactor;
    const totalDailyMin        = shifters * delayReducedPerPerson;
    const cityAnnualMin        = totalDailyMin * 365;
    const cityAnnualHours      = Math.round(cityAnnualMin / 60);
    const cityAnnualCO2Ton     = Math.round((cityAnnualMin * CO2_PER_CONGESTION_MIN / 1000) * 10) / 10;
    const congRedPct           = Math.round(reductionFactor * 100);
    return { shifters, congRedPct, cityAnnualHours, cityAnnualCO2Ton };
  }, [participationPct, personalSavedMin, peakDelayMinutes]);

  if (peakDelayMinutes <= 0 || freeFlowMinutes <= 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-8">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📊</span>
          <h3 className="text-base font-semibold text-slate-800">Impact Simulator</h3>
        </div>
        <p className="text-xs text-slate-400">
          See what a small timing shift means — for your wallet, and for Honolulu.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION A — PERSONAL IMPACT
          Based entirely on the user's actual results
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-base">🙋</span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Your Personal Impact</p>
            <p className="text-xs text-emerald-600">
              How much do you gain per year by choosing a less congested departure?
            </p>
          </div>
        </div>

        {/* Scale selector */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Minutes of congestion avoided per commute
            </label>
            <span className="text-sm font-bold text-emerald-700">{personal.savedMin} min</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPersonalScale("actual")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition ${
                personalScale === "actual"
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300"
              }`}
            >
              Your results<br />
              <span className="font-bold">{personalSavedMin} min</span>
            </button>
            {([5, 10, 15] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPersonalScale(m)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition ${
                  personalScale === m
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300"
                }`}
              >
                Hypothetical<br />
                <span className="font-bold">{m} min</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {personalScale === "actual"
              ? `Based on your results: ${bestLabel} (least congested) vs ${worstLabel} (most congested)`
              : `Hypothetical: if you avoided ${personalScale} minutes of congestion every commute`}
          </p>
        </div>

        {/* Personal result cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-emerald-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-2">⏳ Time Saved</p>
            <p className="text-3xl font-bold text-emerald-700 leading-none">
              <Num value={personal.annualHours} decimals={1} />
              <span className="text-base font-normal ml-1">hrs</span>
            </p>
            <p className="text-xs text-emerald-500 mt-1">per year</p>
            <p className="text-xs text-slate-400 mt-1">{personal.savedMin} min × {COMMUTE_DAYS_PER_YEAR} days</p>
            {personal.workdaysEquiv >= 0.5 && (
              <p className="text-xs text-emerald-600 mt-2 font-medium">
                ≈ {personal.workdaysEquiv} full workday{personal.workdaysEquiv !== 1 ? "s" : ""} back
              </p>
            )}
          </div>

          <div className="bg-white border border-emerald-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-2">⛽ Fuel Saved</p>
            <p className="text-3xl font-bold text-emerald-700 leading-none">
              $<Num value={personal.annualFuelDol} decimals={0} />
            </p>
            <p className="text-xs text-emerald-500 mt-1">per year</p>
            <p className="text-xs text-slate-400 mt-1">at ${GAS_PRICE}/gal (Hawaii avg)</p>
          </div>

          <div className="bg-white border border-emerald-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-2">🌍 CO₂ Avoided</p>
            <p className="text-3xl font-bold text-emerald-700 leading-none">
              <Num value={personal.annualCO2Kg} decimals={1} />
              <span className="text-base font-normal ml-1">kg</span>
            </p>
            <p className="text-xs text-emerald-500 mt-1">per year</p>
            <p className="text-xs text-emerald-600 mt-2 font-medium">{equiv(personal.annualCO2Kg)}</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION B — CITY-SCALE IMPACT
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-base">🌐</span>
          <div>
            <p className="text-sm font-semibold text-blue-800">City-Scale Impact</p>
            <p className="text-xs text-blue-500">
              What if many Honolulu commuters made the same timing shift?
            </p>
          </div>
        </div>

        {/* Participation slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              What % of Honolulu commuters shift earlier?
            </label>
            <span className="text-sm font-bold text-blue-600">{participationPct}%</span>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            = <span className="font-medium text-slate-600">{city.shifters.toLocaleString()} people</span>{" "}
            out of {TOTAL_COMMUTERS.toLocaleString()} commuters choosing a less congested departure time
          </p>
          <input
            type="range" min={1} max={30} step={1}
            value={participationPct}
            onChange={(e) => setParticipationPct(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-300 mt-1">
            <span>1%</span><span>30%</span>
          </div>
        </div>

        {/* City result cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-blue-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">Peak Congestion</p>
            <p className="text-3xl font-bold text-blue-700">
              −{city.congRedPct}
              <span className="text-xl font-normal ml-0.5">%</span>
            </p>
            <p className="text-xs text-blue-400 mt-1">estimated reduction</p>
          </div>

          <div className="bg-white border border-blue-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">Time Saved / Year</p>
            <p className="text-3xl font-bold text-blue-700">
              {city.cityAnnualHours.toLocaleString()}
              <span className="text-base font-normal ml-1">hrs</span>
            </p>
            <p className="text-xs text-blue-400 mt-1">across {city.shifters.toLocaleString()} commuters</p>
          </div>

          <div className="bg-white border border-blue-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">CO₂ Reduced / Year</p>
            <p className="text-3xl font-bold text-blue-700">
              <Num value={city.cityAnnualCO2Ton} decimals={1} />
              <span className="text-base font-normal ml-1">tons</span>
            </p>
            <p className="text-xs text-blue-400 mt-1">estimated annually</p>
          </div>
        </div>
      </div>

      {/* ── Transparency footer ── */}
      <div className="border-t border-slate-100 pt-4 text-xs text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-500">Assumptions: </span>
        {COMMUTE_DAYS_PER_YEAR} commute days/year · ${GAS_PRICE}/gal gas (Hawaii avg) ·{" "}
        {AVG_FUEL_GAL_PER_CONG_MIN} gal extra per congestion-minute · {CO2_PER_CONGESTION_MIN} kg CO₂/congestion-min ·{" "}
        {TOTAL_COMMUTERS.toLocaleString()} total Honolulu commuters assumed.
        City model: reduction = 0.6 × participation × (shift/10). Simulation only — not empirical data.
      </div>
    </div>
  );
}
