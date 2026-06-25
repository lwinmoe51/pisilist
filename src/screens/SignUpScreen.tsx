import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { signUp } from '../services/auth';
import { validateEmail, validatePassword, validateConfirmPassword, getPasswordChecks } from '../utils/validation';

interface Props {
  navigation: any;
}

const FORM_MAX_WIDTH = 400;

export default function SignUpScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const isWeb = Platform.OS === 'web';
  const formWidth = isWeb ? Math.min(width - 64, FORM_MAX_WIDTH) : width - 64;

  const checks = getPasswordChecks(password);
  const showChecks = password.length > 0;

  const handleSignUp = async () => {
    setServerError(null);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = validateConfirmPassword(password, confirmPassword);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmError(cErr);
    if (eErr || pErr || cErr) return;

    setLoading(true);
    const name = displayName.trim() || email.trim().split('@')[0];
    const { error } = await signUp(email.trim(), name, password);
    setLoading(false);

    if (error) {
      setServerError(error.message);
    }
  };

  const s = themedStyles(colors);

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.inner, { width: formWidth, alignSelf: 'center' }]}>
        <Text style={s.title}>Create Account</Text>

        <TextInput
          style={s.input}
          placeholder="Display Name (optional)"
          placeholderTextColor={colors.placeholder}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
        />

        <TextInput
          style={[s.input, emailError && s.inputError]}
          placeholder="Email Address"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(null); }}
          onBlur={() => setEmailError(validateEmail(email))}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {emailError && <Text style={s.errorText}>{emailError}</Text>}

        <TextInput
          style={[s.input, passwordError && s.inputError]}
          placeholder="Password"
          placeholderTextColor={colors.placeholder}
          value={password}
          onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(null); }}
          onBlur={() => setPasswordError(validatePassword(password))}
          secureTextEntry
        />
        {showChecks && (
          <View style={s.checkRow}>
            <Text style={[s.checkItem, checks.minLength && s.checkPass]}>
              {checks.minLength ? '✓' : '✗'} 8+ characters
            </Text>
            <Text style={[s.checkItem, checks.hasNumber && s.checkPass]}>
              {checks.hasNumber ? '✓' : '✗'} 1 number
            </Text>
          </View>
        )}
        {passwordError && <Text style={s.errorText}>{passwordError}</Text>}

        <TextInput
          style={[s.input, confirmError && s.inputError]}
          placeholder="Confirm Password"
          placeholderTextColor={colors.placeholder}
          value={confirmPassword}
          onChangeText={(t) => { setConfirmPassword(t); if (confirmError) setConfirmError(null); }}
          onBlur={() => setConfirmError(validateConfirmPassword(password, confirmPassword))}
          secureTextEntry
        />
        {confirmError && <Text style={s.errorText}>{confirmError}</Text>}

        {serverError && <Text style={s.serverError}>{serverError}</Text>}

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>SIGN UP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.link}>Already have an account? Log In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const themedStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
    title: {
      fontSize: 28,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.text,
      marginBottom: 30,
    },
    input: {
      borderWidth: 0,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      marginBottom: 4,
      color: colors.text,
      backgroundColor: colors.inputBg,
      boxShadow: colors.cardShadow,
    },
    inputError: {
      borderWidth: 1,
      borderColor: colors.danger,
    },
    errorText: {
      color: colors.danger,
      fontSize: 12,
      marginBottom: 10,
      marginLeft: 4,
    },
    serverError: {
      color: colors.danger,
      fontSize: 13,
      textAlign: 'center',
      marginBottom: 12,
      marginTop: 4,
    },
    checkRow: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 10,
      marginLeft: 4,
    },
    checkItem: {
      fontSize: 12,
      color: colors.subtext,
    },
    checkPass: {
      color: '#4caf50',
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 6,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    link: { color: colors.primary, textAlign: 'center', fontSize: 14, marginTop: 12 },
  });
