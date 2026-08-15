import { useAuth } from "@/lib/auth/AuthContext";
import { useMyClasses } from "@/lib/firestore/useMyClasses";
import { CreateClassForm } from "@/components/classes/CreateClassForm";
import { JoinClassForm } from "@/components/classes/JoinClassForm";
import { ClassGrid } from "@/components/classes/ClassGrid";

export function DashboardPage() {
  const { profile } = useAuth();
  const { classes, loading } = useMyClasses(profile);
  const isTeacher = profile?.role === "teacher";

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {isTeacher ? "학급 관리" : "내 학급"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {isTeacher
              ? "학급을 만들면 공지 보드가 자동으로 생성됩니다. 가입 코드를 학생에게 공유하세요."
              : "가입 코드를 입력해 학급에 참여하세요."}
          </p>
        </div>
        {isTeacher && <CreateClassForm />}
      </div>

      {!isTeacher && (
        <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <JoinClassForm />
        </section>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">불러오는 중...</p>
      ) : classes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {isTeacher ? "아직 만든 학급이 없습니다." : "아직 참여한 학급이 없습니다."}
        </p>
      ) : (
        <ClassGrid classes={classes} isTeacher={!!isTeacher} />
      )}
    </div>
  );
}
