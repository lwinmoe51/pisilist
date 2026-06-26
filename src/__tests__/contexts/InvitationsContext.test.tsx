import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Text } from 'react-native';
import { InvitationsProvider, useInvitations } from '../../contexts/InvitationsContext';

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));
import { useAuth } from '../../contexts/AuthContext';
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock invitations service
let listenerCallback: ((invitations: any[]) => void) | null = null;
const unsubFns: jest.Mock[] = [];

jest.mock('../../services/invitations', () => ({
  onPendingInvitations: jest.fn((email: string, onNext: any, onError: any) => {
    listenerCallback = onNext;
    const unsub = jest.fn();
    unsubFns.push(unsub);
    return unsub;
  }),
}));

function TestComponent() {
  const { invitations, loading } = useInvitations();
  return (
    <>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="count">{invitations.length}</Text>
      {invitations.map((inv) => (
        <Text key={inv.id} testID={`inv-${inv.id}`}>{inv.cardTitle}</Text>
      ))}
    </>
  );
}

describe('InvitationsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listenerCallback = null;
    unsubFns.length = 0;
  });

  it('sets loading false when no user', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, isAuthenticated: false });
    const screen = await render(
      <InvitationsProvider><TestComponent /></InvitationsProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('loading').props.children).toBe('false');
      expect(screen.getByTestId('count').props.children).toBe(0);
    });
  });

  it('subscribes to pending invitations when user has email', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' } as any,
      loading: false,
      isAuthenticated: true,
    });
    const { onPendingInvitations } = require('../../services/invitations');
    await render(
      <InvitationsProvider><TestComponent /></InvitationsProvider>,
    );
    expect(onPendingInvitations).toHaveBeenCalledWith('test@test.com', expect.any(Function), expect.any(Function));
  });

  it('displays invitations from listener', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'user-1', email: 'test@test.com' } as any,
      loading: false,
      isAuthenticated: true,
    });
    const screen = await render(
      <InvitationsProvider><TestComponent /></InvitationsProvider>,
    );
    await act(async () => {
      listenerCallback!([
        { id: 'inv-1', cardTitle: 'Shared Card', fromEmail: 'other@test.com', status: 'pending' },
      ]);
    });
    await waitFor(() => {
      expect(screen.getByTestId('count').props.children).toBe(1);
      expect(screen.getByTestId('inv-inv-1')).toBeTruthy();
    });
  });
});
