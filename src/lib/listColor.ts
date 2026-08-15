/** Soft pastel palette for student lists (teacher lists stay neutral zinc
 *  — see ListColumn.tsx). Each entry is a complete, literal Tailwind class
 *  string on purpose: Tailwind's build-time scanner only generates CSS for
 *  class names it can find as-is in the source, so building these via
 *  `bg-${color}-100` template interpolation would silently produce no
 *  styles at all. */
const PASTEL_LIST_COLORS = [
  "border-rose-200 bg-rose-100/70 dark:border-rose-900 dark:bg-rose-950/40",
  "border-orange-200 bg-orange-100/70 dark:border-orange-900 dark:bg-orange-950/40",
  "border-amber-200 bg-amber-100/70 dark:border-amber-900 dark:bg-amber-950/40",
  "border-emerald-200 bg-emerald-100/70 dark:border-emerald-900 dark:bg-emerald-950/40",
  "border-teal-200 bg-teal-100/70 dark:border-teal-900 dark:bg-teal-950/40",
  "border-sky-200 bg-sky-100/70 dark:border-sky-900 dark:bg-sky-950/40",
  "border-indigo-200 bg-indigo-100/70 dark:border-indigo-900 dark:bg-indigo-950/40",
  "border-violet-200 bg-violet-100/70 dark:border-violet-900 dark:bg-violet-950/40",
  "border-pink-200 bg-pink-100/70 dark:border-pink-900 dark:bg-pink-950/40",
];

/** Deterministic pick from `seed` (a list's id) — looks random across
 *  different lists, but the same list keeps the same color across
 *  reloads and re-renders instead of reshuffling every time. */
export function pastelListColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % PASTEL_LIST_COLORS.length;
  return PASTEL_LIST_COLORS[index];
}
