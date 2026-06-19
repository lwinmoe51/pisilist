import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/** Create or update a user profile doc in Firestore (called on sign-up). */
export async function upsertUser(
  uid: string,
  email: string,
  displayName: string,
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    // preserve existing fields, just update email/displayName
    await setDoc(
      userRef,
      { email, displayName, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } else {
    await setDoc(userRef, {
      uid,
      email,
      displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/** Look up a user by their email address. Returns uid + profile or null. */
export async function findUserByEmail(
  email: string,
): Promise<{ uid: string; email: string; displayName: string } | null> {
  const q = query(
    collection(db, 'users'),
    where('email', '==', email.trim().toLowerCase()),
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const data = snapshot.docs[0].data();
  return {
    uid: snapshot.docs[0].id,
    email: data.email ?? '',
    displayName: data.displayName ?? '',
  };
}

/** Fetch a user profile by UID. */
export async function getUserByUid(
  uid: string,
): Promise<{ email: string; displayName: string } | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    email: data.email ?? '',
    displayName: data.displayName ?? '',
  };
}

/** Fetch multiple user profiles by UID (for collaborator lists). */
export async function getUsersByUids(
  uids: string[],
): Promise<Map<string, { email: string; displayName: string }>> {
  const results = new Map<string, { email: string; displayName: string }>();
  // Firestore doesn't support batch get by array, so fetch in parallel
  await Promise.all(
    uids.map(async (uid) => {
      const user = await getUserByUid(uid);
      if (user) results.set(uid, user);
    }),
  );
  return results;
}
