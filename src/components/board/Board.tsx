import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { ListRow, CardRow } from "@/lib/types";
import { ListColumn } from "./ListColumn";
import { AddListButton } from "./AddListButton";
import { moveCard } from "@/lib/firestore/cards";
import { midPosition } from "@/lib/position";

type DragOverInfo = { type: "list" | "card"; listId?: string } | undefined;

export function Board({
  classId,
  teacherId,
  viewerId,
  viewerIsTeacher,
  lists,
  cards,
}: {
  classId: string;
  teacherId: string;
  viewerId: string;
  viewerIsTeacher: boolean;
  lists: ListRow[];
  cards: CardRow[];
}) {
  const [activeCard, setActiveCard] = useState<CardRow | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const cardsByList = useMemo(() => {
    const map = new Map<string, CardRow[]>();
    for (const list of lists) map.set(list.id, []);
    for (const card of [...cards].sort((a, b) => a.position - b.position)) {
      map.get(card.listId)?.push(card);
    }
    return map;
  }, [lists, cards]);

  // A list belongs to one person. Editing it — adding/renaming/deleting
  // cards — is only for that person (or the teacher, for their own and
  // every student's list). No one edits someone else's list.
  function canModify(list: ListRow) {
    if (list.listType === "teacher") return viewerIsTeacher;
    return viewerIsTeacher || list.ownerId === viewerId;
  }

  function handleDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "card") {
      setActiveCard(cards.find((c) => c.id === event.active.id) ?? null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as DragOverInfo;
    const overData = over.data.current as DragOverInfo;
    if (activeData?.type !== "card") return;

    const cardId = String(active.id);
    const sourceListId = activeData.listId;
    const targetListId =
      overData?.type === "card" ? overData.listId : overData?.type === "list" ? overData.listId : undefined;
    if (!targetListId) return;

    // Cards represent one person's own activity log — moving one into
    // someone else's list doesn't make sense, so only same-list reorders
    // are allowed (Firestore Security Rules would reject a cross-list
    // move anyway, since a card's listId/classId are immutable there).
    if (targetListId !== sourceListId) return;

    const targetCards = (cardsByList.get(targetListId) ?? []).filter((c) => c.id !== cardId);
    let insertIndex = targetCards.length; // default: append at the end
    if (overData?.type === "card") {
      const overIndex = targetCards.findIndex((c) => c.id === over.id);
      if (overIndex !== -1) insertIndex = overIndex;
    }

    const before = targetCards[insertIndex - 1]?.position;
    const after = targetCards[insertIndex]?.position;
    const position = midPosition(before, after);

    void moveCard(cardId, position);
  }

  return (
    <DndContext
      id={`board-${classId}`}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 items-start gap-3 overflow-x-auto pb-4">
        {lists.map((list) => (
          <ListColumn
            key={list.id}
            list={list}
            cards={cardsByList.get(list.id) ?? []}
            classId={classId}
            canModify={canModify(list)}
            showVisibilityControls={list.listType === "teacher" && viewerIsTeacher}
          />
        ))}
        {viewerIsTeacher && <AddListButton classId={classId} teacherId={teacherId} />}
      </div>

      <DragOverlay>
        {activeCard && (
          <div className="w-64 rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm shadow-lg dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100">
            {activeCard.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
