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
      headline: "Hmm, no data came back.",
      detail: "Try checking your origin and destination — sometimes the API needs a moment.",
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

  // Trend: are later slots worse or better?
  const firstHalf = stressData.slice(0, Math.ceil(stressData.length / 2));
  const secondHalf = stressData.slice(Math.ceil(stressData.length / 2));
  const avgFirst = firstHalf.reduce((s, d) => s + d.durationInTrafficMinutes, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((s, d) => s + d.durationInTrafficMinutes, 0) / secondHalf.length;
  const trend = avgSecond > avgFirst ? "worsening" : "improving";

  // ── Headline ──────────────────────────────────────────────────────────
  let headline = "";
  if (allLate) {
    headline = "Every slot in this window runs late. The whole window might need to shift earlier.";
  } else if (anyOnTime && timeSaved >= 15) {
    headline = `Whoa — leaving at ${bestSlot.departureLabel} instead of ${worstSlot.departureLabel} saves ${timeSaved} minutes. That's huge.`;
  } else if (anyOnTime && timeSaved >= 5) {
    headline = `Leaving at ${bestSlot.departureLabel} saves about ${timeSaved} minutes compared to ${worstSlot.departureLabel}.`;
  } else {
    headline = "Traffic is pretty consistent across this window — timing doesn't change much here.";
  }

  // ── Detail ────────────────────────────────────────────────────────────
  let detail = "";
  if (trend === "worsening") {
    detail = `Traffic gets heavier as the window goes on. The earlier you leave, the smoother the ride — ${bestSlot.departureLabel} looks like the sweet spot.`;
  } else {
    detail = `Interestingly, traffic actually eases later in this window. ${bestSlot.departureLabel} might be worth trying if your schedule allows.`;
  }

  // ── Tip ───────────────────────────────────────────────────────────────
  let tip = "";
  if (allLate) {
    tip = "Try moving your departure window 15–30 minutes earlier, or adjust your arrival goal. Small shifts can make a real difference.";
  } else if (timeSaved >= 10) {
    tip = `Just ${timeSaved} minutes of timing difference — that's the kind of thing most people never think about, but it adds up fast over a whole year.`;
  } else {
    tip = "Not a huge difference here, but on other days or routes the gap can be much bigger. Worth checking regularly!";
  }

  return { headline, detail, tip };
}

// Future LLM integration stub
export async function generateAICommentLLM(
  _context: AICommentContext
): Promise<AIComment> {
  throw new Error("LLM integration not yet implemented");
}
