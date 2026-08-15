import { useEffect, useMemo, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CardRow, ListRow, Profile } from "@/lib/types";

function toList(d: { id: string; data: () => unknown }): ListRow {
  return { id: d.id, ...(d.data() as object) } as ListRow;
}
function toCard(d: { id: string; data: () => unknown }): CardRow {
  return { id: d.id, ...(d.data() as object) } as CardRow;
}

/** A class board's lists + cards, role-aware. Firestore can only allow a
 *  `list` query if it can prove every possible matching document passes
 *  the rule from the query's own filters alone — so narrow queries are
 *  required wherever a rule branches on a field the query doesn't fix:
 *   - lists: `isTeacherOfClass()`/`isClassMember()` are nested inside a
 *     `listType == '...' && (...)` AND on every branch of the rule, so
 *     BOTH roles must split by listType (teacher: one query per listType,
 *     no ownerId filter needed since it wants every list; student: same
 *     split, plus `ownerId==uid` on the student-type query).
 *   - cards: `isTeacherOfClass(card.classId)` is a standalone top-level OR
 *     branch, provable from `classId` alone, so the teacher's query stays
 *     a single broad one; a student still needs several narrow queries
 *     (one per teacher list for its public-only cards, one for their own
 *     list's cards) since their branches depend on `list.listType`. */
export function useBoardData(
  classId: string,
  profile: Profile | null,
): { lists: ListRow[]; cards: CardRow[]; loading: boolean } {
  const [lists, setLists] = useState<ListRow[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    setListsLoading(true);

    if (profile.role === "teacher") {
      // Can't use a single `where('classId','==',classId)` query here —
      // see firestore.rules' `lists` comment: isTeacherOfClass() is nested
      // inside a `listType == '...' && (...)` AND on every branch, so
      // Firestore can't prove the rule without listType being part of the
      // query itself. Split the same way the student branch below does,
      // just without an ownerId filter on the student-lists query (the
      // teacher needs every student's list, not just one).
      let teacherTypeLists: ListRow[] = [];
      let studentTypeLists: ListRow[] = [];
      let gotTeacherType = false;
      let gotStudentType = false;
      const publishTeacherView = () => {
        if (!gotTeacherType || !gotStudentType) return;
        setLists([...teacherTypeLists, ...studentTypeLists].sort((a, b) => a.position - b.position));
        setListsLoading(false);
      };

      const teacherTypeQ = query(
        collection(db, "lists"),
        where("classId", "==", classId),
        where("listType", "==", "teacher"),
      );
      const studentTypeQ = query(
        collection(db, "lists"),
        where("classId", "==", classId),
        where("listType", "==", "student"),
      );
      const unsubTeacherType = onSnapshot(teacherTypeQ, (snap) => {
        teacherTypeLists = snap.docs.map(toList);
        gotTeacherType = true;
        publishTeacherView();
      });
      const unsubStudentType = onSnapshot(studentTypeQ, (snap) => {
        studentTypeLists = snap.docs.map(toList);
        gotStudentType = true;
        publishTeacherView();
      });
      return () => {
        unsubTeacherType();
        unsubStudentType();
      };
    }

    let teacherLists: ListRow[] = [];
    let ownLists: ListRow[] = [];
    let gotTeacher = false;
    let gotOwn = false;
    const publish = () => {
      if (!gotTeacher || !gotOwn) return;
      setLists([...teacherLists, ...ownLists].sort((a, b) => a.position - b.position));
      setListsLoading(false);
    };

    const teacherQ = query(
      collection(db, "lists"),
      where("classId", "==", classId),
      where("listType", "==", "teacher"),
    );
    const ownQ = query(
      collection(db, "lists"),
      where("classId", "==", classId),
      where("listType", "==", "student"),
      where("ownerId", "==", profile.id),
    );
    const unsub1 = onSnapshot(teacherQ, (snap) => {
      teacherLists = snap.docs.map(toList);
      gotTeacher = true;
      publish();
    });
    const unsub2 = onSnapshot(ownQ, (snap) => {
      ownLists = snap.docs.map(toList);
      gotOwn = true;
      publish();
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [classId, profile]);

  // Stable keys so the cards effect only re-subscribes when the actual
  // set of relevant list ids changes, not on every lists snapshot tick
  // (e.g. a position-only update).
  const teacherListIdsKey = useMemo(
    () =>
      lists
        .filter((l) => l.listType === "teacher")
        .map((l) => l.id)
        .sort()
        .join(","),
    [lists],
  );
  const ownListId = useMemo(
    () => lists.find((l) => l.listType === "student" && l.ownerId === profile?.id)?.id,
    [lists, profile],
  );

  useEffect(() => {
    if (!profile || listsLoading) return;
    setCardsLoading(true);

    if (profile.role === "teacher") {
      const q = query(collection(db, "cards"), where("classId", "==", classId), orderBy("position"));
      return onSnapshot(q, (snap) => {
        setCards(snap.docs.map(toCard));
        setCardsLoading(false);
      });
    }

    const teacherListIds = teacherListIdsKey ? teacherListIdsKey.split(",") : [];
    const perList = new Map<string, CardRow[]>();
    const publish = () => {
      setCards([...perList.values()].flat().sort((a, b) => a.position - b.position));
      setCardsLoading(false);
    };

    const unsubs: (() => void)[] = [];
    for (const listId of teacherListIds) {
      const q = query(collection(db, "cards"), where("listId", "==", listId), where("visibility", "==", "public"));
      unsubs.push(
        onSnapshot(q, (snap) => {
          perList.set(listId, snap.docs.map(toCard));
          publish();
        }),
      );
    }
    if (ownListId) {
      const q = query(collection(db, "cards"), where("listId", "==", ownListId));
      unsubs.push(
        onSnapshot(q, (snap) => {
          perList.set(ownListId, snap.docs.map(toCard));
          publish();
        }),
      );
    }
    if (unsubs.length === 0) {
      setCards([]);
      setCardsLoading(false);
    }

    return () => unsubs.forEach((u) => u());
  }, [classId, profile, listsLoading, teacherListIdsKey, ownListId]);

  return { lists, cards, loading: listsLoading || cardsLoading };
}
