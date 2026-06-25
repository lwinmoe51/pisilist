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
import { signIn } from '../services/auth';
import { validateEmail, validateRequired } from '../utils/validation';

interface Props {
  navigation: any;
}

const FORM_MAX_WIDTH = 400;

export default function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const isWeb = Platform.OS === 'web';
  const formWidth = isWeb ? Math.min(width - 64, FORM_MAX_WIDTH) : width - 64;

  const handleLogin = async () => {
    setServerError(null);
    const eErr = validateEmail(email);
    const pErr = validateRequired(password, 'Password');
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    const { error } = await signIn(email.trim(), password);
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
        <Text style={s.brand}>PISILIST</Text>
        <Text style={s.tagline}>"Simplicity in Team Tasks"</Text>

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
          onBlur={() => setPasswordError(validateRequired(password, 'Password'))}
          secureTextEntry
        />
        {passwordError && <Text style={s.errorText}>{passwordError}</Text>}

        {serverError && <Text style={s.serverError}>{serverError}</Text>}

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>LOG IN</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={s.link}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
          <Text style={s.link}>Forgot Password? Reset Here</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const themedStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    inner: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    brand: {
      fontSize: 36,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.text,
      letterSpacing: 2,
    },
    tagline: {
      fontSize: 14,
      textAlign: 'center',
      color: colors.subtext,
      marginBottom: 40,
      fontStyle: 'italic',
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
    link: {
      color: colors.primary,
      textAlign: 'center',
      fontSize: 14,
      marginTop: 12,
    },
  });
