import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import {
  logOut,
  updateDisplayName,
  updateUserEmail,
  changePassword,
} from '../services/auth';
import { validateEmail, validatePassword, validateConfirmPassword, validateRequired } from '../utils/validation';

interface Props {
  navigation: any;
}

const MAX_CONTENT_WIDTH = 480;

export default function SettingsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { colors, isDark, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const contentW = isWeb ? Math.min(width - 64, MAX_CONTENT_WIDTH) : width - 64;

  // Editable fields
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Password modal
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState<{ current?: string; newPw?: string; confirm?: string }>({});
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  const avatarLabel = user
    ? (user.displayName || user.email || '?')[0].toUpperCase()
    : '?';

  const handleSave = async () => {
    setSaveMsg(null);
    const nErr = validateRequired(name, 'Name');
    const eErr = validateEmail(email);
    setNameError(nErr);
    setEmailError(eErr);
    if (nErr || eErr) return;

    setSaving(true);
    // Update name if changed
    if (name !== (user?.displayName || '')) {
      const { error } = await updateDisplayName(name.trim());
      if (error) {
        setSaving(false);
        setSaveMsg(error.message);
        return;
      }
    }
    // Update email if changed
    if (email.trim() !== (user?.email || '')) {
      const { error } = await updateUserEmail(email.trim());
      if (error) {
        setSaving(false);
        setSaveMsg(error.message);
        return;
      }
    }
    setSaving(false);
    setSaveMsg('Profile updated');
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    const cErr = validateRequired(currentPw, 'Current password');
    const nErr = validatePassword(newPw);
    const cfErr = validateConfirmPassword(newPw, confirmPw);
    setPwErrors({ current: cErr || undefined, newPw: nErr || undefined, confirm: cfErr || undefined });
    if (cErr || nErr || cfErr) return;

    setPwLoading(true);
    const { error } = await changePassword(currentPw, newPw);
    setPwLoading(false);
    if (error) {
      setPwMsg(error.message);
    } else {
      setPwMsg('Password changed');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    }
  };

  const handleSignOut = async () => {
    const confirmed = isWeb
      ? window.confirm('Are you sure you want to sign out?')
      : await new Promise<boolean>((resolve) => {
          Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Sign Out', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });
    if (confirmed) {
      try {
        await logOut();
      } catch (err: any) {
        console.error('[UI] handleSignOut FAILED:', err);
      }
    }
  };

  const clearPwErrors = () => setPwErrors({});

  const s = themedStyles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>User Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.7}>
          {saving ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={s.saveBtn}>SAVE</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={[s.body, { alignSelf: 'center', width: '100%', maxWidth: contentW } as any]}>
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View style={s.avatarLarge}>
            <Text style={s.avatarLargeText}>{avatarLabel}</Text>
          </View>

          {/* Name */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Name</Text>
            <TextInput
              style={[s.input, nameError && s.inputError]}
              value={name}
              onChangeText={(t) => { setName(t); if (nameError) setNameError(null); if (saveMsg) setSaveMsg(null); }}
              placeholder="Display Name"
              placeholderTextColor={colors.placeholder}
            />
            {nameError && <Text style={s.errorText}>{nameError}</Text>}
          </View>

          {/* Email */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Email</Text>
            <TextInput
              style={[s.input, emailError && s.inputError]}
              value={email}
              onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(null); if (saveMsg) setSaveMsg(null); }}
              placeholder="Email Address"
              placeholderTextColor={colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError && <Text style={s.errorText}>{emailError}</Text>}
          </View>

          {saveMsg && (
            <Text style={[s.saveMsg, saveMsg.includes('updated') ? s.saveMsgSuccess : s.saveMsgError]}>
              {saveMsg}
            </Text>
          )}

          {/* Change Password */}
          <TouchableOpacity style={s.changePwBtn} onPress={() => setPwModalVisible(true)} activeOpacity={0.7}>
            <Text style={s.changePwText}>CHANGE PASSWORD</Text>
          </TouchableOpacity>

          {/* Dark Mode Toggle */}
          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={(v) => setMode(v ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={s.version}>PisiList v1.0.0</Text>
        </ScrollView>
      </View>

      {/* Change Password Modal */}
      <Modal visible={pwModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={s.modalSheet}>
              <Text style={s.modalTitle}>Change Password</Text>

              <View style={s.modalField}>
                <Text style={s.modalFieldLabel}>Current Password</Text>
                <TextInput
                  style={[s.input, pwErrors.current && s.inputError]}
                  placeholder="Enter current password"
                  placeholderTextColor={colors.placeholder}
                  value={currentPw}
                  onChangeText={(t) => { setCurrentPw(t); clearPwErrors(); setPwMsg(null); }}
                  secureTextEntry
                />
                {pwErrors.current && <Text style={s.errorText}>{pwErrors.current}</Text>}
              </View>

              <View style={s.modalField}>
                <Text style={s.modalFieldLabel}>New Password</Text>
                <TextInput
                  style={[s.input, pwErrors.newPw && s.inputError]}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.placeholder}
                  value={newPw}
                  onChangeText={(t) => { setNewPw(t); clearPwErrors(); setPwMsg(null); }}
                  secureTextEntry
                />
                {pwErrors.newPw && <Text style={s.errorText}>{pwErrors.newPw}</Text>}
              </View>

              <View style={s.modalField}>
                <Text style={s.modalFieldLabel}>Confirm New Password</Text>
                <TextInput
                  style={[s.input, pwErrors.confirm && s.inputError]}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.placeholder}
                  value={confirmPw}
                  onChangeText={(t) => { setConfirmPw(t); clearPwErrors(); setPwMsg(null); }}
                  secureTextEntry
                />
                {pwErrors.confirm && <Text style={s.errorText}>{pwErrors.confirm}</Text>}
              </View>

              {pwMsg && (
                <Text style={[s.saveMsg, pwMsg.includes('changed') ? s.saveMsgSuccess : s.saveMsgError]}>
                  {pwMsg}
                </Text>
              )}

              <View style={s.modalActions}>
                <TouchableOpacity
                  style={s.modalCancel}
                  onPress={() => { setPwModalVisible(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwErrors({}); setPwMsg(null); }}
                  activeOpacity={0.7}
                >
                  <Text style={s.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.modalConfirm, pwLoading && { opacity: 0.7 }]}
                  onPress={handleChangePassword}
                  disabled={pwLoading}
                  activeOpacity={0.7}
                >
                  {pwLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={s.modalConfirmText}>Update</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const themedStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.headerBg,
    },
    backArrow: { fontSize: 24, color: colors.primary },
    headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
    saveBtn: { fontSize: 16, fontWeight: '600', color: colors.primary },
    body: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, alignItems: 'center' },
    // Avatar
    avatarLarge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 28,
    },
    avatarLargeText: { color: '#fff', fontSize: 36, fontWeight: '700' },
    // Fields
    field: { width: '100%', marginBottom: 16 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.subtext, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    input: {
      fontSize: 16,
      color: colors.text,
      borderWidth: 0,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: colors.inputBg,
      boxShadow: colors.cardShadow,
    },
    inputError: { borderWidth: 1, borderColor: colors.danger },
    errorText: { color: colors.danger, fontSize: 12, marginTop: 4, marginLeft: 4 },
    saveMsg: { fontSize: 13, textAlign: 'center', marginBottom: 12, marginTop: 4 },
    saveMsgSuccess: { color: '#4caf50' },
    saveMsgError: { color: colors.danger },
    // Change password button
    changePwBtn: {
      width: '100%',
      paddingVertical: 14,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.primary,
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 4,
    },
    changePwText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
    // Row with switch
    fieldRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginBottom: 20,
    },
    // Sign out
    signOutBtn: {
      width: '100%',
      paddingVertical: 14,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: colors.danger,
      alignItems: 'center',
      marginTop: 24,
    },
    signOutText: { fontSize: 16, color: colors.danger, fontWeight: '600' },
    version: { fontSize: 12, color: colors.placeholder, marginTop: 24 },
    // Password modal
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modalBg,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalSheet: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 24,
      width: 360,
      maxWidth: '100%',
      borderWidth: 1,
      borderColor: colors.border,
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 20, textAlign: 'center' },
    modalField: { marginBottom: 16 },
    modalFieldLabel: { fontSize: 13, fontWeight: '600', color: colors.subtext, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    modalCancel: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    modalCancelText: { fontSize: 14, color: colors.subtext, fontWeight: '600' },
    modalConfirm: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    modalConfirmText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  });
