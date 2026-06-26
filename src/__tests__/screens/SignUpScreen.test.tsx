import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import SignUpScreen from '../../screens/SignUpScreen';

jest.mock('../../services/auth', () => ({
  signUp: jest.fn(),
}));
import { signUp } from '../../services/auth';
const mockSignUp = signUp as jest.MockedFunction<typeof signUp>;

const mockGoBack = jest.fn();
const navigation = { goBack: mockGoBack } as any;

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

describe('SignUpScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders all inputs and sign up button', async () => {
    const screen = await render(<SignUpScreen navigation={navigation} />);
    expect(screen.getByPlaceholderText('Display Name (optional)')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email Address')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByPlaceholderText('Confirm Password')).toBeTruthy();
    expect(screen.getByText('SIGN UP')).toBeTruthy();
  });

  it('shows email error on invalid email submit', async () => {
    const screen = await render(<SignUpScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'bad');
      fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password1');
      fireEvent.changeText(screen.getByPlaceholderText('Confirm Password'), 'password1');
    });
    await act(async () => {
      fireEvent.press(screen.getByText('SIGN UP'));
    });
    await waitFor(() => {
      expect(screen.getByText('Enter a valid email address')).toBeTruthy();
    });
  });

  it('shows password strength indicators', async () => {
    const screen = await render(<SignUpScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Password'), 'short');
    });
    await waitFor(() => {
      expect(screen.getByText(/8\+ characters/)).toBeTruthy();
      expect(screen.getByText(/1 number/)).toBeTruthy();
    });
  });

  it('shows password mismatch error on submit', async () => {
    const screen = await render(<SignUpScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'test@test.com');
      fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password1');
      fireEvent.changeText(screen.getByPlaceholderText('Confirm Password'), 'different');
    });
    await act(async () => {
      fireEvent.press(screen.getByText('SIGN UP'));
    });
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeTruthy();
    });
  });

  it('calls signUp with display name', async () => {
    mockSignUp.mockResolvedValue({ user: {} as any, error: null });
    const screen = await render(<SignUpScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Display Name (optional)'), 'Alice');
      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'alice@test.com');
      fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password1');
      fireEvent.changeText(screen.getByPlaceholderText('Confirm Password'), 'password1');
    });
    await act(async () => {
      fireEvent.press(screen.getByText('SIGN UP'));
    });
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('alice@test.com', 'Alice', 'password1');
    });
  });

  it('falls back to email prefix when display name empty', async () => {
    mockSignUp.mockResolvedValue({ user: {} as any, error: null });
    const screen = await render(<SignUpScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'bob@test.com');
      fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password1');
      fireEvent.changeText(screen.getByPlaceholderText('Confirm Password'), 'password1');
    });
    await act(async () => {
      fireEvent.press(screen.getByText('SIGN UP'));
    });
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('bob@test.com', 'bob', 'password1');
    });
  });

  it('displays server error', async () => {
    mockSignUp.mockResolvedValue({ user: null, error: { message: 'Email already in use', code: 'auth/email-already-in-use' } as any });
    const screen = await render(<SignUpScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'dup@test.com');
      fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password1');
      fireEvent.changeText(screen.getByPlaceholderText('Confirm Password'), 'password1');
    });
    await act(async () => {
      fireEvent.press(screen.getByText('SIGN UP'));
    });
    await waitFor(() => {
      expect(screen.getByText('Email already in use')).toBeTruthy();
    });
  });

  it('navigates back to login', async () => {
    const screen = await render(<SignUpScreen navigation={navigation} />);
    fireEvent.press(screen.getByText(/Log In/));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
