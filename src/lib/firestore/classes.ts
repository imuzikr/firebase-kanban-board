import {
  collection,
  doc,
  runTransaction,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { nextPosition, deleteDocsInBatches } from "./helpers";
import type { ScheduleSlot } from "@/lib/types";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no O/0, I/1 (avoid confusion)

function randomJoinCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

class JoinCodeCollisionError extends Error {}

/** Creates the class doc, reserves its join code (joinCodes/{code} — the
 *  code itself is the doc id, so a collision surfaces as a rejected
 *  `create` inside the same transaction), and seeds the teacher's
 *  "공지사항" list, all atomically. Astronomically unlikely to collide
 *  (6 chars from a 32-char alphabet), but retried a few times with a
 *  fresh code rather than assumed impossible. */
export async function createClass(teacherId: string, name: string, schedule: ScheduleSlot[]): Promise<string> {
  const position = await nextPosition("classes", "teacherId", teacherId);

  for (let attempt = 0; attempt < 5; attempt++) {
    const classId = doc(collection(db, "classes")).id;
    const code = randomJoinCode();

    try {
      await runTransaction(db, async (tx) => {
        const joinCodeRef = doc(db, "joinCodes", code);
        const existing = await tx.get(joinCodeRef);
        if (existing.exists()) throw new JoinCodeCollisionError();

        const now = new Date().toISOString();
        tx.set(doc(db, "classes", classId), {
          name,
          teacherId,
          joinCode: code,
          schedule,
          position,
          createdAt: now,
        });
        tx.set(joinCodeRef, { classId });
        tx.set(doc(db, "lists", `teacher_seed_${classId}`), {
          classId,
          listType: "teacher",
          ownerId: teacherId,
          title: "공지사항",
          position: 1000,
          createdAt: now,
        });
      });
      return classId;
    } catch (err) {
      if (err instanceof JoinCodeCollisionError && attempt < 4) continue;
      throw err;
    }
  }
  throw new Error("가입 코드를 생성하지 못했습니다. 다시 시도해주세요.");
}

export async function updateClass(classId: string, name: string, schedule: ScheduleSlot[]): Promise<void> {
  await updateDoc(doc(db, "classes", classId), { name, schedule });
}

export async function reorderClass(classId: string, position: number): Promise<void> {
  await updateDoc(doc(db, "classes", classId), { position });
}

/** Cascades: every list on this class's board, every card on those
 *  lists, every student's membership row, and the class's joinCode
 *  reservation all go with it — Firestore has no ON DELETE CASCADE, so
 *  these are collected and batch-deleted before the class doc itself.
 *  Order matters: cards before their lists, lists before the class doc,
 *  so each delete's security rule (which looks up the parent doc) still
 *  sees it as it existed before this batch — see firestore.rules. */
export async function deleteClass(classId: string, joinCode: string): Promise<void> {
  const [listsSnap, cardsSnap, membersSnap] = await Promise.all([
    getDocs(query(collection(db, "lists"), where("classId", "==", classId))),
    getDocs(query(collection(db, "cards"), where("classId", "==", classId))),
    getDocs(query(collection(db, "classMembers"), where("classId", "==", classId))),
  ]);

  await deleteDocsInBatches([
    ...cardsSnap.docs.map((d) => ({ collectionName: "cards", id: d.id })),
    ...listsSnap.docs.map((d) => ({ collectionName: "lists", id: d.id })),
    ...membersSnap.docs.map((d) => ({ collectionName: "classMembers", id: d.id })),
    { collectionName: "joinCodes", id: joinCode },
    { collectionName: "classes", id: classId },
  ]);
}

/** Looks a code up via joinCodes/{code} (a single get, never a query — a
 *  student never gets list/query access to enumerate codes), then joins
 *  the class and seeds the student's own list, atomically. Idempotent:
 *  rejoining an already-joined class is a no-op success, not an error
 *  (mirrors the original `on conflict do nothing` join RPC). */
export async function joinClassByCode(studentId: string, rawCode: string): Promise<string> {
  const code = rawCode.trim().toUpperCase();
  const joinCodeSnap = await getDoc(doc(db, "joinCodes", code));
  if (!joinCodeSnap.exists()) throw new Error("유효하지 않은 가입 코드입니다");
  const classId = (joinCodeSnap.data() as { classId: string }).classId;

  const memberId = `${classId}_${studentId}`;
  const memberRef = doc(db, "classMembers", memberId);
  const alreadyMember = await getDoc(memberRef);
  if (alreadyMember.exists()) return classId;

  const listId = `student_${classId}_${studentId}`;
  const listRef = doc(db, "lists", listId);
  const existingList = await getDoc(listRef);
  if (existingList.exists()) {
    // membership doc missing but the list already exists (shouldn't
    // normally happen) — still just (re)write membership, don't touch
    // the list's title/position again.
    await runTransaction(db, async (tx) => {
      tx.set(memberRef, { classId, studentId, joinedAt: new Date().toISOString() });
    });
    return classId;
  }

  const profileSnap = await getDoc(doc(db, "profiles", studentId));
  const displayName = (profileSnap.data() as { displayName?: string } | undefined)?.displayName ?? "학생";
  const position = await nextPosition("lists", "classId", classId);

  await runTransaction(db, async (tx) => {
    const now = new Date().toISOString();
    tx.set(memberRef, { classId, studentId, joinedAt: now });
    tx.set(listRef, {
      classId,
      listType: "student",
      ownerId: studentId,
      title: displayName,
      position,
      createdAt: now,
    });
  });

  return classId;
}
