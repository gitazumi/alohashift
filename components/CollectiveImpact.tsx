"use client";

import { useState, useMemo } from "react";

interface CollectiveImpactProps {
  peakDelayMinutes: number; // worst slot − free_flow (minutes)
  freeFlowMinutes: number;  // baseline free-flow travel time
}

// ── Constants (all shown transparently in UI) ──────────────────────────────
const COMMUTE_DAYS_PER_YEAR        = 240;   // 5 days × 48 weeks
const AVG_FUEL_GAL_PER_CONG_MIN   = 0.02;  // gallons burned per congestion-minute
const GAS_PRICE                    = 4.50;  // USD per gallon (Hawaii avg)
const CO2_PER_CONGESTION_MIN       = 0.02;  // kg CO₂ per congestion-minute
const TOTAL_COMMUTERS              = 10_000;

function equiv(co2Kg: number): string {
  const phoneCharges = Math.round(co2Kg / 0.005);   // ~5g per charge
  const trees        = Math.round(co2Kg / 21);       // ~21kg CO₂ per tree/year
  if (trees >= 1) return `≈ planting ${trees} tree${trees > 1 ? "s" : ""}`;
  return `≈ ${phoneCharges.toLocaleString()} phone charges`;
}

// ── Animated number helper ────────────────────────────────────────────────
function Num({ value, decimals = 0 }: { value: number; decimals?: number }) {
  return <>{decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString()}</>;
}

