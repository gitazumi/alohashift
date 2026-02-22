import type { StressData } from "@/types";

export interface AICommentContext {
  stressData: StressData[];
  sweetSpotIndex: number; // kept for API compatibility, no longer used
  origin: string;
  destination: string;
}

export interface AIComment {
  headline: string;
  detail: string;
  tip: string;
}

export function generateAIComment(context: AICommentContext): AIComment {
  const { stressData } = context;

  if (!stressData || stressData.length === 0) {
    return {
      headline: "No data available.",
      detail: "Please try again with valid locations.",
      tip: "",
    };
  }

  const worstSlot = stressData.reduce((a, b) =>
    a.durationInTrafficMinutes > b.durationInTrafficMinutes ? a : b
  );
  const bestSlot = stressData.reduce((a, b) =>
    a.durationInTrafficMinutes < b.durationInTrafficMinutes ? a : b
  );

  const allLate = stressData.every((d) => d.latenessRisk === "red");
  const anyOnTime = stressData.some((d) => d.latenessRisk === "green");
  const timeSaved = worstSlot.durationInTrafficMinutes - bestSlot.durationInTrafficMinutes;

  // Analyze trend (early slots vs late slots)
  const firstHalf = stressData.slice(0, Math.ceil(stressData.length / 2));
  const secondHalf = stressData.slice(Math.ceil(stressData.length / 2));
  const avgFirst = firstHalf.reduce((s, d) => s + d.durationInTrafficMinutes, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, d) => s + d.durationInTrafficMinutes, 0) / secondHalf.length;
  const trend = avgSecond > avgFirst ? "worsening" : "improving";

  // Headline
  let headline = "";
  if (allLate) {
    headline = "All departure times in this window risk a late arrival.";
  } else if (anyOnTime && timeSaved >= 10) {
    headline = `Departing at ${bestSlot.departureLabel} saves ${timeSaved} minutes over ${worstSlot.departureLabel}.`;
  } else {
    headline = "Traffic conditions are relatively stable across this window.";
  }

  // Detail
  let detail = "";
  if (trend === "worsening") {
    detail = `Congestion builds as the window progresses. Leaving earlier — around ${bestSlot.departureLabel} — keeps travel time lower.`;
  } else {
    detail = `Traffic eases as the window progresses. A later departure around ${bestSlot.departureLabel} may offer a smoother ride.`;
  }

  // Tip
  let tip = "";
  if (allLate) {
    tip = "Consider shifting your entire departure window earlier, or adjusting your arrival goal time.";
  } else if (timeSaved >= 5) {
    tip = `Choosing ${bestSlot.departureLabel} over ${worstSlot.departureLabel} could save approximately ${timeSaved} minutes of travel time.`;
  } else {
    tip = "The difference between slots is small — any departure in this window should work well.";
  }

  return { headline, detail, tip };
}

// Future LLM integration stub
export async function generateAICommentLLM(
  _context: AICommentContext
): Promise<AIComment> {
  throw new Error("LLM integration not yet implemented");
}
