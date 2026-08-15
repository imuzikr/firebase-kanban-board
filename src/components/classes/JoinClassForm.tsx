import { useRef, useState, useTransition } from "react";
import { joinClassByCode } from "@/lib/firestore/classes";
import { useAuth } from "@/lib/auth/AuthContext";

export function JoinClassForm() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const code = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    if (!code) return setError("가입 코드를 입력해주세요");

    setError(null);
    startTransition(async () => {
      try {
        await joinClassByCode(user.uid, code);
        formRef.current?.reset();
        // no manual refresh needed — the dashboard's onSnapshot listener
        // picks up the new classMembers doc in real time.
      } catch (err) {
        setError(err instanceof Error ? err.message : "참여에 실패했습니다");
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-start gap-2">
      <div className="flex-1">
        <input
          name="code"
          type="text"
          required
          maxLength={6}
          placeholder="가입 코드 6자리 입력 (예: AB12CD)"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm uppercase tracking-widest outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="shrink-0 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {isPending ? "참여 중..." : "학급 참여하기"}
      </button>
    </form>
  );
}
