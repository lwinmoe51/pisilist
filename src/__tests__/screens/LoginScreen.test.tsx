import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import LoginScreen from '../../screens/LoginScreen';

jest.mock('../../services/auth', () => ({
  signIn: jest.fn(),
}));
import { signIn } from '../../services/auth';
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

const mockNavigate = jest.fn();
const navigation = { navigate: mockNavigate } as any;

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

describe('LoginScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders email and password inputs', async () => {
    const screen = await render(<LoginScreen navigation={navigation} />);
    expect(screen.getByPlaceholderText('Email Address')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByText('LOG IN')).toBeTruthy();
  });

  it('shows error on empty email submit', async () => {
    const screen = await render(<LoginScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.press(screen.getByText('LOG IN'));
    });
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeTruthy();
    });
  });

  it('shows error on invalid email submit', async () => {
    const screen = await render(<LoginScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'notanemail');
    });
    await act(async () => {
      fireEvent.press(screen.getByText('LOG IN'));
    });
    await waitFor(() => {
      expect(screen.getByText('Enter a valid email address')).toBeTruthy();
    });
  });

  it('shows error on empty password submit', async () => {
    const screen = await render(<LoginScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'test@example.com');
    });
    await act(async () => {
      fireEvent.press(screen.getByText('LOG IN'));
    });
    await waitFor(() => {
      expect(screen.getByText('Password is required')).toBeTruthy();
    });
  });

  it('calls signIn with valid inputs', async () => {
    mockSignIn.mockResolvedValue({ user: {} as any, error: null });
    const screen = await render(<LoginScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'test@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    });
    await act(async () => {
      fireEvent.press(screen.getByText('LOG IN'));
    });
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays server error on failed login', async () => {
    mockSignIn.mockResolvedValue({ user: null, error: { message: 'Invalid credentials', code: 'auth/invalid-credential' } as any });
    const screen = await render(<LoginScreen navigation={navigation} />);
    await act(async () => {
      fireEvent.changeText(screen.getByPlaceholderText('Email Address'), 'test@example.com');
      fireEvent.changeText(screen.getByPlaceholderText('Password'), 'wrong');
    });
    await act(async () => {
      fireEvent.press(screen.getByText('LOG IN'));
    });
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeTruthy();
    });
  });

  it('navigates to SignUp', async () => {
    const screen = await render(<LoginScreen navigation={navigation} />);
    fireEvent.press(screen.getByText(/Sign Up/));
    expect(mockNavigate).toHaveBeenCalledWith('SignUp');
  });

  it('navigates to ResetPassword', async () => {
    const screen = await render(<LoginScreen navigation={navigation} />);
    fireEvent.press(screen.getByText(/Reset Here/));
    expect(mockNavigate).toHaveBeenCalledWith('ResetPassword');
  });
});
