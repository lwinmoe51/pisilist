/**
 * Shared validation utilities for auth forms.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required';
  if (!isValidEmail(trimmed)) return 'Enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/\d/.test(password)) return 'Password must contain at least 1 number';
  return null;
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return 'Please confirm your password';
  if (password !== confirm) return 'Passwords do not match';
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) return `${label} is required`;
  return null;
}

/** Password strength indicators for live display */
export function getPasswordChecks(password: string) {
  return {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
  };
}

/** Map common Firestore error codes to user-friendly messages. */
export function mapFirestoreError(err: { code?: string; message?: string }): string {
  const code = err.code || '';
  const friendly: Record<string, string> = {
    'permission-denied': 'You don\'t have permission to do that.',
    'not-found': 'The requested item no longer exists.',
    'already-exists': 'This item already exists.',
    'resource-exhausted': 'Too many requests. Please wait and try again.',
    'failed-precondition': 'Operation not allowed in the current state.',
    'unavailable': 'Service temporarily unavailable. Please try again.',
  };
  return friendly[code] || err.message || 'An unexpected error occurred.';
}
