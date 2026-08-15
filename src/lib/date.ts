/** Formats a "YYYY-MM-DD" date string (e.g. cards.display_date) for
 *  display, e.g. "2026-08-11" -> "2026.08.11". Plain string manipulation
 *  on purpose — the value has no time/timezone component, so parsing it
 *  through `Date` risks an off-by-one-day shift depending on the
 *  viewer's local timezone. */
export function formatDisplayDate(isoDate: string): string {
  return isoDate.replaceAll("-", ".");
}
