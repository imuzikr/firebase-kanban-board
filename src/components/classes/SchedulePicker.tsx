import { useState } from "react";
import { WEEKDAYS, formatWeekdays } from "@/lib/weekdays";
import type { ScheduleSlot, Weekday } from "@/lib/types";

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

const pillBase =
  "flex h-9 w-full items-center justify-center rounded-md border text-sm font-medium transition-colors";
const pillInactive =
  "border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";
const pillActive =
  "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900";

function isBlank(slot: ScheduleSlot) {
  return slot.weekdays.length === 0 && slot.period === 0;
}
function isComplete(slot: ScheduleSlot) {
  return slot.weekdays.length > 0 && slot.period > 0;
}

/** A class can meet on different days at different periods (월,수 3교시
 *  AND 금 5교시), so the schedule is a repeatable list of {weekdays,
 *  period} slots. Only one slot is expanded for editing at a time —
 *  finishing it (via "+ 요일·교시 추가" or switching to another slot)
 *  collapses it into a compact summary row instead of letting every
 *  slot stay expanded and the form grow without bound. Fully
 *  client-state driven (no native checkbox/radio inputs), serialized
 *  to a single hidden JSON input on submit so it works inside a
 *  native form action. */
export function SchedulePicker({
  name = "schedule",
  defaultSchedule = [],
}: {
  name?: string;
  defaultSchedule?: ScheduleSlot[];
}) {
  const [slots, setSlots] = useState<ScheduleSlot[]>(
    defaultSchedule.length > 0 ? defaultSchedule : [{ weekdays: [], period: 0 }],
  );
  // Existing (already-saved) slots start collapsed; a brand-new picker
  // starts with its one blank slot open for input.
  const [editingIndex, setEditingIndex] = useState<number | null>(defaultSchedule.length > 0 ? null : 0);
  const [addError, setAddError] = useState<string | null>(null);

  function toggleWeekday(index: number, day: Weekday) {
    setSlots((cur) =>
      cur.map((s, i) =>
        i === index
          ? { ...s, weekdays: s.weekdays.includes(day) ? s.weekdays.filter((d) => d !== day) : [...s.weekdays, day] }
          : s,
      ),
    );
  }

  function setPeriod(index: number, period: number) {
    setSlots((cur) => cur.map((s, i) => (i === index ? { ...s, period } : s)));
  }

  /** Move the "active editor" to a different slot (or none). If the slot
   *  being left is untouched, it's dropped silently; if it's half-filled
   *  (only weekdays or only a period), the switch is blocked with an
   *  inline error instead of losing that input. */
  function trySwitchEditing(nextIndex: number | null) {
    if (editingIndex === null) {
      setAddError(null);
      setEditingIndex(nextIndex);
      return;
    }
    const current = slots[editingIndex];
    if (isBlank(current)) {
      setSlots((cur) => cur.filter((_, i) => i !== editingIndex));
      setAddError(null);
      setEditingIndex(nextIndex !== null && nextIndex > editingIndex ? nextIndex - 1 : nextIndex);
      return;
    }
    if (!isComplete(current)) {
      setAddError("요일과 교시를 모두 선택해주세요");
      return;
    }
    setAddError(null);
    setEditingIndex(nextIndex);
  }

  function addSlot() {
    if (editingIndex !== null) {
      const current = slots[editingIndex];
      if (isBlank(current)) return; // already have an empty editor open
      if (!isComplete(current)) {
        setAddError("요일과 교시를 모두 선택해주세요");
        return;
      }
    }
    setAddError(null);
    setEditingIndex(slots.length);
    setSlots((cur) => [...cur, { weekdays: [], period: 0 }]);
  }

  function removeSlot(index: number) {
    setSlots((cur) => cur.filter((_, i) => i !== index));
    setEditingIndex((cur) => {
      if (cur === null || cur === index) return null;
      return cur > index ? cur - 1 : cur;
    });
    setAddError(null);
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(slots.filter((s) => !isBlank(s)))} />

      {slots.map((slot, i) =>
        i === editingIndex ? (
          <div key={i} className="space-y-2 rounded-md border border-zinc-200 p-2.5 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">일정 {i + 1}</span>
              {slots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="text-xs text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  삭제
                </button>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-xs text-zinc-500 dark:text-zinc-400">요일 (중복 선택 가능)</p>
              <div className="grid grid-cols-5 gap-1.5">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleWeekday(i, d.value)}
                    className={`${pillBase} ${slot.weekdays.includes(d.value) ? pillActive : pillInactive}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs text-zinc-500 dark:text-zinc-400">교시 (하나만 선택)</p>
              <div className="grid grid-cols-7 gap-1.5">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(i, p)}
                    className={`${pillBase} ${slot.period === p ? pillActive : pillInactive}`}
                  >
                    {p}교시
                  </button>
                ))}
              </div>
            </div>

            {addError && <p className="text-xs text-red-600 dark:text-red-400">{addError}</p>}
          </div>
        ) : (
          <div
            key={i}
            className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700"
          >
            <span className="text-zinc-700 dark:text-zinc-200">
              <span className="mr-2 text-xs font-medium text-zinc-400 dark:text-zinc-500">일정 {i + 1}</span>
              {formatWeekdays(slot.weekdays)} · {slot.period}교시
            </span>
            <span className="flex shrink-0 items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => trySwitchEditing(i)}
                className="text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                수정
              </button>
              {slots.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSlot(i)}
                  className="text-red-600 underline hover:text-red-700 dark:text-red-400"
                >
                  삭제
                </button>
              )}
            </span>
          </div>
        ),
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={addSlot}
          className="rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          + 요일·교시 추가
        </button>
      </div>
    </div>
  );
}
