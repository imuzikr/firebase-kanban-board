import { useState, useTransition } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { ListRow, CardRow } from "@/lib/types";
import { CardItem } from "./CardItem";
import { AddCardForm } from "./AddCardForm";
import { deleteList, updateListTitle } from "@/lib/firestore/lists";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { pastelListColor } from "@/lib/listColor";

const TEACHER_LIST_COLOR = "border-zinc-200 bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-900/60";

export function ListColumn({
  list,
  cards,
  classId,
  canModify,
  canRename,
  showVisibilityControls,
}: {
  list: ListRow;
  cards: CardRow[];
  classId: string;
  canModify: boolean;
  /** Teacher-only, independent of canModify — lets the teacher fix a
   *  typo in ANY list's title on their class, including a student's own
   *  list (students never get this, even on their own list). */
  canRename: boolean;
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

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [isSavingTitle, startSaveTitle] = useTransition();

  function confirmDelete() {
    setDeleteError(null);
    startDelete(async () => {
      try {
        await deleteList(list.id, classId);
        // no manual state removal needed — the board's onSnapshot
        // listener drops the list as soon as it's deleted.
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "삭제에 실패했습니다");
        setConfirmingDelete(false);
      }
    });
  }

  function handleTitleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = String(new FormData(e.currentTarget).get("title") ?? "").trim();
    if (!title) return setTitleError("리스트 이름을 입력해주세요");

    setTitleError(null);
    startSaveTitle(async () => {
      try {
        await updateListTitle(list.id, title);
        setEditingTitle(false);
      } catch (err) {
        setTitleError(err instanceof Error ? err.message : "저장에 실패했습니다");
      }
    });
  }

  const colorClasses = list.listType === "teacher" ? TEACHER_LIST_COLOR : pastelListColor(list.id);

  return (
    <div className={`flex h-fit w-64 shrink-0 flex-col rounded-lg border ${colorClasses}`}>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        {editingTitle ? (
          <form onSubmit={handleTitleSubmit} className="flex min-w-0 flex-1 items-center gap-1">
            <input
              name="title"
              defaultValue={list.title}
              autoFocus
              required
              className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-sm font-semibold text-zinc-700 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            />
            <button
              type="submit"
              disabled={isSavingTitle}
              className="shrink-0 rounded px-1 text-xs text-zinc-500 hover:text-zinc-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingTitle(false);
                setTitleError(null);
              }}
              className="shrink-0 rounded px-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              취소
            </button>
          </form>
        ) : (
          <h3 className="truncate text-sm font-semibold text-zinc-700 dark:text-zinc-200">{list.title}</h3>
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          {list.listType === "teacher" && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              교사
            </span>
          )}
          {canRename && !editingTitle && (
            <button
              type="button"
              onClick={() => setEditingTitle(true)}
              aria-label="리스트 이름 수정"
              className="rounded px-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              수정
            </button>
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

      {titleError && <p className="px-3 pb-1 text-xs text-red-600 dark:text-red-400">{titleError}</p>}
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
