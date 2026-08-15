import { useRef, useState, useTransition } from "react";
import { createCard } from "@/lib/firestore/cards";
import { useAuth } from "@/lib/auth/AuthContext";
import type { ListType } from "@/lib/types";

export function AddCardForm({
  listId,
  classId,
  listType,
  showVisibilityControls,
}: {
  listId: string;
  classId: string;
  listType: ListType;
  showVisibilityControls: boolean;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function closeModal() {
    setOpen(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return setError("카드 제목을 입력해주세요");

    setError(null);
    startTransition(async () => {
      try {
        await createCard({
          listId,
          classId,
          listType,
          createdBy: user.uid,
          title,
          description: String(formData.get("description") ?? "").trim(),
          visibility: formData.get("visibility") === "public" ? "public" : "private",
        });
        formRef.current?.reset();
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "카드 추가에 실패했습니다");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md px-2 py-1.5 text-left text-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        + 카드 추가
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900"
          >
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">카드 추가</h2>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">제목</label>
                <textarea
                  name="title"
                  autoFocus
                  required
                  rows={2}
                  placeholder="카드 제목"
                  className="w-full resize-none rounded-md border border-zinc-300 px-2 py-1.5 text-sm font-semibold outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <hr className="border-zinc-200 dark:border-zinc-700" />

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">설명</label>
                <textarea
                  name="description"
                  rows={10}
                  placeholder="자세한 내용을 입력하세요 (선택)"
                  className="w-full resize-y rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {showVisibilityControls && (
                <fieldset className="flex gap-3 text-xs text-zinc-600 dark:text-zinc-300">
                  <label className="flex items-center gap-1">
                    <input type="radio" name="visibility" value="private" defaultChecked /> 비공개
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="visibility" value="public" /> 공개
                  </label>
                </fieldset>
              )}

              {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {isPending ? "추가 중..." : "추가"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