export default function CollectiveImpact({ peakDelayMinutes, freeFlowMinutes }: CollectiveImpactProps) {
  const [participationPct, setParticipationPct] = useState(10);
  const [shiftMinutes, setShiftMinutes]         = useState(10);

  const calc = useMemo(() => {
    const rate             = participationPct / 100;
    const reductionFactor  = 0.6 * rate * (shiftMinutes / 10);
    const delayReduced     = peakDelayMinutes * reductionFactor;       // min saved per peak commuter
    const shifters         = TOTAL_COMMUTERS * rate;
    const totalDailyMin    = shifters * delayReduced;                  // commuter-minutes / day

    // ── Personal (per individual shifter) ──────────────────────────────
    const perUserDailyMin  = delayReduced;                             // = delayReduced for each shifter
    const annualMin        = perUserDailyMin * COMMUTE_DAYS_PER_YEAR;
    const annualHours      = annualMin / 60;
    const annualFuelDol    = perUserDailyMin * COMMUTE_DAYS_PER_YEAR * AVG_FUEL_GAL_PER_CONG_MIN * GAS_PRICE;
    const annualCO2Kg      = perUserDailyMin * COMMUTE_DAYS_PER_YEAR * CO2_PER_CONGESTION_MIN;
    const workdaysEquiv    = Math.round((annualMin / 480) * 10) / 10; // 480 min = 8hr workday

    // ── City scale ──────────────────────────────────────────────────────
    const cityAnnualMin    = totalDailyMin * 365;
    const cityAnnualHours  = cityAnnualMin / 60;
    const cityAnnualCO2Ton = (totalDailyMin * 365 * CO2_PER_CONGESTION_MIN) / 1000;
    const congRedPct       = Math.round(reductionFactor * 100);

    return {
      // personal
      annualHours, annualMin: Math.round(annualMin), annualFuelDol, annualCO2Kg,
      perUserDailyMin: Math.round(perUserDailyMin * 10) / 10,
      workdaysEquiv,
      // city
      shifters: Math.round(shifters),
      congRedPct,
      cityAnnualHours: Math.round(cityAnnualHours),
      cityAnnualCO2Ton: Math.round(cityAnnualCO2Ton * 10) / 10,
    };
  }, [participationPct, shiftMinutes, peakDelayMinutes]);

  if (peakDelayMinutes <= 0 || freeFlowMinutes <= 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-8">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">📊</span>
          <h3 className="text-base font-semibold text-slate-800">Impact Simulator</h3>
        </div>
        <p className="text-xs text-slate-400">
          Adjust the sliders to explore what timing shifts could mean — for you and for Honolulu.
        </p>
      </div>

      {/* ── Sliders ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Commuters shifting earlier
            </label>
            <span className="text-sm font-bold text-blue-600">{participationPct}%</span>
          </div>
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

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Shift amount
            </label>
            <span className="text-sm font-bold text-blue-600">{shiftMinutes} min earlier</span>
          </div>
          <div className="flex gap-2">
            {[5, 10, 15].map((m) => (
              <button
                key={m}
                onClick={() => setShiftMinutes(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                  shiftMinutes === m
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
                }`}
              >
                {m} min
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── A: Personal Annual Impact (main) ──────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🙋</span>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Your Annual Impact
            </p>
            <p className="text-xs text-slate-400">
              If <em>you</em> shift {shiftMinutes} minutes earlier, every commute day
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Time */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-5 text-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-2">⏳ Time Saved</p>
            <p className="text-4xl font-bold text-emerald-700 leading-none">
              <Num value={calc.annualHours} decimals={1} />
              <span className="text-xl font-normal ml-1">hrs</span>
            </p>
            <p className="text-xs text-emerald-500 mt-2">per year</p>
            <p className="text-xs text-slate-400 mt-1">
              (~{calc.perUserDailyMin} min / commute day)
            </p>
            {calc.workdaysEquiv >= 0.5 && (
              <p className="text-xs text-emerald-600 mt-2 font-medium">
                ≈ {calc.workdaysEquiv} full workday{calc.workdaysEquiv !== 1 ? "s" : ""} back
              </p>
            )}
          </div>

          {/* Fuel */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-5 text-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-2">⛽ Fuel Saved</p>
            <p className="text-4xl font-bold text-emerald-700 leading-none">
              $<Num value={calc.annualFuelDol} decimals={0} />
            </p>
            <p className="text-xs text-emerald-500 mt-2">per year</p>
            <p className="text-xs text-slate-400 mt-1">
              at ${GAS_PRICE}/gal · {AVG_FUEL_GAL_PER_CONG_MIN} gal/cong-min
            </p>
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              ≈ 1 tank of gas{calc.annualFuelDol > 80 ? " or more" : ""}
            </p>
          </div>

          {/* CO₂ */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-5 text-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mb-2">🌍 CO₂ Avoided</p>
            <p className="text-4xl font-bold text-emerald-700 leading-none">
              <Num value={calc.annualCO2Kg} decimals={1} />
              <span className="text-xl font-normal ml-1">kg</span>
            </p>
            <p className="text-xs text-emerald-500 mt-2">per year</p>
            <p className="text-xs text-slate-400 mt-1">
              at {CO2_PER_CONGESTION_MIN} kg / congestion-min
            </p>
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              {equiv(calc.annualCO2Kg)}
            </p>
          </div>
        </div>
      </div>

      {/* ── B: Collective City Impact (sub) ───────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🌐</span>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              City-Scale Impact
            </p>
            <p className="text-xs text-slate-400">
              If {participationPct}% of {TOTAL_COMMUTERS.toLocaleString()} commuters shift — assumption-based simulation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">Peak Congestion</p>
            <p className="text-3xl font-bold text-blue-700">
              −{calc.congRedPct}
              <span className="text-xl font-normal ml-0.5">%</span>
            </p>
            <p className="text-xs text-blue-400 mt-1">estimated reduction</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">Time Saved / Year</p>
            <p className="text-3xl font-bold text-blue-700">
              {calc.cityAnnualHours.toLocaleString()}
              <span className="text-xl font-normal ml-1">hrs</span>
            </p>
            <p className="text-xs text-blue-400 mt-1">across {calc.shifters.toLocaleString()} commuters</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">CO₂ Reduced / Year</p>
            <p className="text-3xl font-bold text-blue-700">
              <Num value={calc.cityAnnualCO2Ton} decimals={1} />
              <span className="text-xl font-normal ml-1">tons</span>
            </p>
            <p className="text-xs text-blue-400 mt-1">estimated annually</p>
          </div>
        </div>
      </div>

      {/* ── Transparency footer ────────────────────────────────────────── */}
      <div className="border-t border-slate-100 pt-4 text-xs text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-500">Assumptions: </span>
        {COMMUTE_DAYS_PER_YEAR} commute days/year · ${GAS_PRICE}/gal gas (Hawaii avg) ·{" "}
        {AVG_FUEL_GAL_PER_CONG_MIN} gal per congestion-minute ·{" "}
        {CO2_PER_CONGESTION_MIN} kg CO₂ per congestion-minute · {TOTAL_COMMUTERS.toLocaleString()} total commuters assumed.{" "}
        Simulation values are simplified estimates, not empirical measurements.
        Model: reduction_factor = 0.6 × participation_rate × (shift_min / 10).
      </div>
    </div>
  );
}
