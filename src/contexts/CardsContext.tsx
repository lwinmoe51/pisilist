import React, { createContext, useContext, useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { ownedCardsQuery, collaboratedCardsQuery, docToCard } from '../services/cards';
import type { Card } from '../types';

interface CardsState {
  cards: Card[];
  loading: boolean;
  error: string | null;
}

const CardsContext = createContext<CardsState>({
  cards: [],
  loading: true,
  error: null,
});

export function CardsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<CardsState>({
    cards: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user) {
      setState({ cards: [], loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    // Two separate queries so each matches Firestore security rules.
    // Security rules are NOT filters — the query itself must only ask
    // for documents the rules allow.
    const ownedQ = ownedCardsQuery(user.uid);
    const collabQ = collaboratedCardsQuery(user.uid);

    const ownedCards = new Map<string, Card>();
    const collabCards = new Map<string, Card>();
    let ownedReady = false;
    let collabReady = false;
    let ownedError: string | null = null;
    let collabError: string | null = null;

    function mergeAndSort() {
      const merged = new Map([...ownedCards, ...collabCards]);
      const cards = Array.from(merged.values());

      // Partition into pinned and others
      const pinnedCards = cards.filter((c) => c.pinned);
      const otherCards = cards.filter((c) => !c.pinned);

      // Pinned: ascending by updatedAt (oldest first → newest at END)
      pinnedCards.sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());

      // Others: descending by updatedAt (newest first → top of list)
      otherCards.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      setState({ cards: [...pinnedCards, ...otherCards], loading: false, error: null });
    }

    const unsubOwned = onSnapshot(
      ownedQ,
      (snapshot) => {
        ownedCards.clear();
        snapshot.docs.forEach((d) => {
          ownedCards.set(d.id, docToCard(d.id, d.data()));
        });
        ownedReady = true;
        ownedError = null;
        mergeAndSort();
      },
      (err) => {
        ownedError = err.message;
        if (collabError) {
          setState({ cards: [], loading: false, error: ownedError });
        }
      },
    );

    const unsubCollab = onSnapshot(
      collabQ,
      (snapshot) => {
        collabCards.clear();
        snapshot.docs.forEach((d) => {
          collabCards.set(d.id, docToCard(d.id, d.data()));
        });
        collabReady = true;
        collabError = null;
        mergeAndSort();
      },
      (err) => {
        collabError = err.message;
        if (ownedError) {
          setState({ cards: [], loading: false, error: collabError });
        }
      },
    );

    return () => {
      unsubOwned();
      unsubCollab();
    };
  }, [user]);

  return (
    <CardsContext.Provider value={state}>{children}</CardsContext.Provider>
  );
}

/** Hook to access the live card list from any component. */
export function useCards(): CardsState {
  return useContext(CardsContext);
}
