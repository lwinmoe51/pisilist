import React from 'react';
import { render } from '@testing-library/react-native';
import Toast from '../../components/Toast';

jest.mock('../../theme/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      surface: '#fff', text: '#000', subtext: '#666',
      danger: '#e53935', primary: '#1a73e8', border: '#e0e0e0',
    },
  }),
}));

describe('Toast', () => {
  it('renders success message', async () => {
    const screen = await render(
      <Toast message="Card created" type="success" visible={true} onDismiss={jest.fn()} />,
    );
    expect(screen.getByText('Card created')).toBeTruthy();
  });

  it('renders error message', async () => {
    const screen = await render(
      <Toast message="Failed to delete" type="error" visible={true} onDismiss={jest.fn()} />,
    );
    expect(screen.getByText('Failed to delete')).toBeTruthy();
  });

  it('renders info message', async () => {
    const screen = await render(
      <Toast message="Loading..." type="info" visible={true} onDismiss={jest.fn()} />,
    );
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('does not render when not visible', async () => {
    const screen = await render(
      <Toast message="Hidden" type="success" visible={false} onDismiss={jest.fn()} />,
    );
    expect(screen.queryByText('Hidden')).toBeNull();
  });
});
