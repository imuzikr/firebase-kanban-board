import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthContext";
import { useBoardData } from "@/lib/firestore/useBoardData";
import { JoinCodeBadge } from "@/components/classes/JoinCodeBadge";
import { ClassSettings } from "@/components/classes/ClassSettings";
import { Board } from "@/components/board/Board";
import type { ClassRow } from "@/lib/types";

export function ClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const { profile } = useAuth();
  const [classRow, setClassRow] = useState<ClassRow | null | undefined>(undefined);

  useEffect(() => {
    if (!classId) return;
    setClassRow(undefined);
    return onSnapshot(doc(db, "classes", classId), (snap) => {
      setClassRow(snap.exists() ? ({ id: snap.id, ...snap.data() } as ClassRow) : null);
    });
  }, [classId]);

  const { lists, cards, loading: boardLoading } = useBoardData(classId ?? "", profile);

  if (!classId) return null;
  if (classRow === undefined) {
    return <p className="text-sm text-zinc-400 dark:text-zinc-500">불러오는 중...</p>;
  }
  if (classRow === null) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">존재하지 않는 학급입니다.</p>;
  }

  const isTeacher = profile?.role === "teacher";

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <Link
          to="/dashboard"
          className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← 대시보드로
        </Link>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{classRow.name}</h1>
        {isTeacher && (
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            가입 코드 <JoinCodeBadge code={classRow.joinCode} />
          </div>
        )}
        {isTeacher && <ClassSettings classRow={classRow} />}
      </div>

      {boardLoading || !profile ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">불러오는 중...</p>
      ) : (
        <Board
          classId={classId}
          teacherId={classRow.teacherId}
          viewerId={profile.id}
          viewerIsTeacher={isTeacher}
          lists={lists}
          cards={cards}
        />
      )}
    </div>
  );
}
