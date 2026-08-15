import { collection, query, where, orderBy, limit, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { midPosition } from "@/lib/position";

/** Position for a new doc appended at the end of an existing `where(field,
 *  '==', value)` group (optionally narrowed further by `extra`), ordered
 *  by `position`. A plain (non-transactional) query — Firestore
 *  transactions can only read single documents by ID, not run queries, so
 *  this happens just before the transaction that actually creates the
 *  doc. Two creations landing at the exact same instant could in theory
 *  compute the same position; the cost is purely cosmetic (ambiguous
 *  ordering until the next drag), never a correctness or security issue,
 *  so it isn't worth transactional protection.
 *
 *  `extra` exists because `lists` reads need it: firestore.rules nests
 *  isTeacherOfClass()/isClassMember() inside a `listType == '...' &&
 *  (...)` AND on every branch of that collection's read rule, so a query
 *  scoped only by `classId` can't be proven safe even for the class's own
 *  teacher — `listType` has to be part of the query itself. See
 *  createList() in lib/firestore/lists.ts. */
export async function nextPosition(
  collectionName: string,
  field: string,
  value: string,
  extra?: { field: string; value: string },
): Promise<number> {
  const constraints = [where(field, "==", value)];
  if (extra) constraints.push(where(extra.field, "==", extra.value));
  const q = query(collection(db, collectionName), ...constraints, orderBy("position", "desc"), limit(1));
  const snap = await getDocs(q);
  const last = snap.docs[0]?.data().position as number | undefined;
  return midPosition(last, undefined);
}

/** Firestore has no ON DELETE CASCADE — deleting a class/list's children
 *  (lists→cards, or a single list's cards) means collecting every id up
 *  front and batch-deleting them ourselves. Chunked to stay comfortably
 *  under the 500-operation batch limit; irrelevant at this app's real
 *  scale but a one-line guard against a toy edge case. */
export async function deleteDocsInBatches(refs: { collectionName: string; id: string }[]): Promise<void> {
  const CHUNK = 450;
  for (let i = 0; i < refs.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const r of refs.slice(i, i + CHUNK)) {
      batch.delete(doc(db, r.collectionName, r.id));
    }
    await batch.commit();
  }
}
