import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ConfirmModal from '../../components/ConfirmModal';

jest.mock('../../theme/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      surface: '#fff', text: '#000', subtext: '#666', danger: '#e53935',
      primary: '#1a73e8', modalBg: 'rgba(0,0,0,0.5)', border: '#e0e0e0',
    },
  }),
}));

describe('ConfirmModal', () => {
  const defaultProps = {
    visible: true,
    title: 'Delete Card',
    message: 'Are you sure you want to delete this card?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders title and message', async () => {
    const screen = await render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Delete Card')).toBeTruthy();
    expect(screen.getByText('Are you sure you want to delete this card?')).toBeTruthy();
  });

  it('renders default confirm label', async () => {
    const screen = await render(<ConfirmModal {...defaultProps} />);
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('renders custom confirm label', async () => {
    const screen = await render(<ConfirmModal {...defaultProps} confirmLabel="Remove" />);
    expect(screen.getByText('Remove')).toBeTruthy();
  });

  it('calls onConfirm when confirm pressed', async () => {
    const screen = await render(<ConfirmModal {...defaultProps} />);
    fireEvent.press(screen.getByText('Delete'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel pressed', async () => {
    const screen = await render(<ConfirmModal {...defaultProps} />);
    fireEvent.press(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not render when not visible', async () => {
    const screen = await render(<ConfirmModal {...defaultProps} visible={false} />);
    expect(screen.queryByText('Delete Card')).toBeNull();
  });
});
