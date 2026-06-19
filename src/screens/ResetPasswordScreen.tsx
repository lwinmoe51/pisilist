import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { resetPassword } from '../services/auth';

interface Props {
  navigation: any;
}

const FORM_MAX_WIDTH = 400;

export default function ResetPasswordScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const isWeb = Platform.OS === 'web';
  const formWidth = isWeb ? Math.min(width - 64, FORM_MAX_WIDTH) : width - 64;

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    const { success, error } = await resetPassword(email.trim());
    setLoading(false);
    if (error) {
      Alert.alert('Reset failed', error.message);
    } else {
      setSent(true);
    }
  };

  const s = themedStyles(colors);

  if (sent) {
    return (
      <View style={s.container}>
        <View style={[s.inner, { width: formWidth, alignSelf: 'center' }]}>
          <Text style={s.title}>Check Your Email</Text>
          <Text style={s.instructions}>
            A password reset link has been sent to {email.trim()}. Follow the
            instructions in the email to reset your password.
          </Text>
          <TouchableOpacity
            style={s.button}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={s.buttonText}>BACK TO LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.inner, { width: formWidth, alignSelf: 'center' }]}>
        <Text style={s.title}>Reset Password</Text>
        <Text style={s.instructions}>
          Enter your email address and we'll send you a link to reset your
          password.
        </Text>

        <TextInput
          style={s.input}
          placeholder="Email Address"
          placeholderTextColor={colors.placeholder}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled]}
          onPress={handleReset}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>SEND RESET LINK</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.link}>Back to Login</Text>
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
      marginBottom: 16,
    },
    instructions: {
      fontSize: 14,
      textAlign: 'center',
      color: colors.subtext,
      marginBottom: 24,
      lineHeight: 20,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      marginBottom: 14,
      color: colors.text,
      backgroundColor: colors.inputBg,
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
