import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { onPendingInvitations } from '../services/invitations';
import type { Invitation } from '../types';

interface InvitationsState {
  invitations: Invitation[];
  loading: boolean;
}

const InvitationsContext = createContext<InvitationsState>({
  invitations: [],
  loading: true,
});

export function InvitationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [state, setState] = useState<InvitationsState>({
    invitations: [],
    loading: true,
  });

  useEffect(() => {
    if (!user?.email) {
      setState({ invitations: [], loading: false });
      return;
    }

    const unsubscribe = onPendingInvitations(
      user.email,
      (invitations) => {
        setState({ invitations, loading: false });
      },
      (err) => {
        console.error('Invitations listener error:', err.message);
        setState({ invitations: [], loading: false });
      },
    );

    return unsubscribe;
  }, [user]);

  return (
    <InvitationsContext.Provider value={state}>
      {children}
    </InvitationsContext.Provider>
  );
}

/** Hook to access pending invitations from any component. */
export function useInvitations(): InvitationsState {
  return useContext(InvitationsContext);
}
