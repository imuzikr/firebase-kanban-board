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

/** A class board's lists + cards, role-aware. A student never gets broad
 *  query access to another student's list or private teacher-list cards
 *  (see firestore.rules) — Firestore can only allow a `list` query if it
 *  can prove every possible matching document passes the rule from the
 *  query's own filters alone, which means a student has to run several
 *  narrow queries instead of one broad one:
 *   - lists: one query for every teacher-type list in the class, one for
 *     just their own list (`ownerId==uid` is fixed by the filter).
 *   - cards: one query per teacher list for its public-only cards (fans
 *     out — there can be more than one teacher list), one for every card
 *     on their own list.
 *  A teacher's queries stay a single broad one each, since `classId` is
 *  the only filter that condition needs. */
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
      const q = query(collection(db, "lists"), where("classId", "==", classId), orderBy("position"));
      return onSnapshot(q, (snap) => {
        setLists(snap.docs.map(toList));
        setListsLoading(false);
      });
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
