import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  getDocs,
  writeBatch,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Invitation } from '../types';
import { findUserByEmail } from './users';

export interface InvitationDraft {
  toEmail: string;
  cardId: string;
  cardTitle: string;
}

// ── Helpers ────────────────────────────────────────────────────────

function invitationsCollection() {
  return collection(db, 'invitations');
}

function invitationDoc(inviteId: string) {
  return doc(db, 'invitations', inviteId);
}

function cardDoc(cardId: string) {
  return doc(db, 'cards', cardId);
}

// ── Invitation CRUD ────────────────────────────────────────────────

/**
 * Send an invitation to a user by email.
 * Verifies the target user exists in the users collection first.
 * Returns the new invitation id, or throws on invalid target.
 */
export async function sendInvitation(
  fromUserId: string,
  fromEmail: string,
  draft: InvitationDraft,
): Promise<string> {
  const normalizedEmail = draft.toEmail.trim().toLowerCase();

  // Verify the target user is registered
  const targetUser = await findUserByEmail(normalizedEmail);
  if (!targetUser) {
    throw new Error(
      'No Pisilist account found with that email address.',
    );
  }

  if (targetUser.uid === fromUserId) {
    throw new Error('You cannot invite yourself.');
  }

  // Check not already a collaborator (client-side best effort)
  // Full enforcement is in security rules

  const docRef = await addDoc(invitationsCollection(), {
    fromUserId,
    fromEmail,
    toEmail: normalizedEmail,
    cardId: draft.cardId,
    cardTitle: draft.cardTitle,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

/** Accept an invitation: update status + add user to card's collaborators. */
export async function acceptInvitation(
  inviteId: string,
  userId: string,
  cardId: string,
): Promise<void> {
  console.log('[invitations.accept] request:', { inviteId, userId, cardId });
  try {
    const batch = writeBatch(db);
    // Step 1: Mark invitation as accepted
    batch.update(invitationDoc(inviteId), { status: 'accepted' });
    // Step 2: Add user to card's collaborators array
    batch.update(cardDoc(cardId), {
      collaborators: arrayUnion(userId),
    });
    await batch.commit();
    console.log('[invitations.accept] success');
  } catch (err: any) {
    console.error('[invitations.accept] error:', err);
    throw err;
  }
}

/** Decline an invitation. */
export async function declineInvitation(inviteId: string): Promise<void> {
  console.log('[invitations.decline] request:', { inviteId });
  try {
    await updateDoc(invitationDoc(inviteId), { status: 'declined' });
    console.log('[invitations.decline] success');
  } catch (err: any) {
    console.error('[invitations.decline] error:', err);
    throw err;
  }
}

// ── Queries ────────────────────────────────────────────────────────

/** Real-time listener for pending invitations sent to an email. */
export function onPendingInvitations(
  email: string,
  callback: (invitations: Invitation[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const q = query(
    invitationsCollection(),
    where('toEmail', '==', email.trim().toLowerCase()),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const invitations: Invitation[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          fromUserId: data.fromUserId ?? '',
          fromEmail: data.fromEmail ?? '',
          toEmail: data.toEmail ?? '',
          cardId: data.cardId ?? '',
          cardTitle: data.cardTitle ?? '',
          status: data.status ?? 'pending',
          createdAt: data.createdAt?.toDate() ?? new Date(),
        };
      });
      callback(invitations);
    },
    (err) => {
      onError?.(err);
    },
  );
}
