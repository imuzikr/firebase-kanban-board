import { useState, useTransition } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { ListRow, CardRow } from "@/lib/types";
import { CardItem } from "./CardItem";
import { AddCardForm } from "./AddCardForm";
import { deleteList } from "@/lib/firestore/lists";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { pastelListColor } from "@/lib/listColor";

const TEACHER_LIST_COLOR = "border-zinc-200 bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-900/60";

export function ListColumn({
  list,
  cards,
  classId,
  canModify,
  showVisibilityControls,
}: {
  list: ListRow;
  cards: CardRow[];
  classId: string;
  canModify: boolean;
  showVisibilityControls: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: list.id,
    data: { type: "list", listId: list.id },
  });

  const canDelete = canModify && list.listType === "teacher";
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  function confirmDelete() {
    setDeleteError(null);
    startDelete(async () => {
      try {
        await deleteList(list.id);
        // no manual state removal needed — the board's onSnapshot
        // listener drops the list as soon as it's deleted.
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "삭제에 실패했습니다");
        setConfirmingDelete(false);
      }
    });
  }

  const colorClasses = list.listType === "teacher" ? TEACHER_LIST_COLOR : pastelListColor(list.id);

  return (
    <div className={`flex h-fit w-64 shrink-0 flex-col rounded-lg border ${colorClasses}`}>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{list.title}</h3>
        <div className="flex shrink-0 items-center gap-1.5">
          {list.listType === "teacher" && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              교사
            </span>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              aria-label="리스트 삭제"
              className="rounded px-1 text-xs text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
            >
              삭제
            </button>
          )}
        </div>
      </div>

      {deleteError && <p className="px-3 pb-1 text-xs text-red-600 dark:text-red-400">{deleteError}</p>}

      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex min-h-[8px] flex-col gap-2 px-2 pb-2">
          {cards.map((card) => (
            <CardItem key={card.id} card={card} canModify={canModify} showVisibilityControls={showVisibilityControls} />
          ))}
        </div>
      </SortableContext>

      {canModify && (
        <div className="px-2 pb-2">
          <AddCardForm
            listId={list.id}
            classId={classId}
            listType={list.listType}
            showVisibilityControls={showVisibilityControls}
          />
        </div>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="리스트를 삭제할까요?"
          message={`"${list.title}" 리스트를 삭제하면 이 안의 카드가 모두 함께 삭제되며 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          danger
          pending={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
