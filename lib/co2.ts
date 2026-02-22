// CO2 estimation: 1 min of congestion ≈ 0.02 kg CO2
const CO2_PER_CONGESTION_MINUTE = 0.02;

export function estimateCO2Savings(
  worstDelayMinutes: number,
  bestDelayMinutes: number
): {
  savingsKg: number;
  savingsGrams: number;
  equivalent: string;
} {
  const savedMinutes = Math.max(0, worstDelayMinutes - bestDelayMinutes);
  const savingsKg = savedMinutes * CO2_PER_CONGESTION_MINUTE;
  const savingsGrams = Math.round(savingsKg * 1000);

  // Contextual equivalents
  let equivalent = "";
  if (savingsGrams >= 500) {
    equivalent = `≈ ${(savingsGrams / 1000).toFixed(2)} km driven equivalent saved`;
  } else if (savingsGrams >= 100) {
    equivalent = `≈ charging your phone ${Math.round(savingsGrams / 8)} times`;
  } else if (savingsGrams > 0) {
    equivalent = `≈ ${savingsGrams}g — small but meaningful`;
  } else {
    equivalent = "Similar across all departure times";
  }

  return {
    savingsKg: Math.round(savingsKg * 100) / 100,
    savingsGrams,
    equivalent,
  };
}
