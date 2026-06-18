// date.ts — strict ISO date parsing shared by all tools.
//
// A regex on YYYY-MM-DD only checks the SHAPE, not whether the date exists.
// `new Date("2026-02-29")` (2026 isn't a leap year) silently rolls to Mar 1,
// so a tool would return a reading for the WRONG day with no error. For a
// product that's entirely about dates, that's a correctness bug. This does a
// round-trip check so impossible dates (Feb 29 in a non-leap year, Feb 30,
// month 13, day 45, …) are rejected cleanly.

export function parseISODate(input: unknown, label = "date"): Date {
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    throw new Error(`${label} must be YYYY-MM-DD`);
  }
  const [y, m, d] = input.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Reject anything that didn't survive the round-trip (rolled/legacy-year).
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    throw new Error(`${label} is not a real calendar date: ${input}`);
  }
  return date;
}
