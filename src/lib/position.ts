/**
 * Trello-style fractional positions: reordering an item only ever needs to
 * update that one row, by placing it halfway between its new neighbors.
 */
export function midPosition(before?: number | null, after?: number | null): number {
  const b = before ?? undefined;
  const a = after ?? undefined;
  if (b === undefined && a === undefined) return 1000;
  if (b === undefined) return a! / 2;
  if (a === undefined) return b + 1000;
  return (b + a) / 2;
}
