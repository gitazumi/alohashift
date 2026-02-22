"use client";

interface CO2SectionProps {
  savingsKg: number;
  savingsGrams: number;
  equivalent: string;
  worstLabel: string;
  bestLabel: string;
}

export default function CO2Section({
  savingsKg,
  savingsGrams,
  equivalent,
  worstLabel,
  bestLabel,
}: CO2SectionProps) {
  if (savingsGrams <= 0) return null;

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🌿</span>
        <div>
          <h3 className="text-base font-semibold text-emerald-800">
            CO₂ Perspective
          </h3>
          <p className="text-xs text-emerald-600">
            Estimated reduction by choosing optimal departure
          </p>
        </div>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold text-emerald-700">
          {savingsGrams}
          <span className="text-base font-normal ml-0.5">g</span>
        </span>
        <span className="text-sm text-emerald-600 mb-1">
          CO₂ saved vs. worst window
        </span>
      </div>

      <p className="text-sm text-emerald-700 mb-3">{equivalent}</p>

      <div className="text-xs text-emerald-600 bg-white bg-opacity-60 rounded-xl p-3 border border-emerald-100">
        Comparing <span className="font-semibold">{bestLabel}</span> (optimal)
        vs <span className="font-semibold">{worstLabel}</span> (worst window)
        &mdash; based on 0.02 kg CO₂ per congestion minute avoided.
      </div>
    </div>
  );
}
