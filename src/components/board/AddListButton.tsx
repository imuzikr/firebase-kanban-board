import { useRef, useState, useTransition } from "react";
import { createList } from "@/lib/firestore/lists";

/** No onCreated callback needed (unlike the Supabase/Next.js version this
 *  was ported from) — the board's lists come from a live onSnapshot
 *  listener, which picks up the new list as soon as it's written. */
export function AddListButton({ classId, teacherId }: { classId: string; teacherId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = String(new FormData(e.currentTarget).get("title") ?? "").trim();
    if (!title) return setError("리스트 이름을 입력해주세요");

    setError(null);
    startTransition(async () => {
      try {
        await createList(classId, teacherId, title);
        formRef.current?.reset();
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "리스트 생성에 실패했습니다");
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-fit w-64 shrink-0 rounded-lg border border-dashed border-zinc-300 px-3 py-2.5 text-left text-sm text-zinc-500 hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        + 리스트 추가
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="w-64 shrink-0 rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <input
        name="title"
        autoFocus
        required
        placeholder="리스트 이름"
        className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isPending ? "추가 중..." : "추가"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
        >
          취소
        </button>
      </div>
    </form>
  );
}
