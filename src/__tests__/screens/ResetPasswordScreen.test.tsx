import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ResetPasswordScreen from '../../screens/ResetPasswordScreen';

jest.mock('../../services/auth', () => ({
  resetPassword: jest.fn(),
}));
import { resetPassword } from '../../services/auth';
const mockReset = resetPassword as jest.MockedFunction<typeof resetPassword>;

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const navigation = { navigate: mockNavigate, goBack: mockGoBack } as any;

jest.mock('../../theme/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#fff', text: '#000', subtext: '#666', primary: '#1a73e8',
      danger: '#e53935', placeholder: '#999', inputBg: '#fff', border: '#e0e0e0',
      cardShadow: '0 1px 2px rgba(0,0,0,0.1)',
    },
    isDark: false,
  }),
}));

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 800, height: 600 }),
}));

describe('ResetPasswordScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders email input and submit button', async () => {
    const screen = await render(<ResetPasswordScreen navigation={navigation} />);
    expect(screen.getByPlaceholderText('Email Address')).toBeTruthy();
    expect(screen.getByText('SEND RESET LINK')).toBeTruthy();
  });

  it('shows error on empty email submit', async () => {
    const screen = await render(<ResetPasswordScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.press(screen.getByText('SEND RESET LINK'));
    });
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeTruthy();
    });
  });

  it('shows error on invalid email submit', async () => {
    const screen = await render(<ResetPasswordScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'bad');
    });
    await act(async () => {
      fireEvent.press(screen.getByText('SEND RESET LINK'));
    });
    await waitFor(() => {
      expect(screen.getByText('Enter a valid email address')).toBeTruthy();
    });
  });

  it('calls resetPassword and shows success', async () => {
    mockReset.mockResolvedValue({ success: true, error: null });
    const screen = await render(<ResetPasswordScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'user@test.com');
    });
    await act(async () => {
      fireEvent.press(screen.getByText('SEND RESET LINK'));
    });
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith('user@test.com');
    });
    await waitFor(() => {
      expect(screen.getByText('Check Your Email')).toBeTruthy();
    });
  });

  it('displays server error on failure', async () => {
    mockReset.mockResolvedValue({ success: false, error: { message: 'No user found', code: 'auth/user-not-found' } as any });
    const screen = await render(<ResetPasswordScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'nobody@test.com');
    });
    await act(async () => {
      fireEvent.press(screen.getByText('SEND RESET LINK'));
    });
    await waitFor(() => {
      expect(screen.getByText('No user found')).toBeTruthy();
    });
  });

  it('navigates back to login', async () => {
    const screen = await render(<ResetPasswordScreen navigation={navigation} />);
    fireEvent.press(screen.getByText(/Back to Login/));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
