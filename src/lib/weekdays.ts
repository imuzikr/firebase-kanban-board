import type { ScheduleSlot, Weekday } from "@/lib/types";

/** Canonical order (Mon → Fri) — also the option order in the create-class form. */
export const WEEKDAYS: { value: Weekday; label: string }[] = [
  { value: "mon", label: "월" },
  { value: "tue", label: "화" },
  { value: "wed", label: "수" },
  { value: "thu", label: "목" },
  { value: "fri", label: "금" },
];

const WEEKDAY_ORDER: Record<Weekday, number> = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4 };
const WEEKDAY_LABEL: Record<Weekday, string> = Object.fromEntries(
  WEEKDAYS.map((d) => [d.value, d.label]),
) as Record<Weekday, string>;

/** e.g. ["fri", "mon"] -> "월,금" — sorted Mon→Fri regardless of selection order. */
export function formatWeekdays(weekdays: Weekday[]): string {
  return [...weekdays]
    .sort((a, b) => WEEKDAY_ORDER[a] - WEEKDAY_ORDER[b])
    .map((d) => WEEKDAY_LABEL[d])
    .join(",");
}

/** e.g. [{weekdays:["mon","wed"],period:3}, {weekdays:["fri"],period:5}]
 *  -> "월,수 · 3교시 / 금 · 5교시" */
export function formatSchedule(schedule: ScheduleSlot[]): string {
  return schedule.map((s) => `${formatWeekdays(s.weekdays)} · ${s.period}교시`).join(" / ");
}
