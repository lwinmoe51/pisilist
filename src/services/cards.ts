import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
  serverTimestamp,
  increment,
  writeBatch,
  query,
  orderBy,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Card, Task, Reminder } from '../types';

// ── Helpers ────────────────────────────────────────────────────────

function cardCollection() {
  return collection(db, 'cards');
}

function cardDoc(cardId: string) {
  return doc(db, 'cards', cardId);
}

function tasksCollection(cardId: string) {
  return collection(db, 'cards', cardId, 'tasks');
}

function taskDoc(cardId: string, taskId: string) {
  return doc(db, 'cards', cardId, 'tasks', taskId);
}

/** Timestamp → Date, safely handles Firestore Timestamp or plain Date. */
function toDate(ts: Timestamp | Date | null | undefined): Date {
  if (!ts) return new Date();
  if (ts instanceof Timestamp) return ts.toDate();
  return ts;
}

// ── Card CRUD ──────────────────────────────────────────────────────

/** Create a new card owned by the given uid. Returns the new card's id. */
export async function createCard(
  uid: string,
  title: string,
): Promise<string> {
  const docRef = await addDoc(cardCollection(), {
    title: title.trim() || 'Untitled',
    ownerId: uid,
    collaborators: [] as string[],
    pinned: false,
    taskCount: 0,
    completedCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/** Update a card's top-level fields (title, pinned). */
export async function updateCard(
  cardId: string,
  data: Partial<Pick<Card, 'title' | 'pinned'>>,
): Promise<void> {
  await updateDoc(cardDoc(cardId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** Delete a card and all its tasks in a single batch. */
export async function deleteCard(cardId: string): Promise<void> {
  const tasksSnap = await getDocs(tasksCollection(cardId));
  const batch = writeBatch(db);

  for (const taskDocSnap of tasksSnap.docs) {
    batch.delete(taskDocSnap.ref);
  }
  batch.delete(cardDoc(cardId));

  await batch.commit();
}

// ── Task CRUD (subcollection under card) ───────────────────────────

/** Add a new task to a card. Updates card's taskCount. */
export async function createTask(
  cardId: string,
  text: string,
): Promise<string> {
  // Get current max order
  const q = query(tasksCollection(cardId), orderBy('order', 'desc'));
  const snapshot = await getDocs(q);
  const maxOrder =
    snapshot.empty ? -1 : snapshot.docs[0].data().order ?? 0;

  const docRef = await addDoc(tasksCollection(cardId), {
    text: text.trim(),
    completed: false,
    assignee: null,
    reminders: [] as Reminder[],
    order: maxOrder + 1,
    createdAt: serverTimestamp(),
  });

  // Bump taskCount on the card
  await updateDoc(cardDoc(cardId), {
    taskCount: increment(1),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

/** Update a task's text or assignee. */
export async function updateTask(
  cardId: string,
  taskId: string,
  data: Partial<Pick<Task, 'text' | 'assignee'>>,
): Promise<void> {
  await updateDoc(taskDoc(cardId, taskId), data);
}

/** Toggle a task's completed status. Updates card's completedCount. */
export async function toggleTask(
  cardId: string,
  taskId: string,
  completed: boolean,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(taskDoc(cardId, taskId), { completed });
  batch.update(cardDoc(cardId), {
    completedCount: increment(completed ? 1 : -1),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

/** Delete a single task. Updates card's taskCount and optionally completedCount. */
export async function deleteTask(
  cardId: string,
  taskId: string,
  wasCompleted: boolean,
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(taskDoc(cardId, taskId));
  const cardUpdate: Record<string, any> = {
    taskCount: increment(-1),
    updatedAt: serverTimestamp(),
  };
  if (wasCompleted) {
    cardUpdate.completedCount = increment(-1);
  }
  batch.update(cardDoc(cardId), cardUpdate);
  await batch.commit();
}

/** Add a collaborator to a card's collaborators array (server-side). */
export async function addCollaborator(
  cardId: string,
  userId: string,
): Promise<void> {
  await updateDoc(cardDoc(cardId), {
    collaborators: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });
}

/** Update reminders on a task document. */
export async function updateTaskReminders(
  cardId: string,
  taskId: string,
  reminders: Reminder[],
): Promise<void> {
  await updateDoc(taskDoc(cardId, taskId), { reminders });
}

// ── Query helpers ──────────────────────────────────────────────────

/** Return a query for cards visible to the current user. */
export function cardsQuery(uid: string) {
  // Returns all cards ordered by updatedAt. Client-side filtering
  // keeps this simple without requiring composite indexes.
  // future: array-contains query for collaborators
  return query(
    cardCollection(),
    orderBy('updatedAt', 'desc'),
  );
}

/** Return a query for tasks of a single card, ordered by their order field. */
export function tasksQuery(cardId: string) {
  return query(tasksCollection(cardId), orderBy('order', 'asc'));
}

// ── Firestore doc → typed model ────────────────────────────────────

export function docToCard(id: string, data: Record<string, any>): Card {
  return {
    id,
    title: data.title ?? '',
    ownerId: data.ownerId ?? '',
    collaborators: data.collaborators ?? [],
    pinned: data.pinned ?? false,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function docToTask(id: string, data: Record<string, any>): Task {
  return {
    id,
    text: data.text ?? '',
    completed: data.completed ?? false,
    assignee: data.assignee ?? null,
    reminders: (data.reminders ?? []).map((r: any) => ({
      id: r.id,
      timestamp: toDate(r.timestamp),
    })),
    createdAt: toDate(data.createdAt),
    order: data.order ?? 0,
  };
}
