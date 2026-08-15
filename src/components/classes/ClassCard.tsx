import { Link } from "react-router-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { JoinCodeBadge } from "./JoinCodeBadge";
import { ClassSettings } from "./ClassSettings";
import { formatSchedule } from "@/lib/weekdays";
import type { ScheduleSlot } from "@/lib/types";

export function ClassCard({
  id,
  name,
  schedule,
  joinCode,
  isTeacher = false,
  draggable = false,
}: {
  id: string;
  name: string;
  schedule: ScheduleSlot[];
  /** Pass only for the teacher view — students don't need to see it here. */
  joinCode?: string;
  /** Shows the edit/delete controls — same ones available inside the
   *  board itself — right on the dashboard card, no need to open the
   *  board first. */
  isTeacher?: boolean;
  /** Shows a drag handle for reordering (see ClassGrid). Only the
   *  teacher's own dashboard is orderable — a student's write would be
   *  rejected by Firestore Security Rules anyway. */
  draggable?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !draggable,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const scheduleLabel = schedule.length > 0 ? formatSchedule(schedule) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      {draggable && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="드래그하여 순서 변경"
          className="absolute right-2 top-2 cursor-grab touch-none rounded p-1 leading-none text-zinc-300 hover:text-zinc-500 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-400"
        >
          ⠿
        </button>
      )}
      <Link to={`/classes/${id}`} className="flex flex-col gap-2 pr-5">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{name}</span>
        {scheduleLabel && <span className="text-xs text-zinc-500 dark:text-zinc-400">{scheduleLabel}</span>}
      </Link>
      {joinCode && <JoinCodeBadge code={joinCode} />}
      {isTeacher && <ClassSettings classRow={{ id, name, schedule, joinCode: joinCode ?? "" }} />}
    </div>
  );
}
