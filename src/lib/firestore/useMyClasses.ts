import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ClassRow, Profile } from "@/lib/types";

/** Teacher: a single `where('teacherId','==',uid)` query works — that
 *  condition doesn't depend on any other class's data.
 *
 *  Student: there's no single query for "every class I've joined" (a
 *  student never gets broad read access to the `classes` collection).
 *  Subscribe to `classMembers` filtered to this student instead, then
 *  fan out to an individual `onSnapshot` per classId found there,
 *  tearing down listeners for classes no longer in that set. */
export function useMyClasses(profile: Profile | null): { classes: ClassRow[]; loading: boolean } {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setClasses([]);
      setLoading(true);
      return;
    }
    setLoading(true);

    if (profile.role === "teacher") {
      const q = query(collection(db, "classes"), where("teacherId", "==", profile.id), orderBy("position"));
      return onSnapshot(q, (snap) => {
        setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ClassRow));
        setLoading(false);
      });
    }

    const memberQ = query(collection(db, "classMembers"), where("studentId", "==", profile.id));
    const classUnsubs = new Map<string, () => void>();
    const classDocs = new Map<string, ClassRow>();

    const publish = () => {
      setClasses([...classDocs.values()].sort((a, b) => a.position - b.position));
      setLoading(false);
    };

    const unsubMembers = onSnapshot(memberQ, (memberSnap) => {
      const classIds = new Set(memberSnap.docs.map((d) => (d.data() as { classId: string }).classId));

      for (const [id, unsub] of classUnsubs) {
        if (!classIds.has(id)) {
          unsub();
          classUnsubs.delete(id);
          classDocs.delete(id);
        }
      }

      for (const id of classIds) {
        if (classUnsubs.has(id)) continue;
        classUnsubs.set(
          id,
          onSnapshot(doc(db, "classes", id), (classSnap) => {
            if (classSnap.exists()) classDocs.set(id, { id: classSnap.id, ...classSnap.data() } as ClassRow);
            else classDocs.delete(id);
            publish();
          }),
        );
      }

      if (classIds.size === 0) publish();
    });

    return () => {
      unsubMembers();
      for (const unsub of classUnsubs.values()) unsub();
    };
  }, [profile]);

  return { classes, loading };
}
