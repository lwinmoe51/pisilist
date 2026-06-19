import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { upsertUser } from './users';

/** Errors that the auth service can surface to callers. */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Map Firebase error codes to human-readable messages. */
function mapAuthError(error: { code: string; message: string }): AuthError {
  const message =
    {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed':
        'Network error. Please check your connection.',
    }[error.code] ?? error.message;
  return new AuthError(message, error.code);
}

export interface AuthResult {
  user: User | null;
  error: AuthError | null;
}

/**
 * Create a new account with email and password.
 * Returns the Firebase User on success.
 */
export async function signUp(
  email: string,
  displayName: string,
  password: string,
): Promise<AuthResult> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    // Create Firestore user profile doc so collaborators can be looked up
    await upsertUser(cred.user.uid, email, displayName);
    return { user: cred.user, error: null };
  } catch (err: any) {
    return { user: null, error: mapAuthError(err) };
  }
}

/**
 * Sign in an existing user with email and password.
 */
export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { user: cred.user, error: null };
  } catch (err: any) {
    return { user: null, error: mapAuthError(err) };
  }
}

/**
 * Send a password reset email to the given address.
 * Firebase automatically generates a reset link and emails it.
 */
export async function resetPassword(email: string): Promise<{
  success: boolean;
  error: AuthError | null;
}> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: mapAuthError(err) };
  }
}

/**
 * Sign out the currently authenticated user.
 */
export async function logOut(): Promise<void> {
  await signOut(auth);
}
