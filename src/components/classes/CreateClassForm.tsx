import { useRef, useState, useTransition } from "react";
import { z } from "zod";
import { createClass } from "@/lib/firestore/classes";
import { useAuth } from "@/lib/auth/AuthContext";
import { SchedulePicker } from "./SchedulePicker";

const nameSchema = z
  .string()
  .trim()
  .min(1, "학급 이름을 입력해주세요")
  .max(50, "학급 이름은 50자 이내로 입력해주세요");

const scheduleSchema = z
  .array(
    z.object({
      weekdays: z.array(z.enum(["mon", "tue", "wed", "thu", "fri"])).min(1),
      period: z.number().int().min(1).max(7),
    }),
  )
  .min(1, "요일·교시를 하나 이상 선택해주세요");

export function CreateClassForm() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // Bumped on success/reopen to remount SchedulePicker — it owns its own
  // slot state, so a plain form.reset() wouldn't clear the selected pills.
  const [resetKey, setResetKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  function openModal() {
    setError(null);
    setOpen(true);
  }
  function closeModal() {
    setOpen(false);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);

    const nameResult = nameSchema.safeParse(formData.get("name"));
    if (!nameResult.success) return setError(nameResult.error.issues[0]?.message ?? "입력값을 확인해주세요");

    let scheduleJson: unknown;
    try {
      scheduleJson = JSON.parse(String(formData.get("schedule") ?? "[]"));
    } catch {
      return setError("일정 형식이 올바르지 않습니다");
    }
    const scheduleResult = scheduleSchema.safeParse(scheduleJson);
    if (!scheduleResult.success) return setError(scheduleResult.error.issues[0]?.message ?? "일정을 확인해주세요");

    setError(null);
    startTransition(async () => {
      try {
        await createClass(user.uid, nameResult.data, scheduleResult.data);
        formRef.current?.reset();
        setResetKey((k) => k + 1);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "학급 생성에 실패했습니다");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        + 새 학급 만들기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900"
          >
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">새 학급 만들기</h2>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  학급 이름
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="예: 1학년 3반"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <SchedulePicker key={resetKey} />

              {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {isPending ? "생성 중..." : "만들기"}
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
