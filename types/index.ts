export interface ETARequest {
  origin: string;
  destination: string;
  departureTimes: number[]; // Unix timestamps
}

export interface ETAResult {
  departureTime: number; // Unix timestamp
  departureLabel: string; // e.g. "6:40 AM"
  arrivalTime: number; // Unix timestamp
  arrivalLabel: string; // e.g. "7:10 AM"
  durationSeconds: number; // free-flow duration
  durationInTrafficSeconds: number; // with traffic
  status: string;
}

export interface ETAResponse {
  results: ETAResult[];
  freeFlowDuration: number; // minimum duration as baseline
  error?: string;
}

export type StressLevel = "stable" | "moderate" | "volatile";

export interface StressData {
  departureLabel: string;
  arrivalLabel: string;
  durationMinutes: number;
  durationInTrafficMinutes: number;
  stressIndex: number;       // 0–200 raw; displayed 0–100 normalized
  stressLevel: StressLevel;  // stable / moderate / volatile
  riskFactor: number;
  latenessRisk: "green" | "yellow" | "red";
  minutesBuffer: number;
  isSweetSpot: boolean;
}

// 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
export type TargetDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface FormValues {
  origin: string;
  destination: string;
  startTime: string;          // "HH:MM" — earliest departure to analyze
  endTime: string;            // "HH:MM" — latest departure to analyze
  intervalMinutes: number;    // spacing between slots (10 / 15 / 20)
  desiredArrivalTime: string; // "HH:MM" — goal arrival (for lateness check)
  targetDay: TargetDay;       // day of week to simulate
}
