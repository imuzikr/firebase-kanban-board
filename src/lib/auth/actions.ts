import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  deleteUser,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { Role } from "@/lib/types";

/** Must match firestore.rules' teacherEmail() (see .env.example) — this
 *  isn't the enforcement (the rule re-derives the same comparison against
 *  the caller's verified ID token email, which can't be forged), it just
 *  lets signup propose a role the rule will actually accept. */
function resolveRole(email: string): Role {
  const teacherEmail = import.meta.env.VITE_TEACHER_EMAIL?.toLowerCase().trim();
  return teacherEmail && email.toLowerCase().trim() === teacherEmail ? "teacher" : "student";
}

export async function signUp(displayName: string, email: string, password: string): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await setDoc(doc(db, "profiles", cred.user.uid), {
      displayName,
      role: resolveRole(email),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    // Auth account creation and the Firestore profile write aren't
    // transactional (no Admin SDK to wrap both in one server-side step) —
    // if the profile write is rejected (e.g. VITE_TEACHER_EMAIL and
    // firestore.rules' teacherEmail() are out of sync), delete the
    // just-created account rather than leaving an orphaned auth user with
    // no profile who could never usefully sign in or re-signup with the
    // same email.
    await deleteUser(cred.user).catch(() => {});
    throw err;
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
