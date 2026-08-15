// Firestore document shapes. See README.md's "데이터 구조" section for the
// full collection layout and the reasoning behind each design choice
// (deterministic IDs, denormalized fields, why there's no `boards`
// collection, etc.) — this file only has the TypeScript shapes.

export type Role = "teacher" | "student";
export type ListType = "teacher" | "student";
export type CardVisibility = "public" | "private";
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri";

/** One meeting slot — e.g. {weekdays: ["mon","wed"], period: 3} = "월,수 3교시".
 *  A class's `schedule` is a list of these, so different days can meet at
 *  different periods (월,수 3교시 AND 금 5교시 is two slots). */
export interface ScheduleSlot {
  weekdays: Weekday[];
  period: number;
}

/** profiles/{uid}. No `email` field — Firebase Auth already has it, and
 *  nothing in the UI displays another user's email (a student's list
 *  title already carries their display name at creation time). */
export interface Profile {
  id: string;
  displayName: string;
  role: Role;
  createdAt: string;
}

/** classes/{classId}. No `boards` collection — a class:board was always
 *  1:1, which only mattered for Postgres foreign keys; lists/cards
 *  reference classId directly instead. */
export interface ClassRow {
  id: string;
  name: string;
  teacherId: string;
  joinCode: string;
  /** Empty for classes with no schedule set yet. */
  schedule: ScheduleSlot[];
  /** Drag-reorder position on the teacher's dashboard. */
  position: number;
  createdAt: string;
}

/** joinCodes/{code} — the code itself is the document ID, so looking a
 *  code up is a single getDoc(), not a query, and collisions are caught
 *  by the write itself (see lib/firestore/classes.ts). */
export interface JoinCodeRow {
  classId: string;
}

/** classMembers/{classId}_{studentId} — deterministic ID stands in for
 *  Postgres's unique(class_id, student_id) + "insert, ignore if exists". */
export interface ClassMemberRow {
  classId: string;
  studentId: string;
  joinedAt: string;
}

/** lists/{listId}. A list belongs to exactly one person — the teacher
 *  (announcements) or one student (their personal activity log). `title`
 *  for a student's list is their display name, copied in at creation
 *  time so rendering it never needs a second read of `profiles`. */
export interface ListRow {
  id: string;
  classId: string;
  listType: ListType;
  ownerId: string;
  title: string;
  position: number;
  createdAt: string;
}

export interface CardRow {
  id: string;
  listId: string;
  /** Denormalized (same reason Supabase's version kept board_id on
   *  cards) — cheap security-rule reads and list-scoped queries. */
  classId: string;
  title: string;
  description: string | null;
  position: number;
  visibility: CardVisibility;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** User-facing "생성일" (date only, no time), editable after creation.
   *  Plain "YYYY-MM-DD" string, not a Firestore Timestamp — avoids a
   *  timezone off-by-one this project already hit once when this was a
   *  Postgres `date` column and got parsed through `Date`. */
  displayDate: string;
}
