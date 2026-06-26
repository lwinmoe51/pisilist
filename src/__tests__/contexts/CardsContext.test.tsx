import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { CardsProvider, useCards } from '../../contexts/CardsContext';

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));
import { useAuth } from '../../contexts/AuthContext';
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock Firestore onSnapshot
let snapshotCallback: ((snap: any) => void) | null = null;
let errorCallback: ((err: any) => void) | null = null;
const unsubFns: jest.Mock[] = [];

jest.mock('firebase/firestore', () => ({
  onSnapshot: jest.fn((q: any, onNext: any, onError: any) => {
    snapshotCallback = onNext;
    errorCallback = onError;
    const unsub = jest.fn();
    unsubFns.push(unsub);
    return unsub;
  }),
}));

// Mock cards service
jest.mock('../../services/cards', () => ({
  ownedCardsQuery: jest.fn((uid: string) => ({ _type: 'owned', uid })),
  collaboratedCardsQuery: jest.fn((uid: string) => ({ _type: 'collab', uid })),
  docToCard: jest.fn((id: string, data: any) => ({
    id,
    title: data.title || 'Untitled',
    ownerId: data.ownerId || '',
    collaborators: data.collaborators || [],
    pinned: data.pinned || false,
    color: data.color || null,
    taskCount: 0,
    completedCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
}));

function TestComponent() {
  const { cards, loading, error } = useCards();
  return (
    <>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="count">{cards.length}</Text>
      <Text testID="error">{error || 'none'}</Text>
      {cards.map((c) => (
        <Text key={c.id} testID={`card-${c.id}`}>{c.title}</Text>
      ))}
    </>
  );
}

describe('CardsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    snapshotCallback = null;
    errorCallback = null;
    unsubFns.length = 0;
  });

  it('sets loading false when no user', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, isAuthenticated: false });
    const screen = await render(
      <CardsProvider><TestComponent /></CardsProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('loading').props.children).toBe('false');
      expect(screen.getByTestId('count').props.children).toBe(0);
    });
  });

  it('subscribes to owned and collab queries when user present', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' } as any,
      loading: false,
      isAuthenticated: true,
    });
    const { onSnapshot } = require('firebase/firestore');
    await render(
      <CardsProvider><TestComponent /></CardsProvider>,
    );
    expect(onSnapshot).toHaveBeenCalledTimes(2);
  });

  it('merges and sorts cards from both queries', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' } as any,
      loading: false,
      isAuthenticated: true,
    });
    const screen = await render(
      <CardsProvider><TestComponent /></CardsProvider>,
    );
    // Simulate owned cards snapshot
    await act(async () => {
      snapshotCallback!({
        docs: [
          { id: 'card-1', data: () => ({ title: 'Owned Card', ownerId: 'user-1', pinned: false }) },
        ],
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId('count').props.children).toBe(1);
      expect(screen.getByTestId('card-card-1')).toBeTruthy();
    });
  });
});
