import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { ClassCard } from "./ClassCard";
import { reorderClass } from "@/lib/firestore/classes";
import { midPosition } from "@/lib/position";
import type { ClassRow } from "@/lib/types";

type ClassItem = Pick<ClassRow, "id" | "name" | "joinCode" | "schedule" | "position">;

/** Teacher's dashboard grid, drag-reorderable. Students get a plain
 *  (non-draggable) grid — Firestore Security Rules only let the teacher
 *  write a class's position anyway.
 *
 *  No local optimistic-state copy here (unlike the Supabase/Next.js
 *  version this was ported from, which needed one to survive
 *  revalidatePath re-fetches without flicker) — `classes` already comes
 *  from a live onSnapshot listener upstream, and Firestore applies a
 *  local write to that listener's cache near-instantly, before the
 *  server round-trip completes, so the prop itself updates fast enough
 *  to double as the optimistic state. */
export function ClassGrid({
  classes,
  isTeacher,
}: {
  classes: ClassItem[];
  isTeacher: boolean;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = classes.findIndex((c) => c.id === active.id);
    const newIndex = classes.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(classes, oldIndex, newIndex);
    const before = reordered[newIndex - 1]?.position;
    const after = reordered[newIndex + 1]?.position;
    const position = midPosition(before, after);

    void reorderClass(String(active.id), position);
  }

  if (!isTeacher) {
    return (
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <ClassCard key={c.id} id={c.id} name={c.name} schedule={c.schedule} />
        ))}
      </section>
    );
  }

  return (
    <DndContext
      id="class-grid"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={classes.map((c) => c.id)} strategy={rectSortingStrategy}>
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <ClassCard
              key={c.id}
              id={c.id}
              name={c.name}
              schedule={c.schedule}
              joinCode={c.joinCode}
              isTeacher
              draggable
            />
          ))}
        </section>
      </SortableContext>
    </DndContext>
  );
}
