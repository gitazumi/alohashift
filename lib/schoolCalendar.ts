/**
 * Hawaii DOE School Calendar
 *
 * Determines whether a given date is a school day in Hawaii.
 * Used to segment community commute data — school days have significantly
 * heavier traffic than non-school days (breaks, holidays, summer).
 *
 * School year structure (Hawaii DOE):
 *   - School year runs roughly late July/early August through mid-May
 *   - Summer break: ~June through late July
 *   - Winter break: ~Dec 23 – Jan 6
 *   - Spring break: ~2 weeks in March/April
 *   - Thanksgiving week
 *   - Federal holidays
 *
 * Strategy: define non-school date ranges per academic year.
 * Within the school year, weekdays are school days unless in a break range.
 * Weekends are always non-school days.
 */

interface DateRange {
  start: string; // "YYYY-MM-DD"
  end: string;   // "YYYY-MM-DD" (inclusive)
  label: string;
}

// Hawaii DOE 2024-2025 and 2025-2026 academic year breaks
// Source: https://www.hawaiipublicschools.org/TeachingAndLearning/StudentLearning/SchoolYear/Pages/School-Year-Calendar.aspx
const NON_SCHOOL_RANGES: DateRange[] = [
  // ── Summer 2024 ──────────────────────────────────────────
  { start: "2024-05-24", end: "2024-07-28", label: "Summer Break" },

  // ── SY 2024-2025 ─────────────────────────────────────────
  { start: "2024-08-05", end: "2024-08-05", label: "Holiday (Statehood Day)" },
  { start: "2024-09-02", end: "2024-09-02", label: "Holiday (Labor Day)" },
  { start: "2024-10-14", end: "2024-10-14", label: "Holiday (Columbus Day)" },
  { start: "2024-11-05", end: "2024-11-05", label: "Holiday (Election Day)" },
  { start: "2024-11-11", end: "2024-11-11", label: "Holiday (Veterans Day)" },
  { start: "2024-11-27", end: "2024-11-29", label: "Thanksgiving Break" },
  { start: "2024-12-23", end: "2025-01-03", label: "Winter Break" },
  { start: "2025-01-20", end: "2025-01-20", label: "Holiday (MLK Day)" },
  { start: "2025-02-17", end: "2025-02-17", label: "Holiday (Presidents Day)" },
  { start: "2025-03-17", end: "2025-03-21", label: "Spring Break" }, // approx
  { start: "2025-03-26", end: "2025-03-26", label: "Holiday (Prince Kuhio Day)" },
  { start: "2025-04-18", end: "2025-04-18", label: "Holiday (Good Friday)" },
  { start: "2025-05-26", end: "2025-05-26", label: "Holiday (Memorial Day)" },
  { start: "2025-05-23", end: "2025-07-27", label: "Summer Break" },

  // ── SY 2025-2026 ─────────────────────────────────────────
  { start: "2025-08-15", end: "2025-08-15", label: "Holiday (Statehood Day)" },
  { start: "2025-09-01", end: "2025-09-01", label: "Holiday (Labor Day)" },
  { start: "2025-10-13", end: "2025-10-13", label: "Holiday (Columbus Day)" },
  { start: "2025-11-11", end: "2025-11-11", label: "Holiday (Veterans Day)" },
  { start: "2025-11-26", end: "2025-11-28", label: "Thanksgiving Break" },
  { start: "2025-12-22", end: "2026-01-02", label: "Winter Break" },
  { start: "2026-01-19", end: "2026-01-19", label: "Holiday (MLK Day)" },
  { start: "2026-02-16", end: "2026-02-16", label: "Holiday (Presidents Day)" },
  { start: "2026-03-26", end: "2026-03-26", label: "Holiday (Prince Kuhio Day)" },
  { start: "2026-03-30", end: "2026-04-03", label: "Spring Break" }, // approx
  { start: "2026-04-03", end: "2026-04-03", label: "Holiday (Good Friday)" },
  { start: "2026-05-25", end: "2026-05-25", label: "Holiday (Memorial Day)" },
  { start: "2026-05-22", end: "2026-07-26", label: "Summer Break" },
];

// Parse "YYYY-MM-DD" to a comparable integer YYYYMMDD
function toInt(dateStr: string): number {
  return parseInt(dateStr.replace(/-/g, ""), 10);
}

// Format a Date in Hawaii time to "YYYY-MM-DD"
function toHawaiiDateStr(date: Date): string {
  const HAWAII_OFFSET_MS = -10 * 60 * 60 * 1000;
  const hawaiiMs = date.getTime() + HAWAII_OFFSET_MS;
  const d = new Date(hawaiiMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface SchoolDayInfo {
  isSchoolDay: boolean;
  reason: string; // e.g. "School day", "Summer Break", "Winter Break", "Weekend"
}

/**
 * Determine if a given JS Date is a Hawaii DOE school day.
 * @param date  Any JS Date (converted internally to Hawaii time)
 */
export function getSchoolDayInfo(date: Date = new Date()): SchoolDayInfo {
  const HAWAII_OFFSET_MS = -10 * 60 * 60 * 1000;
  const hawaiiMs = date.getTime() + HAWAII_OFFSET_MS;
  const hawaiiDate = new Date(hawaiiMs);
  const dayOfWeek = hawaiiDate.getUTCDay(); // 0=Sun, 6=Sat

  // Weekends are never school days
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isSchoolDay: false, reason: "Weekend" };
  }

  const dateStr = toHawaiiDateStr(date);
  const dateInt = toInt(dateStr);

  // Check if date falls in any non-school range
  for (const range of NON_SCHOOL_RANGES) {
    if (dateInt >= toInt(range.start) && dateInt <= toInt(range.end)) {
      return { isSchoolDay: false, reason: range.label };
    }
  }

  // Weekday not in any break = school day
  return { isSchoolDay: true, reason: "School day" };
}

/**
 * Convenience: is today a school day? (Hawaii time)
 */
export function isTodaySchoolDay(): SchoolDayInfo {
  return getSchoolDayInfo(new Date());
}
