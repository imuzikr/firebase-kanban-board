import { useState, useTransition } from "react";
import { updateCard, deleteCard, toggleCardVisibility } from "@/lib/firestore/cards";
import { formatDisplayDate } from "@/lib/date";
import type { CardRow } from "@/lib/types";

export function CardDialog({
  card,
  canModify,
  showVisibilityControls,
  onClose,
}: {
  card: CardRow;
  canModify: boolean;
  showVisibilityControls: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return setFormError("카드 제목을 입력해주세요");
    const displayDate = String(formData.get("displayDate") ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(displayDate)) return setFormError("생성일을 확인해주세요");

    setFormError(null);
    startTransition(async () => {
      try {
        await updateCard(card.id, {
          title,
          description: String(formData.get("description") ?? "").trim(),
          displayDate,
        });
        onClose();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "저장에 실패했습니다");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteCard(card.id);
        onClose();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "삭제에 실패했습니다");
      }
    });
  }

  function handleVisibility(visibility: "public" | "private") {
    startTransition(async () => {
      try {
        await toggleCardVisibility(card.id, visibility);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "변경에 실패했습니다");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900"
      >
        {!canModify ? (
          <div>
            <h2 className="whitespace-pre-wrap text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {card.title}
            </h2>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{formatDisplayDate(card.displayDate)}</p>
            <hr className="mt-3 border-zinc-200 dark:border-zinc-700" />
            {card.description && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">
                {card.description}
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">제목</label>
                <textarea
                  name="title"
                  defaultValue={card.title}
                  required
                  rows={2}
                  className="w-full resize-none rounded-md border border-zinc-300 px-2 py-1.5 text-sm font-semibold outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">생성일</label>
                <input
                  type="date"
                  name="displayDate"
                  defaultValue={card.displayDate}
                  required
                  className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <hr className="border-zinc-200 dark:border-zinc-700" />

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">설명</label>
                <textarea
                  name="description"
                  defaultValue={card.description ?? ""}
                  rows={10}
                  placeholder="자세한 내용을 입력하세요 (선택)"
                  className="w-full resize-y rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {formError && <p className="text-xs text-red-600 dark:text-red-400">{formError}</p>}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                >
                  카드 삭제
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {isPending ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            </form>

            {showVisibilityControls && (
              <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <p className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">학생 공개 설정</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleVisibility("private")}
                    disabled={isPending}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                      card.visibility === "private"
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    비공개 (교사만)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVisibility("public")}
                    disabled={isPending}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                      card.visibility === "public"
                        ? "bg-emerald-600 text-white"
                        : "border border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    공개 (학생에게 보임)
                  </button>
                </div>
              </div>
            )}

            {actionError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{actionError}</p>}
          </>
        )}
      </div>
    </div>
  );
}
