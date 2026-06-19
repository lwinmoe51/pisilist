import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useInvitations } from '../contexts/InvitationsContext';
import { useTheme } from '../theme/ThemeContext';
import { acceptInvitation, declineInvitation } from '../services/invitations';
import type { Invitation } from '../types';

interface Props {
  navigation: any;
}

const MAX_CONTENT_WIDTH = 600;

export default function InvitationsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { invitations, loading } = useInvitations();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const isWeb = Platform.OS === 'web';
  const contentMaxW = isWeb ? Math.min(width, MAX_CONTENT_WIDTH) : width;

  const handleAccept = async (inv: Invitation) => {
    if (!user) return;
    setProcessingIds((prev) => new Set(prev).add(inv.id));
    try {
      await acceptInvitation(inv.id, user.uid, inv.cardId);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept invitation.');
    }
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(inv.id);
      return next;
    });
  };

  const handleDecline = async (inv: Invitation) => {
    setProcessingIds((prev) => new Set(prev).add(inv.id));
    try {
      await declineInvitation(inv.id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to decline invitation.');
    }
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(inv.id);
      return next;
    });
  };

  const s = themedStyles(colors);

  const renderItem = ({ item }: { item: Invitation }) => {
    const isProcessing = processingIds.has(item.id);
    return (
      <View style={s.inviteRow}>
        <View style={s.inviteInfo}>
          <Text style={s.fromLabel}>From: {item.fromEmail}</Text>
          <Text style={s.cardLabel}>Card: "{item.cardTitle}"</Text>
        </View>
        <View style={s.buttons}>
          <TouchableOpacity
            style={[s.acceptBtn, isProcessing && s.btnDisabled]}
            onPress={() => handleAccept(item)}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            <Text style={s.acceptText}>ACCEPT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.declineBtn, isProcessing && s.btnDisabled]}
            onPress={() => handleDecline(item)}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            <Text style={s.declineText}>DECLINE</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.title}>Pending Invitations</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={s.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={[s.body, { alignSelf: isWeb ? 'center' : 'auto', width: '100%', maxWidth: contentMaxW } as any]}>
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : invitations.length === 0 ? (
          <View style={s.center}>
            <Text style={s.emptyText}>No pending invitations</Text>
          </View>
        ) : (
          <FlatList
            data={invitations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={s.listContent}
            ItemSeparatorComponent={() => <View style={s.separator} />}
          />
        )}
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
    title: { fontSize: 18, fontWeight: '600', color: colors.text },
    closeBtn: { fontSize: 18, color: colors.placeholder },
    body: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 15, color: colors.placeholder },
    listContent: { padding: 16 },
    inviteRow: { paddingVertical: 14 },
    inviteInfo: { marginBottom: 12 },
    fromLabel: { fontSize: 15, fontWeight: '500', color: colors.text, marginBottom: 4 },
    cardLabel: { fontSize: 14, color: colors.subtext },
    buttons: { flexDirection: 'row', gap: 12 },
    acceptBtn: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    acceptText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    declineBtn: {
      backgroundColor: colors.muted,
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    declineText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
    btnDisabled: { opacity: 0.5 },
    separator: { height: 1, backgroundColor: colors.border },
  });
