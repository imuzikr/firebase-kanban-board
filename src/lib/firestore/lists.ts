import { collection, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { nextPosition, deleteDocsInBatches } from "./helpers";

/** Teacher-only (Firestore rule: listType must be 'teacher', ownerId must
 *  be the caller, caller must be the class's teacher) — used for extra
 *  board-wide lists beyond the auto-seeded "공지사항" one; per-student
 *  lists are still fully automatic, created only by joinClassByCode. */
export async function createList(classId: string, teacherId: string, title: string): Promise<void> {
  const position = await nextPosition("lists", "classId", classId, { field: "listType", value: "teacher" });
  const listId = doc(collection(db, "lists")).id;
  await setDoc(doc(db, "lists", listId), {
    classId,
    listType: "teacher",
    ownerId: teacherId,
    title,
    position,
    createdAt: new Date().toISOString(),
  });
}

/** Teacher-only per the Firestore rule — lets a teacher fix a typo in any
 *  list's title on their own class's board, including a student's own
 *  list (e.g. a display-name typo the student can't fix themselves,
 *  since students never get list-update rights at all). Only `title` is
 *  writable; listType/ownerId/classId/position stay immutable. */
export async function updateListTitle(listId: string, title: string): Promise<void> {
  await updateDoc(doc(db, "lists", listId), { title });
}

/** Teacher-only. Cascades: every card on the list goes with it —
 *  Firestore has no ON DELETE CASCADE, so cards are deleted first. */
export async function deleteList(listId: string, classId: string): Promise<void> {
  // Scope the query by classId so the rules can prove teacher access.
  const cardsSnap = await getDocs(query(
    collection(db, "cards"),
    where("classId", "==", classId),
    where("listId", "==", listId),
  ));
  await deleteDocsInBatches([
    ...cardsSnap.docs.map((d) => ({ collectionName: "cards", id: d.id })),
    { collectionName: "lists", id: listId },
  ]);
}
