import { log, error } from "../utils/logger";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onSnapshot, query } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useCards } from '../contexts/CardsContext';
import { useInvitations } from '../contexts/InvitationsContext';
import { useTheme } from '../theme/ThemeContext';
import {
  createCard,
  updateCardCosmetic,
  deleteCard as deleteCardService,
  tasksQuery,
  docToTask,
} from '../services/cards';
import CardPreview from '../components/CardPreview';
import ConfirmModal from '../components/ConfirmModal';
import SkeletonCard from '../components/SkeletonCard';
import type { Card } from '../types';

interface Props {
  navigation: any;
}

/** Task preview data per card. */
interface CardTasks {
  unchecked: string[];
  taskCount: number;
  completedCount: number;
  reminderCount: number;
}

function getColumns(width: number) {
  if (width >= 1200) return 4;
  if (width >= 900) return 3;
  if (width >= 600) return 2;
  return 1;
}

const GRID_GAP = 16;
const MAX_CONTENT_WIDTH = 1200;

export default function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { cards, loading } = useCards();
  const { invitations } = useInvitations();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  // Confirm modal state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Task preview data per card
  const [cardTasks, setCardTasks] = useState<Map<string, CardTasks>>(new Map());

  const isWeb = Platform.OS === 'web';
  const columns = getColumns(width);
  const contentMaxWidth = isWeb ? MAX_CONTENT_WIDTH : 0;
  const hPad = 16;
  const usableWidth = Math.min(width, contentMaxWidth || width) - hPad * 2;
  const cardWidth = (usableWidth - GRID_GAP * (columns - 1)) / columns;

  // ── Subscribe to tasks for each card ──
  useEffect(() => {
    if (!cards.length) return;

    const unsubscribes: (() => void)[] = [];

    for (const card of cards) {
      const q = query(
        tasksQuery(card.id),
      );
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const tasks = snapshot.docs.map((d) => docToTask(d.id, d.data()));
          const unchecked = tasks
            .filter((t) => !t.completed)
            .map((t) => t.text);
          const completedCount = tasks.filter((t) => t.completed).length;
          const reminderCount = tasks.reduce(
            (sum, t) => sum + (t.reminders?.length ?? 0),
            0,
          );
          setCardTasks((prev) => {
            const next = new Map(prev);
            next.set(card.id, {
              unchecked,
              taskCount: tasks.length,
              completedCount,
              reminderCount,
            });
            return next;
          });
        },
        () => {
          // Silently handle permission errors for cards we can't read
        },
      );
      unsubscribes.push(unsub);
    }

    return () => unsubscribes.forEach((u) => u());
  }, [cards.map((c) => c.id).join(',')]);

  // Client-side search filter
  const query_ = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query_) return cards;
    return cards.filter((c) => c.title.toLowerCase().includes(query_));
  }, [cards, query_]);

  const pinned = useMemo(() => filtered.filter((c) => c.pinned), [filtered]);
  const others = useMemo(() => filtered.filter((c) => !c.pinned), [filtered]);

  const avatarLabel = user
    ? (user.displayName || user.email || '?')[0].toUpperCase()
    : '?';

  // ── Confirm helper ──
  const showConfirm = (title: string, message: string, action: () => void) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmVisible(true);
  };

  const handleConfirm = () => {
    setConfirmVisible(false);
    confirmAction?.();
    setConfirmAction(null);
  };

  const handleConfirmCancel = () => {
    setConfirmVisible(false);
    setConfirmAction(null);
  };

  // ── Card actions ──
  const handleCreateCard = async () => {
    const title = newTitle.trim();
    if (!title) {
      setModalVisible(false);
      setNewTitle('');
      return;
    }
    if (!user) return;
    log('[UI] handleCreateCard:', { uid: user.uid, title });
    setCreating(true);
    try {
      await createCard(user.uid, title);
      log('[UI] handleCreateCard SUCCESS');
    } catch (err: any) {
      error('[UI] handleCreateCard FAILED:', err);
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

  const handleTogglePin = useCallback(async (cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;
    log('[UI] handleTogglePin:', { cardId, currentPinned: card.pinned });
    try {
      await updateCardCosmetic(cardId, { pinned: !card.pinned });
      log('[UI] handleTogglePin SUCCESS');
    } catch (err: any) {
      error('[UI] handleTogglePin FAILED:', err);
      Alert.alert('Error', err.message);
    }
  }, [cards]);

  const handleChangeColor = useCallback(async (cardId: string, color: string | null) => {
    log('[UI] handleChangeColor:', { cardId, color });
    try {
      await updateCardCosmetic(cardId, { color });
      log('[UI] handleChangeColor SUCCESS');
    } catch (err: any) {
      error('[UI] handleChangeColor FAILED:', err);
      Alert.alert('Error', err.message);
    }
  }, []);

  const handleDeleteCard = useCallback((cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    const title = card?.title || 'this card';
    log('[UI] handleDeleteCard clicked, cardId:', cardId);
    showConfirm(
      'Delete Card',
      `Delete "${title}" and all its tasks?`,
      async () => {
        try {
          log('[UI] handleDeleteCard calling deleteCardService...');
          await deleteCardService(cardId);
          log('[UI] handleDeleteCard SUCCESS');
        } catch (err: any) {
          error('[UI] handleDeleteCard FAILED:', err);
          Alert.alert('Error', err.message || String(err));
        }
      },
    );
  }, [cards]);

  // ── Masonry: strict left-to-right dense packing per section ──
  const pinnedColumns = useMemo(() => {
    const cols: Card[][] = Array.from({ length: columns }, () => []);
    pinned.forEach((card, i) => {
      cols[i % columns].push(card);
    });
    return cols;
  }, [pinned, columns]);

  const othersColumns = useMemo(() => {
    const cols: Card[][] = Array.from({ length: columns }, () => []);
    others.forEach((card, i) => {
      cols[i % columns].push(card);
    });
    return cols;
  }, [others, columns]);

  const s = themedStyles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.logo}>PisiList</Text>
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
        {loading ? (
          <View style={s.skeletonGrid}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={{ width: cardWidth }}>
                <SkeletonCard height={100 + (i % 3) * 30} />
              </View>
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.center}>
            <Text style={s.placeholderIcon}>{query_ ? '🔍' : '📋'}</Text>
            <Text style={s.placeholderTitle}>
              {query_ ? 'No Matches' : 'No Cards Yet'}
            </Text>
            <Text style={s.placeholderSubtitle}>
              {query_
                ? 'No cards match your search.'
                : 'Tap the + button to create your first task list.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={loading} />}
          >
            {pinned.length > 0 && (
              <Text style={s.sectionLabel}>📌 Pinned</Text>
            )}
            {pinned.length > 0 && (
              <View style={s.masonryRow}>
                {pinnedColumns.map((col, colIdx) => (
                  <View key={`pin-${colIdx}`} style={s.masonryCol}>
                    {col.map((card) => (
                      <CardPreview
                        key={card.id}
                        card={card}
                        taskCount={cardTasks.get(card.id)?.taskCount ?? 0}
                        completedCount={cardTasks.get(card.id)?.completedCount ?? 0}
                        uncheckedTasks={cardTasks.get(card.id)?.unchecked ?? []}
                        reminderCount={cardTasks.get(card.id)?.reminderCount ?? 0}
                        currentUserId={user?.uid}
                        cardWidth={cardWidth}
                        onPress={() => handleCardPress(card.id)}
                        onTogglePin={handleTogglePin}
                        onChangeColor={handleChangeColor}
                        onDeleteCard={handleDeleteCard}
                      />
                    ))}
                  </View>
                ))}
              </View>
            )}

            {others.length > 0 && pinned.length > 0 && (
              <Text style={s.sectionLabel}>Others</Text>
            )}
            {others.length > 0 && (
              <View style={s.masonryRow}>
                {othersColumns.map((col, colIdx) => (
                  <View key={`other-${colIdx}`} style={s.masonryCol}>
                    {col.map((card) => (
                      <CardPreview
                        key={card.id}
                        card={card}
                        taskCount={cardTasks.get(card.id)?.taskCount ?? 0}
                        completedCount={cardTasks.get(card.id)?.completedCount ?? 0}
                        uncheckedTasks={cardTasks.get(card.id)?.unchecked ?? []}
                        reminderCount={cardTasks.get(card.id)?.reminderCount ?? 0}
                        currentUserId={user?.uid}
                        cardWidth={cardWidth}
                        onPress={() => handleCardPress(card.id)}
                        onTogglePin={handleTogglePin}
                        onChangeColor={handleChangeColor}
                        onDeleteCard={handleDeleteCard}
                      />
                    ))}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
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

      {/* Confirm Modal */}
      <ConfirmModal
        visible={confirmVisible}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={handleConfirm}
        onCancel={handleConfirmCancel}
      />
    </View>
  );
}

const themedStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
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
    logo: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.5,
    },
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
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
    // ── Body ──
    bodyWrap: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 100,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.subtext,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
      marginTop: 8,
    },
    // ── Masonry ──
    masonryRow: {
      flexDirection: 'row',
      gap: GRID_GAP,
      marginBottom: 16,
    },
    masonryCol: {
      flex: 1,
      gap: GRID_GAP,
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
    loadingText: { fontSize: 14, color: colors.placeholder },
    skeletonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GRID_GAP,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
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
