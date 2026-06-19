import React, { useCallback } from 'react';
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

/** Responsive column count based on screen width. */
function getColumns(width: number, isWeb: boolean) {
  if (!isWeb) return 2; // mobile always 2
  if (width >= 1200) return 4;
  if (width >= 768) return 3;
  return 2;
}

/** Maximum content width for web centering; 0 = no cap. */
const MAX_CONTENT_WIDTH = 1200;
const GRID_GAP = 12;

export default function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { cards, loading, error } = useCards();
  const { invitations } = useInvitations();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [modalVisible, setModalVisible] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  const isWeb = Platform.OS === 'web';
  const columns = getColumns(width, isWeb);
  const contentMaxWidth = isWeb ? MAX_CONTENT_WIDTH : 0;

  // Card width accounts for grid gap and horizontal padding
  const hPad = 16;
  const usableWidth = Math.min(width, contentMaxWidth || width) - hPad * 2;
  const cardWidth = (usableWidth - GRID_GAP * (columns - 1)) / columns;

  const pinned = cards.filter((c) => c.pinned);
  const others = cards.filter((c) => !c.pinned);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logOut();
        },
      },
    ]);
  };

  const handleCreateCard = async () => {
    const title = newTitle.trim();
    if (!title) {
      setModalVisible(false);
      setNewTitle('');
      return;
    }
    if (!user) return;
    setCreating(true);
    try {
      await createCard(user.uid, title);
    } catch (err: any) {
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
    <Text style={themedStyles(colors).sectionTitle}>{title}</Text>
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

  const s = themedStyles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.brand}>PisiList</Text>
        </View>
        <View style={s.headerRight}>
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
          <TouchableOpacity onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={s.signOut}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting */}
      <View style={s.greetingRow}>
        <Text style={s.greeting}>
          Welcome, {user?.displayName || user?.email}
        </Text>
      </View>

      {/* Card Grid */}
      <View style={[s.bodyWrap, contentMaxWidth > 0 && { alignSelf: 'center' as any, width: '100%', maxWidth: contentMaxWidth }]}>
        {error ? (
          <View style={s.center}>
            <Text style={s.errorText}>Error: {error}</Text>
          </View>
        ) : cards.length === 0 && !loading ? (
          <View style={s.center}>
            <Text style={s.placeholderIcon}>📋</Text>
            <Text style={s.placeholderTitle}>No Cards Yet</Text>
            <Text style={s.placeholderSubtitle}>
              Tap the + button to create your first task list.
            </Text>
          </View>
        ) : (
          <FlatList
            data={allData}
            renderItem={renderItem}
            keyExtractor={(item: any) =>
              item.type ? `section-${item.type}` : item.id
            }
            numColumns={columns}
            columnWrapperStyle={
              allData.some((d: any) => d.type === 'pinned' || d.type === 'others')
                ? undefined
                : { justifyContent: 'space-between' as any, gap: GRID_GAP }
            }
            contentContainerStyle={s.gridContent}
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

const themedStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: colors.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center' },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
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
    brand: { fontSize: 20, fontWeight: '700', color: colors.text },
    signOut: { fontSize: 14, color: colors.danger, fontWeight: '500' },
    greetingRow: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
    greeting: { fontSize: 14, color: colors.subtext },
    sectionTitle: {
      width: '100%',
      fontSize: 13,
      fontWeight: '600',
      color: colors.subtext,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 6,
    },
    bodyWrap: { flex: 1 },
    gridContent: { paddingHorizontal: 16, paddingBottom: 100 },
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
    fab: {
      position: 'absolute',
      bottom: 30,
      right: 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: `0 4px 8px ${colors.primary}59`,
      elevation: 6,
    },
    fabIcon: { fontSize: 30, color: '#fff', lineHeight: 32 },
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
