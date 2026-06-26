import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { ThemeProvider, useTheme } from '../../theme/ThemeContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

// Mock useColorScheme
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.useColorScheme = jest.fn(() => 'light');
  return rn;
});

function TestComponent() {
  const { colors, isDark, mode, setMode } = useTheme();
  return (
    <>
      <Text testID="mode">{mode}</Text>
      <Text testID="isDark">{String(isDark)}</Text>
      <Text testID="bg">{colors.background}</Text>
      <TouchableOpacity testID="setDark" onPress={() => setMode('dark')} />
      <TouchableOpacity testID="setLight" onPress={() => setMode('light')} />
    </>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => jest.clearAllMocks());

  it('provides default system mode', async () => {
    const screen = await render(
      <ThemeProvider><TestComponent /></ThemeProvider>,
    );
    expect(screen.getByTestId('mode').props.children).toBe('system');
    expect(screen.getByTestId('isDark').props.children).toBe('false');
  });

  it('provides light colors when system scheme is light', async () => {
    const screen = await render(
      <ThemeProvider><TestComponent /></ThemeProvider>,
    );
    expect(screen.getByTestId('bg').props.children).toBe('#f5f5f5');
  });

  it('switches to dark mode', async () => {
    const screen = await render(
      <ThemeProvider><TestComponent /></ThemeProvider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('setDark'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('mode').props.children).toBe('dark');
      expect(screen.getByTestId('isDark').props.children).toBe('true');
      expect(screen.getByTestId('bg').props.children).toBe('#121212');
    });
  });

  it('switches back to light mode', async () => {
    const screen = await render(
      <ThemeProvider><TestComponent /></ThemeProvider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('setDark'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('setLight'));
    });
    await waitFor(() => {
      expect(screen.getByTestId('mode').props.children).toBe('light');
      expect(screen.getByTestId('isDark').props.children).toBe('false');
    });
  });

  it('persists mode to AsyncStorage', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    const screen = await render(
      <ThemeProvider><TestComponent /></ThemeProvider>,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('setDark'));
    });
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@pisilist_theme', 'dark');
    });
  });
});
