"use client";

import { useState, useMemo } from "react";

interface CollectiveImpactProps {
  peakDelayMinutes: number;
  freeFlowMinutes: number;
  personalSavedMin: number;
  worstLabel: string;
  bestLabel: string;
}

const COMMUTE_DAYS_PER_YEAR      = 240;
const AVG_FUEL_GAL_PER_CONG_MIN = 0.034;
const GAS_PRICE                  = 4.50;
const CO2_PER_CONGESTION_MIN     = 0.02;
const TOTAL_COMMUTERS            = 10_857;

function equiv(co2Kg: number): string {
  const trees = Math.round(co2Kg / 21);
  if (trees >= 1) return `≈ ${trees} tree${trees > 1 ? "s" : ""} planted`;
  const phoneCharges = Math.round(co2Kg / 0.005);
  return `≈ ${phoneCharges.toLocaleString()} phone charges`;
}

interface DataCellProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
}

function DataCell({ label, value, unit, sub }: DataCellProps) {
  return (
    <div className="py-4 border-r border-[#E5E7EB] last:border-r-0 px-6 first:pl-0 last:pr-0">
      <p className="text-[12px] text-[#6B7280] mb-2 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-[32px] font-semibold text-[#111827] leading-none tabular-nums">
        {value}
        {unit && <span className="text-[16px] font-normal text-[#6B7280] ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-[12px] text-[#9CA3AF] mt-1.5">{sub}</p>}
    </div>
  );
}

export default function CollectiveImpact({
  peakDelayMinutes,
  freeFlowMinutes,
  personalSavedMin,
  worstLabel,
  bestLabel,
}: CollectiveImpactProps) {
  const [personalShift, setPersonalShift] = useState(10);
  const [participationPct, setParticipationPct] = useState(10);

  const personal = useMemo(() => {
    const savedMin    = Math.min(personalShift, peakDelayMinutes);
    const annualHours = (savedMin * COMMUTE_DAYS_PER_YEAR) / 60;
    const annualFuel  = savedMin * COMMUTE_DAYS_PER_YEAR * AVG_FUEL_GAL_PER_CONG_MIN * GAS_PRICE;
    const annualCO2   = savedMin * COMMUTE_DAYS_PER_YEAR * CO2_PER_CONGESTION_MIN;
    return { savedMin, annualHours, annualFuel, annualCO2 };
  }, [personalShift, peakDelayMinutes]);

  const city = useMemo(() => {
    const rate              = participationPct / 100;
    const reductionFactor   = 0.6 * rate * (Math.max(personalSavedMin, 5) / 10);
    const shifters          = Math.round(TOTAL_COMMUTERS * rate);
    const delayReduced      = peakDelayMinutes * reductionFactor;
    const cityAnnualHours   = Math.round((shifters * delayReduced * 365) / 60);
    const cityAnnualCO2Ton  = Math.round((shifters * delayReduced * 365 * CO2_PER_CONGESTION_MIN / 1000) * 10) / 10;
    const congRedPct        = Math.round(reductionFactor * 100);
    return { shifters, congRedPct, cityAnnualHours, cityAnnualCO2Ton };
  }, [participationPct, personalSavedMin, peakDelayMinutes]);

  if (peakDelayMinutes <= 0 || freeFlowMinutes <= 0) return null;

  return (
    <div className="mt-8 border border-[#E5E7EB] rounded-[4px] bg-white">

      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E5E7EB]">
        <h3 className="text-[14px] font-semibold text-[#111827]">Estimated Annual Impact</h3>
        <p className="text-[12px] text-[#6B7280] mt-0.5">
          Projected savings from shifting departure — {bestLabel} vs {worstLabel}
        </p>
      </div>

      {/* Personal impact */}
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-medium text-[#111827]">Personal · {personalShift} min earlier</p>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#9CA3AF]">Shift earlier by:</span>
            <input
              type="range" min={5} max={30} step={5}
              value={personalShift}
              onChange={(e) => setPersonalShift(Number(e.target.value))}
              className="w-28 accent-[#2563EB]"
            />
            <span className="text-[12px] font-medium text-[#111827] w-12 text-right tabular-nums">{personalShift} min</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-0 divide-x divide-[#E5E7EB]">
          <DataCell
            label="Time saved / year"
            value={personal.annualHours.toFixed(1)}
            unit="hrs"
            sub={`${personal.savedMin} min × ${COMMUTE_DAYS_PER_YEAR} days`}
          />
          <DataCell
            label="Fuel saved"
            value={`$${Math.round(personal.annualFuel)}`}
            sub={`at $${GAS_PRICE}/gal (Hawaii avg)`}
          />
          <DataCell
            label="CO₂ avoided"
            value={personal.annualCO2.toFixed(1)}
            unit="kg"
            sub={equiv(personal.annualCO2)}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 border-t border-[#E5E7EB] my-2" />

      {/* City-scale impact */}
      <div className="px-6 pt-2 pb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-medium text-[#111827]">
            City-scale · {participationPct}% of H-1 commuters shift
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#9CA3AF]">Participation:</span>
            <input
              type="range" min={1} max={30} step={1}
              value={participationPct}
              onChange={(e) => setParticipationPct(Number(e.target.value))}
              className="w-28 accent-[#2563EB]"
            />
            <span className="text-[12px] font-medium text-[#111827] w-12 text-right tabular-nums">{participationPct}%</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-0 divide-x divide-[#E5E7EB]">
          <DataCell
            label="Peak congestion"
            value={`−${city.congRedPct}%`}
            sub={`${city.shifters.toLocaleString()} of ${TOTAL_COMMUTERS.toLocaleString()} commuters`}
          />
          <DataCell
            label="Time saved / year"
            value={city.cityAnnualHours.toLocaleString()}
            unit="hrs"
            sub="across shifting commuters"
          />
          <DataCell
            label="CO₂ reduced / year"
            value={city.cityAnnualCO2Ton.toFixed(1)}
            unit="tons"
            sub="estimated annually"
          />
        </div>
      </div>

      {/* Footer note */}
      <div className="px-6 py-3 border-t border-[#E5E7EB] bg-[#FAFAFA]">
        <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
          Source: HDOT HPMS Dataset — H-1 AADT 65,800 vehicles/day · Morning rush 6–9 AM ≈ 15% × 1.1 occupancy = {TOTAL_COMMUTERS.toLocaleString()} commuters.
          {" "}{COMMUTE_DAYS_PER_YEAR} commute days/yr · ${GAS_PRICE}/gal · Simulation only.
        </p>
      </div>

    </div>
  );
}
