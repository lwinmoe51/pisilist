import React, { createContext, useContext, useEffect, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { cardsQuery, docToCard } from '../services/cards';
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

    const q = cardsQuery(user.uid);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allCards = snapshot.docs.map((d) =>
          docToCard(d.id, d.data()),
        );
        // Client-side filter: cards owned by OR collaborated with the user
        const cards = allCards.filter(
          (c) =>
            c.ownerId === user.uid ||
            c.collaborators.includes(user.uid),
        );
        // pinned first, then by updatedAt desc
        cards.sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        });
        setState({ cards, loading: false, error: null });
      },
      (err) => {
        setState({ cards: [], loading: false, error: err.message });
      },
    );

    return unsubscribe;
  }, [user]);

  return (
    <CardsContext.Provider value={state}>{children}</CardsContext.Provider>
  );
}

/** Hook to access the live card list from any component. */
export function useCards(): CardsState {
  return useContext(CardsContext);
}
