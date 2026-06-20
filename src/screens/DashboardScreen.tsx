import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useCards } from '../contexts/CardsContext';
import { useInvitations } from '../contexts/InvitationsContext';
import { useTheme } from '../theme/ThemeContext';
import { logOut } from '../services/auth';
import { createCard } from '../services/cards';
import CardPreview from '../components/CardPreview';
import type { Card } from '../types';

interface Props {
  navigation: any;
}

function getColumns(width: number, isWeb: boolean) {
  if (!isWeb) return 2;
  if (width >= 1200) return 4;
  if (width >= 768) return 3;
  return 2;
}

const MAX_CONTENT_WIDTH = 1200;
const GRID_GAP = 8;

export default function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { cards, loading, error } = useCards();
  const { invitations } = useInvitations();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const isWeb = Platform.OS === 'web';
  const columns = getColumns(width, isWeb);
  const contentMaxWidth = isWeb ? MAX_CONTENT_WIDTH : 0;

  const hPad = 16;
  const usableWidth = Math.min(width, contentMaxWidth || width) - hPad * 2;
  const cardWidth = (usableWidth - GRID_GAP * (columns - 1)) / columns;

  // Client-side search filter
  const query = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) return cards;
    return cards.filter((c) => c.title.toLowerCase().includes(query));
  }, [cards, query]);

  const pinned = filtered.filter((c) => c.pinned);
  const others = filtered.filter((c) => !c.pinned);

  // Avatar label from user displayName/email
  const avatarLabel = user
    ? (user.displayName || user.email || '?')[0].toUpperCase()
    : '?';

  const handleCreateCard = async () => {
    const title = newTitle.trim();
    if (!title) {
      setModalVisible(false);
      setNewTitle('');
      return;
    }
    if (!user) return;
    console.log('[UI] handleCreateCard:', { uid: user.uid, title });
    setCreating(true);
    try {
      await createCard(user.uid, title);
      console.log('[UI] handleCreateCard SUCCESS');
    } catch (err: any) {
      console.error('[UI] handleCreateCard FAILED:', err);
      Alert.alert('Error', err.message || 'Failed to create card.');
    }
    setCreating(false);
    setModalVisible(false);
    setNewTitle('');
  };

  const handleCardPress = useCallback(
    (cardId: string) => navigation.navigate('CardDetail', { cardId }),
    [navigation],
  );

  const renderCard = useCallback(
    ({ item }: { item: any }) => {
      const data = item as Card & { taskCount?: number; completedCount?: number };
      return (
        <CardPreview
          card={data}
          taskCount={(data as any).taskCount ?? 0}
          completedCount={(data as any).completedCount ?? 0}
          currentUserId={user?.uid}
          cardWidth={cardWidth}
          onPress={() => handleCardPress(data.id)}
        />
      );
    },
    [handleCardPress, cardWidth, user?.uid],
  );

  const renderSectionHeader = (title: string) => (
    <Text style={themedStyles(colors, width).sectionTitle}>{title}</Text>
  );

  const allData: Array<{ type: 'pinned' } | { type: 'others' } | Card> = [];
  if (pinned.length > 0) {
    allData.push({ type: 'pinned' } as any);
    allData.push(...pinned);
  }
  if (others.length > 0) {
    allData.push({ type: 'others' } as any);
    allData.push(...others);
  }

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (item.type === 'pinned') return renderSectionHeader('📌 Pinned');
      if (item.type === 'others') return renderSectionHeader('Others');
      return renderCard({ item });
    },
    [renderCard],
  );

  const s = themedStyles(colors, width);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header: Search + Bell + Avatar — matches LAYOUT.md */}
      <View style={s.header}>
        <View style={s.searchWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search your lists..."
            placeholderTextColor={colors.placeholder}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={s.bellButton}
          onPress={() => navigation.navigate('Invitations')}
          activeOpacity={0.7}
        >
          <Text style={s.bellIcon}>🔔</Text>
          {invitations.length > 0 && (
            <View style={s.bellBadge}>
              <Text style={s.bellBadgeText}>
                {invitations.length > 9 ? '9+' : invitations.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={s.avatar}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Text style={s.avatarLabel}>{avatarLabel}</Text>
        </TouchableOpacity>
      </View>

      {/* Card Grid */}
      <View style={[s.bodyWrap, contentMaxWidth > 0 && { alignSelf: 'center' as any, width: '100%', maxWidth: contentMaxWidth }]}>
        {error ? (
          <View style={s.center}>
            <Text style={s.errorText}>Error: {error}</Text>
          </View>
        ) : filtered.length === 0 && !loading ? (
          <View style={s.center}>
            <Text style={s.placeholderIcon}>{query ? '🔍' : '📋'}</Text>
            <Text style={s.placeholderTitle}>
              {query ? 'No Matches' : 'No Cards Yet'}
            </Text>
            <Text style={s.placeholderSubtitle}>
              {query
                ? 'No cards match your search.'
                : 'Tap the + button to create your first task list.'}
            </Text>
          </View>
        ) : (
          <FlatList
            key={`grid-${columns}`}
            data={allData}
            renderItem={renderItem}
            keyExtractor={(item: any) =>
              item.type ? `section-${item.type}` : item.id
            }
            numColumns={columns}
            columnWrapperStyle={
              allData.some((d: any) => d.type === 'pinned' || d.type === 'others')
                ? undefined
                : { gap: GRID_GAP } as any
            }
            contentContainerStyle={[s.gridContent, { gap: GRID_GAP }]}
            refreshControl={<RefreshControl refreshing={loading} />}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              loading ? (
                <View style={s.center}>
                  <Text style={s.loadingText}>Loading cards...</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={s.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Create Card Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          setNewTitle('');
        }}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[s.modalContent, { width: Math.min(width - 64, 420) }]}>
            <Text style={s.modalTitle}>New Card</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Card Title"
              placeholderTextColor={colors.placeholder}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              onSubmitEditing={handleCreateCard}
              returnKeyType="done"
            />
            <View style={s.modalButtons}>
              <TouchableOpacity
                style={s.modalCancel}
                onPress={() => {
                  setModalVisible(false);
                  setNewTitle('');
                }}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalCreate, creating && { opacity: 0.6 }]}
                onPress={handleCreateCard}
                disabled={creating}
              >
                <Text style={s.modalCreateText}>
                  {creating ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const themedStyles = (colors: ReturnType<typeof useTheme>['colors'], screenW: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.headerBg,
      boxShadow: colors.headerShadow,
      gap: 10,
    },
    // ── Search ──
    searchWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.muted,
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 40,
    },
    searchIcon: { fontSize: 14, marginRight: 6 },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      padding: 0,
    },
    // ── Bell ──
    bellButton: { position: 'relative', padding: 4 },
    bellIcon: { fontSize: 20 },
    bellBadge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: colors.danger,
      borderRadius: 9,
      minWidth: 18,
      height: 18,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    // ── Avatar ──
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
    // ── Section ──
    sectionTitle: {
      width: '100%',
      fontSize: 13,
      fontWeight: '600',
      color: colors.subtext,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 4,
    },
    // ── Body ──
    bodyWrap: { flex: 1 },
    gridContent: {
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 100,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    placeholderIcon: { fontSize: 48, marginBottom: 16 },
    placeholderTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    placeholderSubtitle: {
      fontSize: 14,
      color: colors.placeholder,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorText: { color: colors.danger, fontSize: 14 },
    loadingText: { fontSize: 14, color: colors.placeholder },
    // ── FAB ──
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 16,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fabIcon: { fontSize: 28, color: '#fff', lineHeight: 30 },
    // ── Modal ──
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.modalBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 24,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.inputBg,
      marginBottom: 16,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    modalCancel: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    modalCancelText: { fontSize: 15, color: colors.subtext },
    modalCreate: {
      paddingVertical: 10,
      paddingHorizontal: 24,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    modalCreateText: { fontSize: 15, color: '#fff', fontWeight: '600' },
  });
