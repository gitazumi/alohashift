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

// Source: HDOT HPMS Dataset (highways.hidot.hawaii.gov)
// H1 freeway peak section AADT = 65,800 vehicles/day
// Morning rush (6–9 AM) = ~15% of daily volume × 1.1 avg occupancy = ~10,857 commuters
const TOTAL_COMMUTERS            = 10_857; // HDOT AADT-based estimate, H1 morning commuters

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

  // Personal: how many minutes earlier to shift from worst slot
  const [personalShift, setPersonalShift] = useState(10);

  // City-scale slider
  const [participationPct, setParticipationPct] = useState(10);

  // ── A: Personal Impact ─────────────────────────────────────────────────
  // savedMin = congestion minutes avoided by shifting earlier from worst slot
  // Capped by actual peak delay in results
  const personal = useMemo(() => {
    const savedMin      = Math.min(personalShift, peakDelayMinutes);
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
  }, [personalShift, peakDelayMinutes]);

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
    <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-8">

      {/* ── Header ── */}
      <div>
        <h3 className="text-base font-semibold text-stone-800 mb-1">What a small shift adds up to</h3>
        <p className="text-sm text-stone-400">
          See what leaving a few minutes earlier means over a year — for you and for Honolulu.
        </p>
      </div>

      {/* ── SECTION A: PERSONAL IMPACT ── */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-emerald-800">Your personal savings</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            How much do you gain per year by choosing a less congested departure?
          </p>
        </div>

        {/* Shift slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-stone-500">
              How many minutes earlier do you leave?
            </label>
            <span className="text-sm font-bold text-emerald-700">{personalShift} min earlier</span>
          </div>
          <p className="text-xs text-stone-400 mb-2">
            Starting from <span className="font-medium text-stone-600">{worstLabel}</span> (most congested),
            shifting {personalShift} min earlier avoids up to{" "}
            <span className="font-medium text-emerald-700">{personal.savedMin} min</span> of congestion per commute.
          </p>
          <input
            type="range" min={5} max={30} step={5}
            value={personalShift}
            onChange={(e) => setPersonalShift(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-stone-300 mt-1">
            <span>5</span>
            <span className="hidden sm:block">10</span>
            <span className="hidden sm:block">15</span>
            <span>20</span>
            <span className="hidden sm:block">25</span>
            <span>30 min</span>
          </div>
        </div>

        {/* Personal result cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-emerald-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-medium text-emerald-600 mb-2">Time saved</p>
            <p className="text-3xl font-bold text-emerald-700 leading-none">
              <Num value={personal.annualHours} decimals={1} />
              <span className="text-base font-normal ml-1">hrs</span>
            </p>
            <p className="text-xs text-emerald-500 mt-1">per year</p>
            <p className="text-xs text-stone-400 mt-1">{personal.savedMin} min × {COMMUTE_DAYS_PER_YEAR} days</p>
            {personal.workdaysEquiv >= 0.5 && (
              <p className="text-xs text-emerald-600 mt-2 font-medium">
                ≈ {personal.workdaysEquiv} full workday{personal.workdaysEquiv !== 1 ? "s" : ""} back
              </p>
            )}
          </div>

          <div className="bg-white border border-emerald-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-medium text-emerald-600 mb-2">Fuel saved</p>
            <p className="text-3xl font-bold text-emerald-700 leading-none">
              $<Num value={personal.annualFuelDol} decimals={0} />
            </p>
            <p className="text-xs text-emerald-500 mt-1">per year</p>
            <p className="text-xs text-stone-400 mt-1">at ${GAS_PRICE}/gal (Hawaii avg)</p>
          </div>

          <div className="bg-white border border-emerald-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-medium text-emerald-600 mb-2">CO₂ avoided</p>
            <p className="text-3xl font-bold text-emerald-700 leading-none">
              <Num value={personal.annualCO2Kg} decimals={1} />
              <span className="text-base font-normal ml-1">kg</span>
            </p>
            <p className="text-xs text-emerald-500 mt-1">per year</p>
            <p className="text-xs text-emerald-600 mt-2 font-medium">{equiv(personal.annualCO2Kg)}</p>
          </div>
        </div>
      </div>

      {/* ── SECTION B: CITY-SCALE IMPACT ── */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-blue-800">If Honolulu shifted together</p>
          <p className="text-xs text-blue-500 mt-0.5">
            What if many of the ~{TOTAL_COMMUTERS.toLocaleString()} H1 morning commuters made the same timing shift?
          </p>
        </div>

        {/* Participation slider */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-medium text-stone-500">
              What % of commuters shift earlier?
            </label>
            <span className="text-sm font-bold text-blue-600">{participationPct}%</span>
          </div>
          <p className="text-xs text-stone-400 mb-2">
            = <span className="font-medium text-stone-600">{city.shifters.toLocaleString()} people</span>{" "}
            out of {TOTAL_COMMUTERS.toLocaleString()} H1 morning commuters choosing a better window
          </p>
          <input
            type="range" min={1} max={30} step={1}
            value={participationPct}
            onChange={(e) => setParticipationPct(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-stone-300 mt-1">
            <span>1%</span><span>30%</span>
          </div>
        </div>

        {/* City result cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-blue-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-medium text-blue-500 mb-2">Peak congestion</p>
            <p className="text-3xl font-bold text-blue-700">
              −{city.congRedPct}
              <span className="text-xl font-normal ml-0.5">%</span>
            </p>
            <p className="text-xs text-blue-400 mt-1">estimated reduction</p>
          </div>

          <div className="bg-white border border-blue-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-medium text-blue-500 mb-2">Time saved / year</p>
            <p className="text-3xl font-bold text-blue-700">
              {city.cityAnnualHours.toLocaleString()}
              <span className="text-base font-normal ml-1">hrs</span>
            </p>
            <p className="text-xs text-blue-400 mt-1">across {city.shifters.toLocaleString()} commuters</p>
          </div>

          <div className="bg-white border border-blue-100 rounded-2xl px-4 py-4 text-center">
            <p className="text-xs font-medium text-blue-500 mb-2">CO₂ reduced / year</p>
            <p className="text-3xl font-bold text-blue-700">
              <Num value={city.cityAnnualCO2Ton} decimals={1} />
              <span className="text-base font-normal ml-1">tons</span>
            </p>
            <p className="text-xs text-blue-400 mt-1">estimated annually</p>
          </div>
        </div>
      </div>

      {/* ── Transparency footer ── */}
      <div className="border-t border-stone-100 pt-4 text-xs text-stone-400 leading-relaxed space-y-1">
        <p>
          <span className="font-medium text-stone-500">Commuter estimate: </span>
          H1 freeway AADT = 65,800 vehicles/day (HDOT HPMS Dataset) ·
          Morning rush 6–9 AM ≈ 15% × 1.1 avg occupancy ={" "}
          <span className="font-medium text-stone-500">{TOTAL_COMMUTERS.toLocaleString()} commuters</span>.
        </p>
        <p>
          <span className="font-medium text-stone-500">Assumptions: </span>
          {COMMUTE_DAYS_PER_YEAR} commute days/yr · ${GAS_PRICE}/gal · simulation only, not financial advice.
        </p>
      </div>
    </div>
  );
}
