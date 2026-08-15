import { collection, doc, deleteDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { nextPosition } from "./helpers";
import type { CardVisibility, ListType } from "@/lib/types";

/** `listType` must be passed by the caller (from the list the card is
 *  being added to) so a card on anything but the teacher's list is always
 *  forced to visibility='public' — the public/private distinction only
 *  means something there, a student's own list is already fully private
 *  to owner+teacher regardless. Mirrors the Firestore create rule, which
 *  enforces the same thing server-side. */
export async function createCard(params: {
  listId: string;
  classId: string;
  listType: ListType;
  createdBy: string;
  title: string;
  description: string;
  visibility: CardVisibility;
}): Promise<void> {
  const position = await nextPosition("cards", "listId", params.listId);
  const cardId = doc(collection(db, "cards")).id;
  const now = new Date().toISOString();
  await setDoc(doc(db, "cards", cardId), {
    listId: params.listId,
    classId: params.classId,
    title: params.title,
    description: params.description || null,
    position,
    visibility: params.listType === "teacher" ? params.visibility : "public",
    createdBy: params.createdBy,
    createdAt: now,
    updatedAt: now,
    displayDate: now.slice(0, 10),
  });
}

export async function updateCard(
  cardId: string,
  fields: { title: string; description: string; displayDate: string },
): Promise<void> {
  await updateDoc(doc(db, "cards", cardId), {
    title: fields.title,
    description: fields.description || null,
    displayDate: fields.displayDate,
    updatedAt: new Date().toISOString(),
  });
}

/** Teacher-only per the Firestore rule — kept as its own call (separate
 *  rule path from updateCard) so a content edit can never piggyback a
 *  visibility change. */
export async function toggleCardVisibility(cardId: string, visibility: CardVisibility): Promise<void> {
  await updateDoc(doc(db, "cards", cardId), { visibility });
}

export async function moveCard(cardId: string, position: number): Promise<void> {
  await updateDoc(doc(db, "cards", cardId), { position, updatedAt: new Date().toISOString() });
}

export async function deleteCard(cardId: string): Promise<void> {
  await deleteDoc(doc(db, "cards", cardId));
}
