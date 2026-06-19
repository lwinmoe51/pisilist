/**
 * AuthContext tests.
 *
 * firebase/auth is mocked via moduleNameMapper.
 * The mock onAuthStateChanged returns an unsubscribe function but
 * does NOT invoke the callback — so the context will remain in
 * its initial/default state. This is fine for testing the provider
 * structure and default values.
 *
 * @testing-library/react-native v14 uses async render.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// A consumer component that reads auth state and renders it
function TestConsumer() {
  const { user, loading, isAuthenticated } = useAuth();

  return (
    <View>
      <Text testID="loading">{String(loading)}</Text>
      <Text testID="isAuthenticated">{String(isAuthenticated)}</Text>
      <Text testID="hasUser">{String(!!user)}</Text>
    </View>
  );
}

describe('AuthProvider', () => {
  it('should render children', async () => {
    const screen = await render(
      <AuthProvider>
        <Text>Hello World</Text>
      </AuthProvider>,
    );

    expect(screen.getByText('Hello World')).toBeTruthy();
  });

  it('should provide default auth state (loading=true, no user)', async () => {
    // Since onAuthStateChanged mock does not invoke the callback,
    // the state stays at its initial value: loading=true, user=null
    const screen = await render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('loading').props.children).toBe('true');
    expect(screen.getByTestId('isAuthenticated').props.children).toBe('false');
    expect(screen.getByTestId('hasUser').props.children).toBe('false');
  });
});

describe('useAuth', () => {
  it('should return default values when used outside AuthProvider', async () => {
    function OutsideConsumer() {
      const auth = useAuth();
      return <Text testID="outside-loading">{String(auth.loading)}</Text>;
    }

    const screen = await render(<OutsideConsumer />);
    expect(screen.getByTestId('outside-loading').props.children).toBe('true');
  });
});
