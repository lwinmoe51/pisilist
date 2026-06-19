/** A single task line item inside a card. */
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  assignee: string | null; // email of assigned collaborator, or null
  reminders: Reminder[];
  createdAt: Date;
  order: number;
}

/** A timed reminder attached to a task. */
export interface Reminder {
  id: string;
  timestamp: Date;
}

/** A card (like a Google Keep note) containing a list of tasks. */
export interface Card {
  id: string;
  title: string;
  ownerId: string;
  collaborators: string[]; // user IDs
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** An invitation sent to a non-member to collaborate on a card. */
export interface Invitation {
  id: string;
  fromUserId: string;
  fromEmail: string;
  toEmail: string;
  cardId: string;
  cardTitle: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
}

/** Authenticated user profile (mirrors Firebase Auth user). */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}
