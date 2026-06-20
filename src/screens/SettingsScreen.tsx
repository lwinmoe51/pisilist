import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { logOut } from '../services/auth';

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

  const avatarLabel = user
    ? (user.displayName || user.email || '?')[0].toUpperCase()
    : '?';
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';

  const handleSignOut = async () => {
    const confirmed = Platform.OS === 'web'
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
        Alert.alert('Error', err.message || 'Failed to sign out.');
      }
    }
  };

  const s = themedStyles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>User Profile</Text>
        <View style={{ width: 24 }} />
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
            <Text style={s.fieldValue}>{displayName}</Text>
          </View>

          {/* Email */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Email</Text>
            <Text style={s.fieldValue}>{email}</Text>
          </View>

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

          {/* App info */}
          <Text style={s.version}>PisiList v1.0.0</Text>
        </ScrollView>
      </View>
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
    // Fields (read-only)
    field: {
      width: '100%',
      marginBottom: 20,
    },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.subtext, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    fieldValue: {
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: colors.muted,
    },
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
    // Version
    version: { fontSize: 12, color: colors.placeholder, marginTop: 24 },
  });
