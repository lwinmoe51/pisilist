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
  where,
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
  console.log('[cards.createCard] request:', { uid, title });
  try {
    const docRef = await addDoc(cardCollection(), {
      title: title.trim() || 'Untitled',
      ownerId: uid,
      collaborators: [] as string[],
      pinned: false,
      color: null,
      taskCount: 0,
      completedCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('[cards.createCard] success:', { id: docRef.id });
    return docRef.id;
  } catch (err) {
    console.error('[cards.createCard] error:', err);
    throw err;
  }
}

/** Update a card's top-level fields (title, pinned, color). */
export async function updateCard(
  cardId: string,
  data: Partial<Pick<Card, 'title' | 'pinned' | 'color'>>,
): Promise<void> {
  console.log('[cards.updateCard] request:', { cardId, data });
  try {
    await updateDoc(cardDoc(cardId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    console.log('[cards.updateCard] success');
  } catch (err) {
    console.error('[cards.updateCard] error:', err);
    throw err;
  }
}

/** Update card cosmetic fields (color, pinned).
 *  For pin/unpin, sets updatedAt to now so the card sorts correctly:
 *  - Pin: new timestamp → sorts to END of pinned section (ascending)
 *  - Unpin: fresh timestamp → sorts to TOP of others section (descending)
 *  For color-only changes, does NOT touch updatedAt (no reorder). */
export async function updateCardCosmetic(
  cardId: string,
  data: Partial<Pick<Card, 'pinned' | 'color'>>,
): Promise<void> {
  console.log('[cards.updateCardCosmetic] request:', { cardId, data });
  try {
    const update: Record<string, any> = { ...data };
    // Set timestamp on pin/unpin to control sort position
    if (data.pinned !== undefined) {
      update.updatedAt = serverTimestamp();
    }
    await updateDoc(cardDoc(cardId), update);
    console.log('[cards.updateCardCosmetic] success');
  } catch (err) {
    console.error('[cards.updateCardCosmetic] error:', err);
    throw err;
  }
}

/** Delete a card and all its tasks in a single batch. */
export async function deleteCard(cardId: string): Promise<void> {
  console.log('[cards.deleteCard] request:', { cardId });
  try {
    const tasksSnap = await getDocs(tasksCollection(cardId));
    console.log('[cards.deleteCard] found', tasksSnap.docs.length, 'tasks to delete');
    const batch = writeBatch(db);

    for (const taskDocSnap of tasksSnap.docs) {
      console.log('[cards.deleteCard] batching task delete:', taskDocSnap.id);
      batch.delete(taskDocSnap.ref);
    }
    batch.delete(cardDoc(cardId));

    await batch.commit();
    console.log('[cards.deleteCard] success — card +', tasksSnap.docs.length, 'tasks deleted');
  } catch (err) {
    console.error('[cards.deleteCard] error:', err);
    throw err;
  }
}

// ── Task CRUD (subcollection under card) ───────────────────────────

/** Add a new task to a card. Updates card's taskCount. */
export async function createTask(
  cardId: string,
  text: string,
): Promise<string> {
  console.log('[cards.createTask] request:', { cardId, text });
  try {
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

    console.log('[cards.createTask] success:', { id: docRef.id, order: maxOrder + 1 });
    return docRef.id;
  } catch (err) {
    console.error('[cards.createTask] error:', err);
    throw err;
  }
}

/** Update a task's text or assignee. */
export async function updateTask(
  cardId: string,
  taskId: string,
  data: Partial<Pick<Task, 'text' | 'assignee'>>,
): Promise<void> {
  console.log('[cards.updateTask] request:', { cardId, taskId, data });
  try {
    await updateDoc(taskDoc(cardId, taskId), data);
    console.log('[cards.updateTask] success');
  } catch (err) {
    console.error('[cards.updateTask] error:', err);
    throw err;
  }
}

/** Toggle a task's completed status. Updates card's completedCount. */
export async function toggleTask(
  cardId: string,
  taskId: string,
  completed: boolean,
): Promise<void> {
  console.log('[cards.toggleTask] request:', { cardId, taskId, completed });
  try {
    const batch = writeBatch(db);
    batch.update(taskDoc(cardId, taskId), { completed });
    batch.update(cardDoc(cardId), {
      completedCount: increment(completed ? 1 : -1),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    console.log('[cards.toggleTask] success');
  } catch (err) {
    console.error('[cards.toggleTask] error:', err);
    throw err;
  }
}

/** Delete a single task. Updates card's taskCount and optionally completedCount. */
export async function deleteTask(
  cardId: string,
  taskId: string,
  wasCompleted: boolean,
): Promise<void> {
  console.log('[cards.deleteTask] request:', { cardId, taskId, wasCompleted });
  try {
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
    console.log('[cards.deleteTask] success');
  } catch (err) {
    console.error('[cards.deleteTask] error:', err);
    throw err;
  }
}

/** Add a collaborator to a card's collaborators array (server-side). */
export async function addCollaborator(
  cardId: string,
  userId: string,
): Promise<void> {
  console.log('[cards.addCollaborator] request:', { cardId, userId });
  try {
    await updateDoc(cardDoc(cardId), {
      collaborators: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });
    console.log('[cards.addCollaborator] success');
  } catch (err) {
    console.error('[cards.addCollaborator] error:', err);
    throw err;
  }
}

/** Update reminders on a task document. */
export async function updateTaskReminders(
  cardId: string,
  taskId: string,
  reminders: Reminder[],
): Promise<void> {
  console.log('[cards.updateTaskReminders] request:', { cardId, taskId, count: reminders.length });
  try {
    await updateDoc(taskDoc(cardId, taskId), { reminders });
    console.log('[cards.updateTaskReminders] success');
  } catch (err) {
    console.error('[cards.updateTaskReminders] error:', err);
    throw err;
  }
}

// ── Query helpers ──────────────────────────────────────────────────

/**
 * Return a query for cards owned by the given uid.
 * Matches Firestore security rules: `ownerId == request.auth.uid`.
 */
export function ownedCardsQuery(uid: string) {
  return query(
    cardCollection(),
    where('ownerId', '==', uid),
    orderBy('updatedAt', 'desc'),
  );
}

/**
 * Return a query for cards where the given uid is in the collaborators array.
 * Matches Firestore security rules: `uid in doc.data.collaborators`.
 */
export function collaboratedCardsQuery(uid: string) {
  return query(
    cardCollection(),
    where('collaborators', 'array-contains', uid),
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
    color: data.color ?? null,
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
