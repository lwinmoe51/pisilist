/**
 * NotificationSyncContext
 *
 * App-root provider that subscribes to all cards' tasks via Firestore
 * onSnapshot. Whenever reminders change in any task, it triggers the
 * sync engine to re-schedule local notifications on this device.
 *
 * This is the reactive bridge between Firestore and local notifications
 * that ensures multi-device sync.
 */

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import {
  ownedCardsQuery,
  collaboratedCardsQuery,
  tasksQuery,
  docToCard,
  docToTask,
} from '../services/cards';
import {
  syncLocalNotifications,
  cancelAllScheduledReminders,
} from '../services/notificationSync';
import { log } from '../utils/logger';
import type { Card } from '../types';

const NotificationSyncContext = createContext<null>(null);

export function NotificationSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  // Track per-card task listeners so we can clean them up
  const taskUnsubsRef = useRef<Map<string, () => void>>(new Map());

  useEffect(() => {
    if (!user) {
      // Clean up all listeners on logout
      taskUnsubsRef.current.forEach((unsub) => unsub());
      taskUnsubsRef.current.clear();
      cancelAllScheduledReminders();
      return;
    }

    // Track card titles for sync calls
    const cardTitles = new Map<string, string>();

    // Subscribe to owned + collaborated cards
    const ownedQ = ownedCardsQuery(user.uid);
    const collabQ = collaboratedCardsQuery(user.uid);

    function syncCardTasks(cardId: string, cardTitle: string) {
      // Remove existing listener for this card if any
      const existing = taskUnsubsRef.current.get(cardId);
      if (existing) existing();

      const q = tasksQuery(cardId);
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const tasks = snapshot.docs.map((d) => docToTask(d.id, d.data()));
          log('[notificationSync] tasks updated for card:', cardId, 'tasks:', tasks.length);
          syncLocalNotifications(tasks, cardTitle);
        },
        (err) => {
          log('[notificationSync] task listener error:', cardId, err.message);
        },
      );

      taskUnsubsRef.current.set(cardId, unsub);
    }

    function processCards(cards: Card[]) {
      const activeIds = new Set<string>();

      for (const card of cards) {
        activeIds.add(card.id);
        cardTitles.set(card.id, card.title);
        syncCardTasks(card.id, card.title);
      }

      // Clean up listeners for cards no longer in the list
      for (const [cardId, unsub] of taskUnsubsRef.current) {
        if (!activeIds.has(cardId)) {
          unsub();
          taskUnsubsRef.current.delete(cardId);
          cardTitles.delete(cardId);
        }
      }
    }

    const unsubOwned = onSnapshot(
      ownedQ,
      (snapshot) => {
        const cards = snapshot.docs.map((d) => docToCard(d.id, d.data()));
        processCards(cards);
      },
      (err) => log('[notificationSync] owned cards error:', err.message),
    );

    const unsubCollab = onSnapshot(
      collabQ,
      (snapshot) => {
        const cards = snapshot.docs.map((d) => docToCard(d.id, d.data()));
        processCards(cards);
      },
      (err) => log('[notificationSync] collab cards error:', err.message),
    );

    return () => {
      unsubOwned();
      unsubCollab();
      taskUnsubsRef.current.forEach((unsub) => unsub());
      taskUnsubsRef.current.clear();
      cancelAllScheduledReminders();
    };
  }, [user]);

  return (
    <NotificationSyncContext.Provider value={null}>
      {children}
    </NotificationSyncContext.Provider>
  );
}
