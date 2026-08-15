import { useNavigate } from "react-router-dom";
import { useState, useTransition } from "react";
import { z } from "zod";
import { updateClass, deleteClass } from "@/lib/firestore/classes";
import { SchedulePicker } from "./SchedulePicker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ClassRow } from "@/lib/types";

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

/** Teacher-only edit/delete controls for a class (= its board, 1:1). Used
 *  both on the class/board page and on its dashboard card — Firestore
 *  Security Rules are the real gate either way, this just keeps the
 *  controls out of a student's way. */
export function ClassSettings({
  classRow,
}: {
  classRow: Pick<ClassRow, "id" | "name" | "schedule" | "joinCode">;
}) {
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();
  const navigate = useNavigate();

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const nameResult = nameSchema.safeParse(formData.get("name"));
    if (!nameResult.success) return setEditError(nameResult.error.issues[0]?.message ?? "입력값을 확인해주세요");

    let scheduleJson: unknown;
    try {
      scheduleJson = JSON.parse(String(formData.get("schedule") ?? "[]"));
    } catch {
      return setEditError("일정 형식이 올바르지 않습니다");
    }
    const scheduleResult = scheduleSchema.safeParse(scheduleJson);
    if (!scheduleResult.success) return setEditError(scheduleResult.error.issues[0]?.message ?? "일정을 확인해주세요");

    setEditError(null);
    startSave(async () => {
      try {
        await updateClass(classRow.id, nameResult.data, scheduleResult.data);
        setEditing(false);
      } catch (err) {
        setEditError(err instanceof Error ? err.message : "저장에 실패했습니다");
      }
    });
  }

  function confirmDelete() {
    setDeleteError(null);
    startDelete(async () => {
      try {
        await deleteClass(classRow.id, classRow.joinCode);
        navigate("/dashboard");
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "삭제에 실패했습니다");
        setConfirmingDelete(false);
      }
    });
  }

  return (
    <>
      <div className="mt-2 flex items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          학급 정보 수정
        </button>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="text-red-600 underline hover:text-red-700 dark:text-red-400"
        >
          학급 삭제
        </button>
        {deleteError && <span className="text-red-600 dark:text-red-400">{deleteError}</span>}
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setEditing(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900"
          >
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">학급 정보 수정</h2>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  학급 이름
                </label>
                <input
                  name="name"
                  defaultValue={classRow.name}
                  required
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <SchedulePicker defaultSchedule={classRow.schedule} />

              {editError && <p className="text-xs text-red-600 dark:text-red-400">{editError}</p>}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {isSaving ? "저장 중..." : "저장"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="학급을 삭제할까요?"
          message={`"${classRow.name}" 학급을 삭제하면 공지 보드와 모든 학생 보드, 카드가 함께 삭제되며 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          danger
          pending={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
